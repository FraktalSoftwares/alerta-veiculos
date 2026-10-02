-- =====================================================================
-- 1) Bateria do J16 (GT06) em %
--    O J16 só informa bateria nos pacotes de HEARTBEAT (0x13) e ALARME
--    (0x16) — o de localização (0x12) não traz. Vem como NÍVEL 0..6
--    (0 sem energia, 1 extremamente baixa ... 6 muito alta) da bateria
--    INTERNA do rastreador, + bit2 do "terminal info" = ligado na energia
--    do veículo (carregando). Convertemos nível -> % (nível * 100 / 6).
--    Gravado direto em vehicles (não em positions, que não recebe heartbeat).
--
-- 2) Voltagem do 8310 (Suntech) também a partir do ALT
--    Antes só líamos o campo 27 do STT. Quando o último pacote é um ALT
--    (ex.: alerta de corte de energia) a voltagem ficava null e o app
--    mostrava "-". No ALT o campo 27 também é a tensão principal.
-- =====================================================================

alter table public.vehicles
  add column if not exists battery_level      smallint,
  add column if not exists battery_pct        smallint,
  add column if not exists external_power     boolean,
  add column if not exists battery_updated_at timestamptz;

-- Decodifica (nível, terminal info) de um pacote J16 em hex. null se não tiver bateria.
create or replace function public.decode_j16_battery(p_row text)
returns table (level smallint, pct smallint, external_power boolean)
language plpgsql
immutable
as $$
declare
  b    bytea;
  proto int;
  ti   int;
  vl   int;
  lbs  int;
begin
  if p_row is null or lower(left(p_row, 4)) <> '7878' then
    return;
  end if;
  b := decode(p_row, 'hex');
  proto := get_byte(b, 3);

  if proto = 19 and length(b) >= 8 then            -- 0x13 heartbeat
    ti := get_byte(b, 4);
    vl := get_byte(b, 5);
  elsif proto = 22 and length(b) >= 24 then        -- 0x16 alarme
    lbs := get_byte(b, 22);                         -- tamanho do bloco LBS (não conta o próprio byte)
    if length(b) < 25 + lbs then return; end if;
    ti := get_byte(b, 23 + lbs);
    vl := get_byte(b, 24 + lbs);
  else
    return;
  end if;

  if vl not between 0 and 6 then return; end if;

  level := vl;
  pct := round(vl * 100.0 / 6);
  external_power := (ti & 4) <> 0;
  return next;
exception when others then
  return;
end;
$$;

create or replace function public.tg_j16_battery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d record;
begin
  select * into d from public.decode_j16_battery(new.row);
  if d.level is null then
    return new;
  end if;

  update public.vehicles v
  set battery_level      = d.level,
      battery_pct        = d.pct,
      external_power     = d.external_power,
      battery_updated_at = coalesce(new.created_at, now())
  from public.equipment e
  where e.imei = new.identificador
    and v.id = e.vehicle_id;

  return new;
exception when others then
  -- nunca derrubar a ingestão por causa da bateria
  return new;
end;
$$;

drop trigger if exists tg_j16_battery on public.pacotes_rastreador_j16;
create trigger tg_j16_battery
after insert on public.pacotes_rastreador_j16
for each row execute function public.tg_j16_battery();

-- Backfill: último heartbeat/alarme de cada IMEI.
with last_pkt as (
  select distinct on (p.identificador) p.identificador, p.created_at, d.*
  from public.pacotes_rastreador_j16 p
  cross join lateral public.decode_j16_battery(p.row) d
  where p.created_at > now() - interval '7 days'
    and substr(lower(p.row), 7, 2) in ('13', '16')
  order by p.identificador, p.id desc
)
update public.vehicles v
set battery_level      = lp.level,
    battery_pct        = lp.pct,
    external_power     = lp.external_power,
    battery_updated_at = lp.created_at
from last_pkt lp
join public.equipment e on e.imei = lp.identificador
where v.id = e.vehicle_id;

