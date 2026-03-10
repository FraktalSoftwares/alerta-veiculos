import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientCustomization {
  id: string;
  client_id: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  custom_domain: string | null;
}

interface CreateUserData {
  client_id: string;
  email: string;
  password: string;
  admin_role_id?: string;
  send_welcome_email?: boolean;
}

// Fetch client customization
export function useClientCustomization(clientId: string) {
  return useQuery({
    queryKey: ['client-customization', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_customization')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data as ClientCustomization | null;
    },
    enabled: !!clientId,
  });
}

// Upsert client customization
export function useUpsertCustomization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ClientCustomization> & { client_id: string }) => {
      const { data: result, error } = await supabase
        .from('client_customization')
        .upsert(data, { onConflict: 'client_id' })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-customization', variables.client_id] });
      toast.success('Customização salva com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar customização: ${error.message}`);
    },
  });
}

// Upload file to storage
export function useUploadClientAsset() {
  return useMutation({
    mutationFn: async ({ clientId, file, type }: { clientId: string; file: File; type: 'logo' | 'favicon' }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onError: (error) => {
      toast.error(`Erro no upload: ${error.message}`);
    },
  });
}

// Create user for client
export function useCreateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: result, error } = await supabase.functions.invoke('create-client-user', {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      toast.success('Acesso criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar acesso: ${error.message}`);
    },
  });
}

// Send password reset email
export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.functions.invoke('send-reset-password', {
        body: { email: email.trim(), redirectTo: `${window.location.origin}/nova-senha` },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('E-mail de redefinição de senha enviado!');
    },
    onError: (error) => {
      toast.error(`Erro ao enviar e-mail: ${error.message}`);
    },
  });
}

// Update client email
export function useUpdateClientEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, email }: { clientId: string; email: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({ email })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('E-mail atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar e-mail: ${error.message}`);
    },
  });
}