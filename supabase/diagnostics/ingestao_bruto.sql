-- =====================================================================
-- Diagnóstico ETAPA 2: onde o pipeline parou?
--
-- Pipeline:
--   rastreador --TCP--> serviço externo (fraktalsistemas.com.br:8004, SEM acesso)
--        grava bruto em: pacotes_rastreador_j16 / _8310 / _310
--   triggers (tg_positions_from_j16 / _8310 + decode_j16_row)
--        decodificam bruto --> public.positions
--
-- Já sabemos: positions parou em 2026-07-15 18:40 UTC (~6 dias).
-- Objetivo agora: o BRUTO ainda chega?
--   Bruto tbm parado  -> serviço externo/rastreadores caíram (acionar fraktalsistemas)
--   Bruto chegando     -> o DECODE quebrou (é nosso, dá pra consertar aqui)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0) Descobrir as colunas das tabelas brutas (nome da coluna de tempo varia)
--    Olhe o retorno para achar a coluna de timestamp (created_at, data,
--    date_time, recebido_em, etc.) e ajuste as queries seguintes se preciso.
-- ---------------------------------------------------------------------
select table_name, column_name, data_type, ordinal_position
from information_schema.columns
where table_schema = 'public'
  and table_name in ('pacotes_rastreador_j16','pacotes_rastreador_8310','pacotes_rastreador_310')
order by table_name, ordinal_position;


-- ---------------------------------------------------------------------
-- 1) ÚLTIMO PACOTE BRUTO POR TABELA
--    *** Assume coluna created_at. Se a query 0 mostrar outro nome,
--        troque created_at pelo nome correto. ***
--    Se "ha_quanto_tempo" bater com os ~6 dias do positions -> bruto parou junto.
-- ---------------------------------------------------------------------
select 'j16'  as tabela, count(*) as total, max(created_at) as ultimo, now() - max(created_at) as ha_quanto_tempo,
       count(*) filter (where created_at > now() - interval '8 hours') as ultimas_8h
  from pacotes_rastreador_j16
union all
select '8310' as tabela, count(*), max(created_at), now() - max(created_at),
       count(*) filter (where created_at > now() - interval '8 hours')
  from pacotes_rastreador_8310
union all
select '310'  as tabela, count(*), max(created_at), now() - max(created_at),
       count(*) filter (where created_at > now() - interval '8 hours')
  from pacotes_rastreador_310
order by tabela;


-- ---------------------------------------------------------------------
-- 2) LINHA DO TEMPO cruzada: bruto x positions (últimos 10 dias, por dia)
--    Mostra se os dois pararam no MESMO dia (serviço) ou se o bruto
--    continuou depois que o positions travou (decode).
-- ---------------------------------------------------------------------
with dias as (
  select generate_series(
    date_trunc('day', now()) - interval '9 days',
    date_trunc('day', now()),
    interval '1 day'
  ) as dia
)
select
  to_char(d.dia, 'YYYY-MM-DD') as dia,
  (select count(*) from pacotes_rastreador_j16  b where b.created_at >= d.dia and b.created_at < d.dia + interval '1 day') as bruto_j16,
  (select count(*) from pacotes_rastreador_8310 b where b.created_at >= d.dia and b.created_at < d.dia + interval '1 day') as bruto_8310,
  (select count(*) from positions               p where p.created_at >= d.dia and p.created_at < d.dia + interval '1 day') as positions
from dias d
order by dia;


-- ---------------------------------------------------------------------
-- 3) Existem triggers de decode ativos nas tabelas brutas?
--    (tgenabled = 'O' habilitado; 'D' desabilitado)
-- ---------------------------------------------------------------------
select c.relname as tabela, t.tgname as trigger, t.tgenabled as habilitado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('pacotes_rastreador_j16','pacotes_rastreador_8310','pacotes_rastreador_310')
  and not t.tgisinternal
order by tabela, trigger;


-- ---------------------------------------------------------------------
-- 4) Pacote bruto mais recente x posição decodificada mais recente
--    do MESMO período — se houver bruto SEM position correspondente
--    depois de 2026-07-15, o decode falhou nesses pacotes.
--    (rode só se a query 1 mostrar bruto chegando após 2026-07-15)
-- ---------------------------------------------------------------------
select id, created_at, identificador, equipamento, modelo, type, date_time
from pacotes_rastreador_j16
where created_at > timestamptz '2026-07-15 18:40:56+00'
order by created_at desc
limit 20;
