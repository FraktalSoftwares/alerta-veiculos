import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      toast({
        title: 'Customização salva',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Acesso criado',
        description: 'O usuário foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar acesso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Send password reset email
export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'E-mail enviado',
        description: 'Um e-mail de redefinição de senha foi enviado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar e-mail',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'E-mail atualizado',
        description: 'O e-mail foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}