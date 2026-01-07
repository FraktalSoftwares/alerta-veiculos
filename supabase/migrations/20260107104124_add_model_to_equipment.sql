-- Add model field to equipment table
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS model TEXT;

-- Create index for model field
CREATE INDEX IF NOT EXISTS idx_equipment_model ON public.equipment(model);

