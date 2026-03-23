-- =============================================
-- RLS: Permitir que usuários vinculados a um cliente (user_id)
-- possam acessar dados do seu próprio cliente.
--
-- As políticas existentes só checam owner_id (o admin que criou
-- o cliente). Porém, quando o usuário DO CLIENTE loga, ele é
-- identificado via clients.user_id, não owner_id.
--
-- Estas policies complementam as existentes (Postgres faz OR
-- entre múltiplas policies da mesma operação).
-- =============================================

-- CLIENT_CUSTOMIZATION
DROP POLICY IF EXISTS "Client users can view own customization" ON public.client_customization;
CREATE POLICY "Client users can view own customization"
ON public.client_customization
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_customization.client_id
    AND clients.user_id = auth.uid()
  )
);

-- FINANCE_RECORDS
DROP POLICY IF EXISTS "Client users can view own finance records" ON public.finance_records;
CREATE POLICY "Client users can view own finance records"
ON public.finance_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = finance_records.client_id
    AND clients.user_id = auth.uid()
  )
);

-- BILLING_SETTINGS
DROP POLICY IF EXISTS "Client users can view own billing settings" ON public.billing_settings;
CREATE POLICY "Client users can view own billing settings"
ON public.billing_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = billing_settings.client_id
    AND clients.user_id = auth.uid()
  )
);

-- ADDRESSES
DROP POLICY IF EXISTS "Client users can view own addresses" ON public.addresses;
CREATE POLICY "Client users can view own addresses"
ON public.addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = addresses.client_id
    AND clients.user_id = auth.uid()
  )
);

-- SECONDARY_CONTACTS
DROP POLICY IF EXISTS "Client users can view own contacts" ON public.secondary_contacts;
CREATE POLICY "Client users can view own contacts"
ON public.secondary_contacts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = secondary_contacts.client_id
    AND clients.user_id = auth.uid()
  )
);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Client users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Client users can view own subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = subscriptions.client_id
    AND clients.user_id = auth.uid()
  )
);
