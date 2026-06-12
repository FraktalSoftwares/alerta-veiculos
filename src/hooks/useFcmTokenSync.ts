import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    __FCM_TOKEN__?: string;
  }
}

export function useFcmTokenSync() {
  const { user } = useAuth();
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      lastSavedRef.current = null;
      return;
    }

    const save = async (token: string | null | undefined) => {
      const value = token?.trim();
      if (!value || value === lastSavedRef.current) return;

      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: value })
        .eq('id', user.id);

      if (error) {
        console.error('[fcm] failed to persist token', error);
        return;
      }
      lastSavedRef.current = value;
    };

    save(window.__FCM_TOKEN__);

    const handler = (e: Event) => save((e as CustomEvent<string>).detail);
    window.addEventListener('flutter-fcm-token', handler as EventListener);
    return () => window.removeEventListener('flutter-fcm-token', handler as EventListener);
  }, [user?.id]);
}
