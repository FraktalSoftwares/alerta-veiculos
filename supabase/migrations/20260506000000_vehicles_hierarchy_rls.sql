-- =============================================
-- RLS: vehicles hierarchy (user_id + parent chain)
--
-- Existing policies on vehicles for non-admin users only check
-- clients.owner_id = auth.uid(). That fails when a user (e.g. franquia)
-- is logged in and tries to manage vehicles of their OWN client record,
-- because that record's owner_id is the admin who created it, not the
-- logged-in user.
--
-- Fix: allow CRUD when the vehicle's client_id resolves (via itself or
-- its ancestors through parent_client_id) to a client whose user_id
-- matches auth.uid(). Mirrors the SELECT coverage that already exists
-- via "Motoristas can view own vehicles".
-- =============================================

-- Walks up the client.parent_client_id chain starting at _client_id and
-- returns true if any ancestor (or itself) has user_id = _user_id.
CREATE OR REPLACE FUNCTION public.user_manages_client_chain(_client_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE ancestry AS (
    SELECT id, parent_client_id, user_id
    FROM public.clients
    WHERE id = _client_id
    UNION ALL
    SELECT c.id, c.parent_client_id, c.user_id
    FROM public.clients c
    JOIN ancestry a ON c.id = a.parent_client_id
  )
  SELECT EXISTS (SELECT 1 FROM ancestry WHERE user_id = _user_id);
$$;

-- VEHICLES: user manages vehicles when client_id resolves to their own
-- client record or any ancestor of it.
CREATE POLICY "Users can view vehicles of managed clients"
  ON public.vehicles FOR SELECT
  USING (public.user_manages_client_chain(client_id, auth.uid()));

CREATE POLICY "Users can update vehicles of managed clients"
  ON public.vehicles FOR UPDATE
  USING (public.user_manages_client_chain(client_id, auth.uid()))
  WITH CHECK (public.user_manages_client_chain(client_id, auth.uid()));

CREATE POLICY "Users can insert vehicles for managed clients"
  ON public.vehicles FOR INSERT
  WITH CHECK (public.user_manages_client_chain(client_id, auth.uid()));

CREATE POLICY "Users can delete vehicles of managed clients"
  ON public.vehicles FOR DELETE
  USING (public.user_manages_client_chain(client_id, auth.uid()));
