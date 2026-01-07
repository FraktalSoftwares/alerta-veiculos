-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('produtos', 'produtos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Criar tabela para múltiplas imagens por produto
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Policies para product_images (seguem as mesmas regras de products)
CREATE POLICY "Everyone can view product images"
ON public.product_images
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert product images"
ON public.product_images
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update product images"
ON public.product_images
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete product images"
ON public.product_images
FOR DELETE
USING (is_admin(auth.uid()));

-- Index para busca por produto
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- Storage policies para bucket produtos
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND is_admin(auth.uid()));