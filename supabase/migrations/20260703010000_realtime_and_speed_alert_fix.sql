-- =====================================================================
-- Correções pós-teste (2026-07-03):
-- 1) Habilitar REALTIME em vehicle_alerts (estava fora da publicação, por
--    isso os alertas só apareciam ao recarregar, não ao vivo).
-- 2) Alerta de limite de velocidade: usar o MENOR limite habilitado entre
--    as preferências (não mais amarrado ao "dono" do veículo), para o
--    alerta funcionar independentemente de quem cadastrou o veículo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Realtime: adiciona vehicle_alerts à publicação (idempotente)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vehicle_alerts'
  ) then
    execute 'alter publication supabase_realtime add table public.vehicle_alerts';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Trigger atualizado: velocidade usa o menor limite habilitado.
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

  -- última posição válida ANTERIOR deste veículo
  select p.speed, p.ignition
    into prev_speed, prev_ignition
  from public.positions p
  where p.vehicle_id = new.vehicle_id
    and p.valid = true
    and p.id <> new.id
    and coalesce(p.recorded_at, p.created_at) <= coalesce(new.recorded_at, new.created_at)
  order by coalesce(p.recorded_at, p.created_at) desc, p.id desc
  limit 1;

  -- Ignição ligada / desligada (transição)
  if new.ignition is true and coalesce(prev_ignition, false) = false then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'ignicao_ligada', 'Ignição ligada', new.latitude, new.longitude);
  elsif new.ignition is false and prev_ignition is true then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'ignicao_desligada', 'Ignição desligada', new.latitude, new.longitude);
  end if;

  -- Rastreador em movimento (parado -> movendo). Limiar de 5 km/h evita jitter.
  if coalesce(new.speed, 0) > 5 and coalesce(prev_speed, 0) <= 5 then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'movimento', 'Rastreador em movimento', new.latitude, new.longitude);
  end if;

  -- Limite de velocidade: menor limite habilitado entre as preferências.
  -- (Se ninguém habilitou 'limite_velocidade', não gera alerta.)
  select min(np.speed_limit_kmh) into v_limit
  from public.notification_preferences np
  where np.limite_velocidade = true;

  if v_limit is not null
     and coalesce(new.speed, 0) > v_limit
     and coalesce(prev_speed, 0) <= v_limit then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (
      new.vehicle_id,
      'limite_velocidade',
      'Excesso de velocidade: ' || round(new.speed)::text || ' km/h',
      new.latitude,
      new.longitude
    );
  end if;

  -- Sincroniza colunas de resumo do veículo com a última posição.
  update public.vehicles v
  set last_update   = coalesce(new.recorded_at, new.created_at),
      last_location = jsonb_build_object(
        'lat', new.latitude,
        'lng', new.longitude,
        'speed', new.speed,
        'ignition', new.ignition,
        'heading', new.heading
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
