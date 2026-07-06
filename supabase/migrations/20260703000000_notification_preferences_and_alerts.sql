-- =====================================================================
-- Preferências de alerta (por usuário) + detecção automática de alertas
-- Fase 1 + 2: preferências salvas no banco e trigger que gera vehicle_alerts
-- a partir das posições decodificadas (tabela `positions`).
--
-- Alertas ENTREGÁVEIS hoje (com os campos que o decode grava em positions):
--   ignicao_ligada, ignicao_desligada, movimento, limite_velocidade.
-- Não-entregáveis ainda (sem dado decodificado): cerca_violada, bateria_fraca,
--   desconectado. Ficam como colunas/toggles desabilitados na UI.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Preferências de notificação (uma linha por usuário)
-- ---------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  movimento         boolean not null default true,
  ignicao_ligada    boolean not null default true,
  ignicao_desligada boolean not null default true,
  cerca_violada     boolean not null default false,
  limite_velocidade boolean not null default false,
  bateria_fraca     boolean not null default false,
  desconectado      boolean not null default false,
  speed_limit_kmh   integer not null default 80,
  updated_at        timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "np_select_own" on public.notification_preferences;
create policy "np_select_own" on public.notification_preferences
  for select using (user_id = auth.uid());

drop policy if exists "np_insert_own" on public.notification_preferences;
create policy "np_insert_own" on public.notification_preferences
  for insert with check (user_id = auth.uid());

drop policy if exists "np_update_own" on public.notification_preferences;
create policy "np_update_own" on public.notification_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2) RLS de leitura em vehicle_alerts (o usuário vê alertas dos veículos
--    que ele já enxerga — reaproveita o RLS existente de `vehicles`).
-- ---------------------------------------------------------------------
alter table public.vehicle_alerts enable row level security;

drop policy if exists "va_select_visible" on public.vehicle_alerts;
create policy "va_select_visible" on public.vehicle_alerts
  for select using (vehicle_id in (select id from public.vehicles));

-- marcar como lido (is_read) nos próprios veículos visíveis
drop policy if exists "va_update_visible" on public.vehicle_alerts;
create policy "va_update_visible" on public.vehicle_alerts
  for update using (vehicle_id in (select id from public.vehicles))
  with check (vehicle_id in (select id from public.vehicles));

-- índice para o feed (mais recentes primeiro por veículo)
create index if not exists idx_vehicle_alerts_vehicle_created
  on public.vehicle_alerts (vehicle_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2b) Coluna com a última vez que a ignição foi vista LIGADA.
--     Mantida pelo trigger abaixo. Alimenta o card "última ignição ligada".
-- ---------------------------------------------------------------------
alter table public.vehicles
  add column if not exists last_ignition_on timestamptz;

-- ---------------------------------------------------------------------
-- 3) Detecção automática: trigger AFTER INSERT em positions.
--    Compara com a última posição válida do veículo e grava eventos
--    em vehicle_alerts nas TRANSIÇÕES (evita flood).
--    SECURITY DEFINER: roda com privilégio para inserir/ler independente
--    de quem inseriu a posição (backend/service).
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
  v_owner       uuid;
  v_limit       integer;
begin
  -- só reage a fix válido e com veículo associado
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

  -- Rastreador em movimento (parado -> movendo). Limiar de 5 km/h evita jitter de GPS.
  if coalesce(new.speed, 0) > 5 and coalesce(prev_speed, 0) <= 5 then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (new.vehicle_id, 'movimento', 'Rastreador em movimento', new.latitude, new.longitude);
  end if;

  -- Limite de velocidade (cruzou o limite do dono do veículo; default 80).
  -- Dono = usuário vinculado ao cliente do veículo.
  select c.user_id into v_owner
  from public.vehicles ve
  join public.clients c on c.id = ve.client_id
  where ve.id = new.vehicle_id;

  select coalesce(np.speed_limit_kmh, 80) into v_limit
  from public.notification_preferences np
  where np.user_id = v_owner;
  v_limit := coalesce(v_limit, 80);

  if coalesce(new.speed, 0) > v_limit and coalesce(prev_speed, 0) <= v_limit then
    insert into public.vehicle_alerts (vehicle_id, alert_type, message, latitude, longitude)
    values (
      new.vehicle_id,
      'limite_velocidade',
      'Excesso de velocidade: ' || round(new.speed)::text || ' km/h',
      new.latitude,
      new.longitude
    );
  end if;

  -- Mantém as colunas de resumo do veículo em sincronia com `positions`,
  -- para que a LISTA (que lê vehicles.*) mostre o MESMO status do detalhe
  -- (que lê positions). Sem isso, a lista fica defasada / "sem sinal".
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

drop trigger if exists trg_detect_vehicle_alerts on public.positions;
create trigger trg_detect_vehicle_alerts
  after insert on public.positions
  for each row execute function public.detect_vehicle_alerts();

-- ---------------------------------------------------------------------
-- 4) Backfill: preenche vehicles.* com a ÚLTIMA posição já existente,
--    para a lista ficar consistente com o detalhe imediatamente após
--    aplicar esta migration (sem esperar chegar uma nova posição).
-- ---------------------------------------------------------------------
with latest as (
  select distinct on (p.vehicle_id)
    p.vehicle_id,
    coalesce(p.recorded_at, p.created_at) as ts,
    p.latitude, p.longitude, p.speed, p.ignition, p.heading
  from public.positions p
  where p.valid = true and p.vehicle_id is not null
  order by p.vehicle_id, coalesce(p.recorded_at, p.created_at) desc, p.id desc
)
update public.vehicles v
set last_update = l.ts,
    last_location = jsonb_build_object(
      'lat', l.latitude, 'lng', l.longitude,
      'speed', l.speed, 'ignition', l.ignition, 'heading', l.heading
    )
from latest l
where l.vehicle_id = v.id;

with last_on as (
  select distinct on (p.vehicle_id)
    p.vehicle_id,
    coalesce(p.recorded_at, p.created_at) as ts
  from public.positions p
  where p.valid = true and p.ignition is true and p.vehicle_id is not null
  order by p.vehicle_id, coalesce(p.recorded_at, p.created_at) desc, p.id desc
)
update public.vehicles v
set last_ignition_on = lo.ts
from last_on lo
where lo.vehicle_id = v.id;
