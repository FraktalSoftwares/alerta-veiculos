-- Permite que equipamentos existam sem proprietário (Sem vínculo)
ALTER TABLE public.equipment ALTER COLUMN owner_id DROP NOT NULL;
