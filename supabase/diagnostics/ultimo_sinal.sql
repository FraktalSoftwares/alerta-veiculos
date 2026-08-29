-- =====================================================================
-- Diagnóstico: "por que todos os veículos estão SEM SINAL?"
--
-- Contexto:
--   A coluna SITUAÇÃO da lista usa vehicles.last_update.
--   Esse campo só é atualizado pelo trigger detect_vehicle_alerts, e SÓ
--   quando chega uma posição com  valid = true  AND  vehicle_id IS NOT NULL.
--   > 8h sem atualizar  ->  "SEM SINAL".
--
-- Rode as queries abaixo no SQL Editor do Supabase (uma de cada vez, ou
-- todas juntas) para descobrir onde o pipeline parou.
-- Referência de horário: todas usam now() (UTC no Postgres do Supabase).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) ÚLTIMO SINAL RECEBIDO NO BANCO (visão geral)
--    Se "ultima_insercao" for antiga, a INGESTÃO parou (serviço externo).
-- ---------------------------------------------------------------------
select
  count(*)                                                  as total_posicoes,
  max(created_at)                                           as ultima_insercao_no_banco,
  now() - max(created_at)                                   as ha_quanto_tempo,
  max(recorded_at)                                          as ultimo_recorded_at_do_gps,
  count(*) filter (where created_at > now() - interval '8 hours')  as inseridas_ultimas_8h,
  count(*) filter (where created_at > now() - interval '1 hour')   as inseridas_ultima_1h
from positions;


-- ---------------------------------------------------------------------
-- 2) DAS POSIÇÕES RECENTES: quantas são válidas e vinculadas ao veículo?
--    valid=false  -> problema de DECODE.
--    vehicle_id nulo -> IMEI não casou com equipment (VÍNCULO).
--    Só o par (valid=true, tem_vehicle=true) atualiza o last_update.
-- ---------------------------------------------------------------------
select
  valid,
  (vehicle_id is not null) as tem_vehicle_id,
  count(*)                 as qtd,
  min(created_at)          as mais_antiga,
  max(created_at)          as mais_recente
from positions
where created_at > now() - interval '24 hours'
group by valid, (vehicle_id is not null)
order by qtd desc;


-- ---------------------------------------------------------------------
-- 3) POR MODELO DE RASTREADOR (J16/GT06, 8310/Suntech, etc.)
--    Mostra qual protocolo parou de chegar / está decodificando errado.
-- ---------------------------------------------------------------------
select
  coalesce(modelo, '(sem modelo)') as modelo,
  count(*)                              as total_24h,
  count(*) filter (where valid)         as validas,
  count(*) filter (where vehicle_id is not null) as com_vehicle,
  max(created_at)                       as ultimo_recebido,
  now() - max(created_at)               as ha_quanto_tempo
from positions
where created_at > now() - interval '24 hours'
group by modelo
order by ultimo_recebido desc nulls last;


-- ---------------------------------------------------------------------
-- 4) ÚLTIMO SINAL POR VEÍCULO (o que a lista está lendo hoje)
--    Cruza o que ESTÁ salvo em vehicles.last_update com a última
--    posição REAL na tabela positions — evidencia se o trigger falhou.
-- ---------------------------------------------------------------------
select
  v.plate                                   as placa,
  v.last_update                             as vehicles_last_update,
  now() - v.last_update                     as idade_last_update,
  p.ultima_posicao                          as ultima_em_positions,
  p.ultima_valida                           as ultima_valida_em_positions,
  case
    when v.last_update is null then 'NUNCA teve last_update'
    when now() - v.last_update > interval '8 hours' then 'SEM SINAL (>8h)'
    else 'OK'
  end                                       as situacao_lista
from vehicles v
left join lateral (
  select
    max(created_at)                                  as ultima_posicao,
    max(created_at) filter (where valid and p.vehicle_id is not null) as ultima_valida
  from positions p
  where p.vehicle_id = v.id
) p on true
order by v.last_update desc nulls last;


-- ---------------------------------------------------------------------
-- 5) AMOSTRA DAS 20 ÚLTIMAS POSIÇÕES BRUTAS (para inspeção manual)
--    Olhe latitude/longitude (nulas ou 0,0 = decode ruim), valid e vehicle_id.
-- ---------------------------------------------------------------------
select
  id, created_at, recorded_at, imei, modelo,
  vehicle_id, valid, latitude, longitude, speed, ignition
from positions
order by created_at desc
limit 20;
