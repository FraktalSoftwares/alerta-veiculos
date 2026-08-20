-- =====================================================================
-- detect_vehicle_alerts: só gera alerta quando ALGUÉM optou por aquele
-- alerta NAQUELE veículo (vehicle_alert_preferences). Antes, ignição e
-- movimento eram gerados para TODOS os veículos incondicionalmente, o que
-- (1) enchia o feed mesmo com tudo desligado e (2) entupia a fila de push,
-- atrasando os pushes realmente desejados.
--
-- Mantém: limite de velocidade por veículo + anti-spam (dedup) + sincronismo
-- do resumo do veículo.
-- =====================================================================
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

  -- Ignição (transição) — só se alguém optou; dedup 3 min (evita flapping)
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

  -- Movimento (parado -> movendo, limiar 5 km/h) — só se alguém optou; dedup 10 min
  if coalesce(new.speed, 0) > 5 and coalesce(prev_speed, 0) <= 5
     and exists (select 1 from public.vehicle_alert_preferences vap
        where vap.vehicle_id = new.vehicle_id and vap.movimento = true)
     and not exists (select 1 from public.vehicle_alerts a
        where a.vehicle_id = new.vehicle_id and a.alert_type = 'movimento'
          and a.created_at > now() - interval '10 minutes') then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'movimento', 'Rastreador em movimento', new.latitude, new.longitude);
  end if;

  -- Limite de velocidade POR VEÍCULO (só quem optou entra no min) — dedup 10 min
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

  -- Sincroniza colunas de resumo do veículo com a última posição.
  update public.vehicles v
  set last_update   = coalesce(new.recorded_at, new.created_at),
      last_location = jsonb_build_object(
        'lat', new.latitude, 'lng', new.longitude,
        'speed', new.speed, 'ignition', new.ignition, 'heading', new.heading
      ),
      last_ignition_on = case
        when new.ignition is true then coalesce(new.recorded_at, new.created_at)
        else v.last_ignition_on
      end,
      updated_at = now()
  where v.id = new.vehicle_id;

  return new;
end;
$$;
