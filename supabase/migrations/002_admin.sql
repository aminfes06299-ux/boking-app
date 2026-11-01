-- Fonctions réservées à l'administrateur (fuseau et e-mails gérés côté serveur)
create function admin_create_booking(p_client uuid, p_local timestamp) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_start timestamptz;
begin
  if not is_admin() then raise exception 'not_allowed'; end if;
  v_start := p_local at time zone (select timezone from app_settings where id = 1);
  insert into bookings (client_id, starts_at, ends_at) values (p_client, v_start, v_start + interval '60 minutes') returning id into v_id;
  insert into email_outbox (kind, booking_id) values ('confirmed_client', v_id), ('confirmed_admin', v_id);
  return v_id;
exception when exclusion_violation then raise exception 'slot_unavailable';
end $$;

create function admin_set_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not_allowed'; end if;
  update bookings set status = p_status where id = p_id;
  if p_status = 'cancelled' then
    insert into email_outbox (kind, booking_id) values ('cancelled_client', p_id), ('cancelled_admin', p_id);
  end if;
end $$;

create function admin_add_exception(p_kind text, p_from timestamp, p_to timestamp, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare tz text := (select timezone from app_settings where id = 1);
begin
  if not is_admin() then raise exception 'not_allowed'; end if;
  insert into exceptions (kind, starts_at, ends_at, note) values (p_kind, p_from at time zone tz, p_to at time zone tz, p_note);
end $$;

revoke all on function admin_create_booking, admin_set_status, admin_add_exception from public, anon;
grant execute on function admin_create_booking, admin_set_status, admin_add_exception to authenticated;
