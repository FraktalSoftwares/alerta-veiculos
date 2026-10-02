-- =====================================================================
-- Índice para "última posição válida do veículo" (web + app mobile):
--   select ... from positions
--   where vehicle_id = $1 and valid = true
--   order by recorded_at desc nulls last limit 1
-- Sem ele a consulta estourava o statement timeout (57014) no app,
-- que então ficava só com a posição resumida da listagem.
-- O "desc nulls last" precisa bater com o ORDER BY (um índice DESC comum
-- é NULLS FIRST e não serve para esse limit 1).
-- =====================================================================
create index if not exists positions_vehicle_latest_valid_idx
  on public.positions (vehicle_id, recorded_at desc nulls last)
  where valid = true;

analyze public.positions;
