-- =============================================
-- Trigger: Cascata de bloqueio/ativação de clientes
--
-- Quando o admin muda o status de um cliente para 'blocked' ou 'active',
-- TODOS os sub-clientes na hierarquia são atualizados também.
-- Além disso, atualiza profiles.is_active para impedir/permitir login.
-- =============================================

CREATE OR REPLACE FUNCTION public.cascade_client_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Evitar recursão: se já estamos em cascata, sair
  IF current_setting('app.cascading_status', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Só cascatear se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Ativar guard contra recursão (transaction-local)
    PERFORM set_config('app.cascading_status', 'true', true);

    -- 1. Atualizar status de TODOS os sub-clientes recursivamente
    WITH RECURSIVE client_tree AS (
      SELECT id FROM clients WHERE parent_client_id = NEW.id
      UNION ALL
      SELECT c.id FROM clients c
      JOIN client_tree ct ON c.parent_client_id = ct.id
    )
    UPDATE clients SET status = NEW.status
    WHERE id IN (SELECT id FROM client_tree);

    -- 2. Atualizar profiles.is_active para o cliente atual + todos descendentes
    WITH RECURSIVE client_tree AS (
      SELECT id, user_id FROM clients WHERE id = NEW.id
      UNION ALL
      SELECT c.id, c.user_id FROM clients c
      JOIN client_tree ct ON c.parent_client_id = ct.id
    )
    UPDATE profiles SET is_active = (NEW.status = 'active')
    WHERE id IN (
      SELECT user_id FROM client_tree WHERE user_id IS NOT NULL
    );

    -- Resetar guard
    PERFORM set_config('app.cascading_status', 'false', true);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger que dispara apenas quando a coluna status muda
DROP TRIGGER IF EXISTS on_client_status_change ON public.clients;
CREATE TRIGGER on_client_status_change
  AFTER UPDATE OF status ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_client_status_change();
