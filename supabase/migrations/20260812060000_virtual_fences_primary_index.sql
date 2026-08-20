-- Permite VÁRIAS cercas por equipamento; restringe apenas a UMA principal.
-- Corrige "duplicate key ... unique_primary_fence_per_equipment" ao criar 2ª cerca.
alter table public.virtual_fences drop constraint if exists unique_primary_fence_per_equipment;
drop index if exists public.unique_primary_fence_per_equipment;

create unique index if not exists uniq_primary_fence_per_equipment
  on public.virtual_fences (equipment_id) where is_primary = true;
