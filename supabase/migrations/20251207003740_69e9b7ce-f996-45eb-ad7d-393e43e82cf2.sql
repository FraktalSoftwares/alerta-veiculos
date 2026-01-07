-- Add user_id column to clients table to link with Supabase Auth
ALTER TABLE public.clients 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add favicon_url to client_customization
ALTER TABLE public.client_customization 
ADD COLUMN favicon_url text;

-- Create storage bucket for client assets (logos, favicons)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-assets', 'client-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-assets bucket
CREATE POLICY "Public can view client assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-assets');

CREATE POLICY "Authenticated users can upload client assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update client assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'client-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete client assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-assets' AND auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_clients_user_id ON public.clients(user_id);