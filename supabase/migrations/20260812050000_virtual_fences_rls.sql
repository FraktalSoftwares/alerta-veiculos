-- RLS da virtual_fences: permite gerenciar cercas de EQUIPAMENTOS ligados a
-- VEÍCULOS que o usuário enxerga (vehicles/equipment já são RLS-scoped).
-- Corrige "new row violates row-level security policy" ao criar cerca (admin/gestor).
alter table public.virtual_fences enable row level security;

drop policy if exists "vf_manage_by_vehicle" on public.virtual_fences;
create policy "vf_manage_by_vehicle" on public.virtual_fences
  for all
  to authenticated
  using (
    equipment_id in (
      select e.id from public.equipment e
      where e.vehicle_id in (select v.id from public.vehicles v)
    )
  )
  with check (
    equipment_id in (
      select e.id from public.equipment e
      where e.vehicle_id in (select v.id from public.vehicles v)
    )
  );
