-- Fila de push: cada vehicle_alert vira 'pending' e a edge function drena.
alter table public.vehicle_alerts add column if not exists push_status text not null default 'pending';
alter table public.vehicle_alerts add column if not exists push_attempts int not null default 0;

-- Não empurrar histórico: marca tudo que já existe como 'skipped'.
update public.vehicle_alerts set push_status = 'skipped' where push_status = 'pending';

-- Índice para drenar rápido os pendentes.
create index if not exists idx_va_push_pending on public.vehicle_alerts (created_at) where push_status = 'pending';
