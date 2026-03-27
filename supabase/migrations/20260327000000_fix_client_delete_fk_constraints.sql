-- Fix foreign key constraints that block client deletion

-- 1. parent_client_id: set to NULL when parent is deleted (subclients become root)
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_parent_client_id_fkey,
  ADD CONSTRAINT clients_parent_client_id_fkey
    FOREIGN KEY (parent_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- 2. finance_records.client_id: set to NULL when client is deleted (keep financial history)
ALTER TABLE public.finance_records
  DROP CONSTRAINT IF EXISTS finance_records_client_id_fkey,
  ADD CONSTRAINT finance_records_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
