-- =====================================================================
-- Push EVENT-DRIVEN (baixa latência) + medição por hop.
--
-- Antes: o push só saía no "tique" do pg_cron (a cada 1 min) -> até 60s de
-- espera. Agora, cada novo alerta CHAMA a edge function na hora (pg_net,
-- assíncrono). O cron continua rodando como REDE DE SEGURANÇA (reprocessa
-- o que ficar preso/falhar).
--
-- Concorrência: como agora o webhook e o cron podem rodar juntos, o consumo
-- da fila passa a ser um CLAIM ATÔMICO (pending -> 'sending') com
-- FOR UPDATE SKIP LOCKED, pra duas execuções nunca pegarem o mesmo alerta
-- (sem push duplicado). Linhas presas em 'sending' > 2 min são reprocessadas.
--
-- Medição: pushed_at (quando o push saiu) e claimed_at (quando foi reservado).
--   latência banco->push  = pushed_at - created_at
--   latência aparelho->banco (em positions) = created_at - recorded_at
-- =====================================================================

alter table public.vehicle_alerts
  add column if not exists pushed_at  timestamptz,
  add column if not exists claimed_at timestamptz;

-- Claim atômico da fila.
create or replace function public.claim_pending_alerts(p_limit int default 50)
returns setof public.vehicle_alerts
language sql
security definer
set search_path = public
as $$
  update public.vehicle_alerts a
  set push_status = 'sending', claimed_at = now()
  where a.id in (
    select id from public.vehicle_alerts
    where push_status = 'pending'
       or (push_status = 'sending' and claimed_at < now() - interval '2 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  returning a.*;
$$;

-- Poke: em cada novo alerta pendente, aciona a edge function imediatamente.
-- pg_net.http_post é assíncrono (não trava o INSERT). A função foi publicada
-- com --no-verify-jwt, então não precisa de Authorization.
create or replace function public.notify_send_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://fjhozukksxzuazuykyhk.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_send_push on public.vehicle_alerts;
create trigger trg_notify_send_push
  after insert on public.vehicle_alerts
  for each row
  when (new.push_status = 'pending')
  execute function public.notify_send_push();
