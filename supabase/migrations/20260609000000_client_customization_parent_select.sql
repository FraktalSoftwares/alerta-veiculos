-- Allow client users to view customization of their parent client (inheritance)
-- Sub-clientes (ex: associados de uma associação) precisam ler client_customization
-- do parent_client_id para herdar cores/logo. Policies anteriores só permitiam
-- leitura via owner_id ou user_id do próprio client.
CREATE POLICY "Client users can view parent customization"
ON public.client_customization
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients child
    WHERE child.parent_client_id = client_customization.client_id
    AND child.user_id = auth.uid()
  )
);
