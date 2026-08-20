-- =====================================================================
-- Cercas virtuais (geofence) POR VEÍCULO — detecção SERVER-SIDE.
-- Salva centro (lat/lng) + raio; se o veículo SAI do círculo (estava dentro,
-- agora fora) gera alerta 'cerca_violada' → feed web (realtime) + push mobile.
-- =====================================================================

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

create table if not exists public.geofences (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  name           text,
  center_lat     double precision not null,
  center_lng     double precision not null,
  radius_m       integer not null default 100,
  speed_limit_kmh integer,
  is_primary     boolean not null default false,
  notify_on_enter boolean not null default false,
  notify_on_exit  boolean not null default true,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_geofences_vehicle on public.geofences (vehicle_id);

alter table public.geofences enable row level security;
-- Gerencia cercas só de veículos que enxerga (vehicles já é RLS-scoped).
drop policy if exists "geo_all" on public.geofences;
create policy "geo_all" on public.geofences
  for all using (vehicle_id in (select id from public.vehicles))
  with check (vehicle_id in (select id from public.vehicles));

-- Trigger de SAÍDA da cerca (independente do detect_vehicle_alerts).
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
    select * from public.geofences
    where vehicle_id = new.vehicle_id and notify_on_exit = true
  loop
    if public.geo_distance_m(new.latitude, new.longitude, g.center_lat, g.center_lng) > g.radius_m
       and public.geo_distance_m(prev_lat, prev_lon, g.center_lat, g.center_lng) <= g.radius_m
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