-- ---------------------------------------------------------------------
-- 2) detect_vehicle_alerts: voltagem do 8310 também do ALT
--    (idêntica à 20260901000000 exceto o "like 'STT;%'")
-- ---------------------------------------------------------------------
create or replace function public.detect_vehicle_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev_speed    numeric;
  prev_ignition boolean;
  v_limit       integer;
begin
  if new.valid is not true or new.vehicle_id is null then
    return new;
  end if;

  select p.speed, p.ignition
    into prev_speed, prev_ignition
  from public.positions p
  where p.vehicle_id = new.vehicle_id
    and p.valid = true
    and p.id <> new.id
    and coalesce(p.recorded_at, p.created_at) <= coalesce(new.recorded_at, new.created_at)
  order by coalesce(p.recorded_at, p.created_at) desc, p.id desc
  limit 1;

  if new.ignition is true and coalesce(prev_ignition, false) = false
     and exists (select 1 from public.vehicle_alert_preferences vap
        where vap.vehicle_id = new.vehicle_id and vap.ignicao_ligada = true)
     and not exists (select 1 from public.vehicle_alerts a
        where a.vehicle_id = new.vehicle_id and a.alert_type = 'ignicao_ligada'
          and a.created_at > now() - interval '3 minutes') then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'ignicao_ligada', 'Ignição ligada', new.latitude, new.longitude);
  elsif new.ignition is false and prev_ignition is true
     and exists (select 1 from public.vehicle_alert_preferences vap
        where vap.vehicle_id = new.vehicle_id and vap.ignicao_desligada = true)
     and not exists (select 1 from public.vehicle_alerts a
        where a.vehicle_id = new.vehicle_id and a.alert_type = 'ignicao_desligada'
          and a.created_at > now() - interval '3 minutes') then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'ignicao_desligada', 'Ignição desligada', new.latitude, new.longitude);
  end if;

  if coalesce(new.speed, 0) > 5 and coalesce(prev_speed, 0) <= 5
     and exists (select 1 from public.vehicle_alert_preferences vap
        where vap.vehicle_id = new.vehicle_id and vap.movimento = true)
     and not exists (select 1 from public.vehicle_alerts a
        where a.vehicle_id = new.vehicle_id and a.alert_type = 'movimento'
          and a.created_at > now() - interval '10 minutes') then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'movimento', 'Rastreador em movimento', new.latitude, new.longitude);
  end if;

  select min(vap.speed_limit_kmh) into v_limit
  from public.vehicle_alert_preferences vap
  where vap.vehicle_id = new.vehicle_id and vap.limite_velocidade = true;

  if v_limit is not null
     and coalesce(new.speed, 0) > v_limit
     and coalesce(prev_speed, 0) <= v_limit
     and not exists (select 1 from public.vehicle_alerts a
        where a.vehicle_id = new.vehicle_id and a.alert_type = 'limite_velocidade'
          and a.created_at > now() - interval '10 minutes') then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (
      new.vehicle_id, 'limite_velocidade',
      'Excesso de velocidade: ' || round(new.speed)::text || ' km/h',
      new.latitude, new.longitude
    );
  end if;

  update public.vehicles v
  set last_update   = coalesce(new.recorded_at, new.created_at),
      last_location = jsonb_build_object(
        'lat', new.latitude, 'lng', new.longitude,
        'speed', new.speed, 'ignition', new.ignition, 'heading', new.heading,
        'modelo', new.modelo,
        'voltage', case
          when (new.raw like 'STT;%' or new.raw like 'ALT;%')
               and split_part(new.raw, ';', 27) ~ '^[0-9]+(\.[0-9]+)?$'
          then split_part(new.raw, ';', 27)::numeric
          else null
        end
      ),
      last_ignition_on = case
        when new.ignition is true then coalesce(new.recorded_at, new.created_at)
        else v.last_ignition_on
      end,
      last_ignition_off = case
        when new.ignition is false and prev_ignition is true
          then coalesce(new.recorded_at, new.created_at)
        else v.last_ignition_off
      end,
      updated_at = now()
  where v.id = new.vehicle_id;

  return new;
end;
$$;
