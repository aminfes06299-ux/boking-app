-- Plateforme de réservation privée — schéma, RLS, anti-double-réservation
create extension if not exists btree_gist;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text, full_name text, phone text,
  role text not null default 'client' check (role in ('client','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table app_settings (
  id int primary key default 1 check (id = 1),
  notify_email text,
  contact_info text,
  confirmation_message text default 'Merci de vous présenter quelques minutes avant la séance.',
  timezone text not null default 'Africa/Casablanca',
  min_notice_hours int not null default 12,
  horizon_days int not null default 30,
  cancel_hours int not null default 24
);
insert into app_settings (id) values (1);

-- weekday: 0 = dimanche … 6 = samedi. Valeurs par défaut (lun–ven) à ajuster.
create table weekly_availability (
  weekday smallint primary key check (weekday between 0 and 6),
  active boolean not null default false,
  start_time time not null default '11:00',
  end_time time not null default '18:00'
);
insert into weekly_availability (weekday, active) values (0,false),(1,true),(2,true),(3,true),(4,true),(5,true),(6,false);

-- kind: 'block' (congé / indisponibilité) ou 'open' (ouverture exceptionnelle)
create table exceptions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('block','open')),
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  note text
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  client_id uuid not null references profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  check (ends_at - starts_at = interval '60 minutes'),
  constraint no_overlap exclude using gist (tstzrange(starts_at, ends_at) with &&) where (status in ('confirmed','completed'))
);

create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null,  -- confirmed_client | confirmed_admin | cancelled_client | cancelled_admin
  booking_id uuid not null references bookings(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts int not null default 0, last_error text,
  created_at timestamptz not null default now()
);

-- Profil créé automatiquement pour les comptes invités (inscriptions publiques désactivées dans Supabase)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and active)
$$;

alter table profiles enable row level security;
alter table app_settings enable row level security;
alter table weekly_availability enable row level security;
alter table exceptions enable row level security;
alter table bookings enable row level security;
alter table email_outbox enable row level security;

create policy profiles_self on profiles for select using (id = auth.uid());
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());
create policy bookings_self on bookings for select using (client_id = auth.uid());
create policy bookings_admin on bookings for all using (is_admin()) with check (is_admin());
create policy settings_admin on app_settings for all using (is_admin()) with check (is_admin());
create policy avail_admin on weekly_availability for all using (is_admin()) with check (is_admin());
create policy exc_admin on exceptions for all using (is_admin()) with check (is_admin());
create policy outbox_admin on email_outbox for select using (is_admin());

create function slot_is_bookable(p_start timestamptz) returns boolean language plpgsql stable security definer set search_path = public as $$
declare st app_settings%rowtype; loc timestamp; p_end timestamptz := p_start + interval '60 minutes';
begin
  select * into st from app_settings where id = 1;
  loc := p_start at time zone st.timezone;
  if p_start < now() + make_interval(hours => st.min_notice_hours) then return false; end if;
  if p_start > now() + make_interval(days => st.horizon_days) then return false; end if;
  if date_part('minute', loc) <> 0 or date_part('second', loc) <> 0 then return false; end if;
  if exists (select 1 from exceptions e where e.kind = 'block' and tstzrange(e.starts_at, e.ends_at) && tstzrange(p_start, p_end)) then return false; end if;
  if not (
    exists (select 1 from weekly_availability w where w.active and w.weekday = extract(dow from loc)::int
            and loc::time >= w.start_time and loc::time + interval '60 minutes' <= w.end_time)
    or exists (select 1 from exceptions e where e.kind = 'open' and e.starts_at <= p_start and e.ends_at >= p_end)
  ) then return false; end if;
  return not exists (select 1 from bookings b where b.status in ('confirmed','completed') and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_start, p_end));
end $$;

create function get_available_slots(p_date date) returns setof timestamptz language sql stable security definer set search_path = public as $$
  select t from (select ((p_date::timestamp + make_interval(hours => h)) at time zone (select timezone from app_settings where id = 1)) as t from generate_series(0, 23) h) s
  where slot_is_bookable(t) and exists (select 1 from profiles where id = auth.uid() and active) order by t
$$;

create function book_slot(p_start timestamptz) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and active) then raise exception 'not_allowed'; end if;
  if not slot_is_bookable(p_start) then raise exception 'slot_unavailable'; end if;
  insert into bookings (client_id, starts_at, ends_at) values (auth.uid(), p_start, p_start + interval '60 minutes') returning id into v_id;
  insert into email_outbox (kind, booking_id) values ('confirmed_client', v_id), ('confirmed_admin', v_id);
  return v_id;
exception when exclusion_violation then raise exception 'slot_unavailable';
end $$;

create function cancel_booking(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update bookings set status = 'cancelled'
   where id = p_id and client_id = auth.uid() and status = 'confirmed'
     and starts_at > now() + make_interval(hours => (select cancel_hours from app_settings where id = 1));
  if not found then raise exception 'not_cancellable'; end if;
  insert into email_outbox (kind, booking_id) values ('cancelled_client', p_id), ('cancelled_admin', p_id);
end $$;

revoke all on function slot_is_bookable, get_available_slots, book_slot, cancel_booking from public, anon;
grant execute on function get_available_slots, book_slot, cancel_booking to authenticated;
