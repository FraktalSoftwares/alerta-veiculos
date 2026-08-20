-- =====================================================================
-- Cerca virtual (geofence) — detecção SERVER-SIDE de SAÍDA.
-- Usa a tabela EXISTENTE `virtual_fences` (por equipment_id; o web já faz o CRUD).
-- Se o veículo SAI do círculo (estava dentro, agora fora) → alerta 'cerca_violada'
-- → feed web (realtime) + push mobile (edge function já trata cerca_violada).
-- =====================================================================

-- (limpeza) remove tabela duplicada de uma versão anterior desta migration, se existir.
drop trigger if exists trg_geofence_exit on public.positions;
drop table if exists public.geofences cascade;

-- Distância em metros (haversine).
create or replace function public.geo_distance_m(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- Trigger de SAÍDA da cerca, lendo virtual_fences (equipment -> vehicle).
create or replace function public.detect_geofence_exit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prev_lat double precision; prev_lon double precision; g record;
begin
  if new.valid is not true or new.vehicle_id is null or new.latitude is null then
    return new;
  end if;

  select p.latitude, p.longitude into prev_lat, prev_lon
  from public.positions p
  where p.vehicle_id = new.vehicle_id and p.valid = true and p.id <> new.id
    and coalesce(p.recorded_at, p.created_at) <= coalesce(new.recorded_at, new.created_at)
  order by coalesce(p.recorded_at, p.created_at) desc, p.id desc
  limit 1;
  if prev_lat is null then return new; end if;

  for g in
    select vf.name, vf.latitude, vf.longitude, vf.radius
    from public.virtual_fences vf
    join public.equipment e on e.id = vf.equipment_id
    where e.vehicle_id = new.vehicle_id and vf.notify_on_exit = true
  loop
    if public.geo_distance_m(new.latitude, new.longitude, g.latitude::double precision, g.longitude::double precision) > g.radius
       and public.geo_distance_m(prev_lat, prev_lon, g.latitude::double precision, g.longitude::double precision) <= g.radius
       and not exists (
         select 1 from public.vehicle_alerts a
         where a.vehicle_id = new.vehicle_id and a.alert_type = 'cerca_violada'
           and a.created_at > now() - interval '10 minutes')
    then
      insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
      values (new.vehicle_id, 'cerca_violada',
        'Saiu da cerca' || coalesce(' ' || g.name, ''), new.latitude, new.longitude);
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists trg_geofence_exit on public.positions;
create trigger trg_geofence_exit
  after insert on public.positions
  for each row execute function public.detect_geofence_exit();
