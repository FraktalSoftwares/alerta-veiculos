-- =====================================================================
-- Permite ao usuário EXCLUIR alertas dos veículos que ele enxerga
-- (swipe-to-delete / limpar todas na tela de Notificações).
-- =====================================================================
drop policy if exists "va_delete_visible" on public.vehicle_alerts;
create policy "va_delete_visible" on public.vehicle_alerts
  for delete using (vehicle_id in (select id from public.vehicles));
