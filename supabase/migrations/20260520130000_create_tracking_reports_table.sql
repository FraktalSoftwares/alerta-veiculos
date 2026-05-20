create table public.tracking_reports (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  filename text not null,
  title text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_plate text,
  period_start timestamptz,
  period_end timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tracking_reports enable row level security;

-- Public can read (shareable links)
create policy "Anyone can read tracking_reports"
on public.tracking_reports for select
to anon, authenticated
using (true);

-- Authenticated can insert their own
create policy "Authenticated users can insert tracking_reports"
on public.tracking_reports for insert
to authenticated
with check (created_by = auth.uid());

-- Owner can delete
create policy "Owner can delete tracking_reports"
on public.tracking_reports for delete
to authenticated
using (created_by = auth.uid());

create index tracking_reports_created_by_idx on public.tracking_reports(created_by);
create index tracking_reports_vehicle_id_idx on public.tracking_reports(vehicle_id);
