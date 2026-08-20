-- =====================================================================
-- Preferências de alerta POR VEÍCULO (substitui o comportamento global).
-- Cada usuário liga, para CADA veículo que enxerga, quais alertas quer receber.
-- Default: tudo OFF (opt-in por veículo). Limite de velocidade por veículo.
-- =====================================================================
create table if not exists public.vehicle_alert_preferences (
  user_id           uuid not null references auth.users(id) on delete cascade,
  vehicle_id        uuid not null references public.vehicles(id) on delete cascade,
  movimento         boolean not null default false,
  ignicao_ligada    boolean not null default false,
  ignicao_desligada boolean not null default false,
  limite_velocidade boolean not null default false,
  -- "em breve" (estrutura pronta; ativados nas Fases 4)
  cerca_violada     boolean not null default false,
  bateria_fraca     boolean not null default false,
  desconectado      boolean not null default false,
  speed_limit_kmh   integer not null default 80,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (user_id, vehicle_id)
);

alter table public.vehicle_alert_preferences enable row level security;

-- Cada usuário gerencia SÓ as próprias preferências; e só cria para veículos
-- que ele enxerga (o SELECT em vehicles já é RLS-scoped = dono + gestores).
drop policy if exists "vap_select" on public.vehicle_alert_preferences;
create policy "vap_select" on public.vehicle_alert_preferences
  for select using (user_id = auth.uid());

drop policy if exists "vap_insert" on public.vehicle_alert_preferences;
create policy "vap_insert" on public.vehicle_alert_preferences
  for insert with check (user_id = auth.uid() and vehicle_id in (select id from public.vehicles));

drop policy if exists "vap_update" on public.vehicle_alert_preferences;
create policy "vap_update" on public.vehicle_alert_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vap_delete" on public.vehicle_alert_preferences;
create policy "vap_delete" on public.vehicle_alert_preferences
  for delete using (user_id = auth.uid());

create index if not exists idx_vap_vehicle on public.vehicle_alert_preferences (vehicle_id);
