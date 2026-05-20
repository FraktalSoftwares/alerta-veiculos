-- Create public bucket for tracking PDF reports
insert into storage.buckets (id, name, public)
values ('relatorios', 'relatorios', true)
on conflict (id) do nothing;

-- Allow public read (bucket is public, but explicit policy keeps things clear)
create policy "Public can read relatorios"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'relatorios');

-- Authenticated users can upload reports
create policy "Authenticated users can upload relatorios"
on storage.objects for insert
to authenticated
with check (bucket_id = 'relatorios');

-- Authenticated users can delete their own uploaded reports
create policy "Authenticated users can delete own relatorios"
on storage.objects for delete
to authenticated
using (bucket_id = 'relatorios' and owner = auth.uid());
