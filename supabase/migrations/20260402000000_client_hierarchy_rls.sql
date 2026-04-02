-- Helper function to get client IDs for a user (SECURITY DEFINER to bypass RLS in sub-queries)
CREATE OR REPLACE FUNCTION public.get_client_ids_for_user(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.clients WHERE user_id = _user_id;
$$;

-- Helper function for grandchild lookup (also bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_grandchild_parent_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT c2.id
  FROM public.clients c2
  WHERE c2.parent_client_id IN (
    SELECT c1.id FROM public.clients c1 WHERE c1.user_id = _user_id
  );
$$;

-- SELECT: users can see sub-clients of their own client record
CREATE POLICY "Users can view sub-clients"
  ON clients FOR SELECT
  USING (parent_client_id IN (SELECT public.get_client_ids_for_user(auth.uid())));

-- INSERT: users can create sub-clients under their own client record
CREATE POLICY "Users can insert sub-clients"
  ON clients FOR INSERT
  WITH CHECK (parent_client_id IN (SELECT public.get_client_ids_for_user(auth.uid())));

-- UPDATE: users can update sub-clients of their own client record
CREATE POLICY "Users can update sub-clients"
  ON clients FOR UPDATE
  USING (parent_client_id IN (SELECT public.get_client_ids_for_user(auth.uid())));

-- DELETE: users can delete sub-clients of their own client record
CREATE POLICY "Users can delete sub-clients"
  ON clients FOR DELETE
  USING (parent_client_id IN (SELECT public.get_client_ids_for_user(auth.uid())));

-- SELECT grandchildren (2 levels deep) - e.g., associação sees motoristas dos associados
CREATE POLICY "Users can view grandchild clients"
  ON clients FOR SELECT
  USING (parent_client_id IN (SELECT public.get_grandchild_parent_ids(auth.uid())));
