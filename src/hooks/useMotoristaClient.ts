import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMotoristaClient() {
  const { user, profile } = useAuth();
  const isMotorista = profile?.user_type === 'motorista';

  return useQuery({
    queryKey: ['motorista-client', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!user?.id && isMotorista,
  });
}
