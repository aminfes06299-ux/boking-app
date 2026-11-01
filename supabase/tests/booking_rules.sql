-- Tests des règles critiques. À exécuter dans le SQL Editor Supabase : tout est annulé à la fin (rollback).
begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'test@example.com');
do $$
declare v timestamptz := ((date_trunc('week', now() at time zone 'Africa/Casablanca') + interval '14 days' + interval '12 hours') at time zone 'Africa/Casablanca'); -- un lundi, 12h, dans ~2 semaines
        c uuid := '00000000-0000-0000-0000-000000000001';
begin
  assert not slot_is_bookable(now() - interval '1 day'), 'passé refusé';
  assert slot_is_bookable(v), 'jour ouvré libre = réservable';
  assert not slot_is_bookable(v + interval '30 minutes'), 'créneau non aligné refusé';
  assert not slot_is_bookable(v + interval '6 days'), 'jour de repos refusé';
  assert not slot_is_bookable(now() + interval '90 days'), 'au-delà de l''horizon refusé';
  begin insert into bookings (client_id, starts_at, ends_at) values (c, v, v + interval '90 minutes'); assert false, 'durée <> 60 min doit échouer';
  exception when check_violation then null; end;
  insert into bookings (client_id, starts_at, ends_at) values (c, v, v + interval '60 minutes');
  assert not slot_is_bookable(v), 'créneau réservé = indisponible';
  begin insert into bookings (client_id, starts_at, ends_at) values (c, v + interval '30 minutes', v + interval '90 minutes'); assert false, 'chevauchement doit échouer';
  exception when exclusion_violation then null; end;
  insert into exceptions (kind, starts_at, ends_at) values ('block', v + interval '1 day', v + interval '1 day 1 hour');
  assert not slot_is_bookable(v + interval '1 day'), 'créneau bloqué refusé';
  raise notice 'TOUS LES TESTS PASSENT';
end $$;
rollback;
