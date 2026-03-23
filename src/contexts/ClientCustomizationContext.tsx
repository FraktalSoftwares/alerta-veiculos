import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ClientCustomization {
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  favicon_url: string | null;
}

interface ClientCustomizationContextType {
  customization: ClientCustomization | null;
  loading: boolean;
}

const ClientCustomizationContext = createContext<ClientCustomizationContextType>({
  customization: null,
  loading: false,
});

/**
 * Converte hex (#RRGGBB) para o formato HSL usado pelas CSS variables do Tailwind.
 * Retorna string no formato "H S% L%" (sem parênteses).
 */
function hexToHSL(hex: string): string {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyCustomStyles(data: ClientCustomization) {
  const root = document.documentElement;

  if (data.primary_color) {
    const hsl = hexToHSL(data.primary_color);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
    root.style.setProperty('--sidebar-primary', hsl);
    root.style.setProperty('--warning', hsl);
  }

  if (data.secondary_color && data.secondary_color.toUpperCase() !== '#FFFFFF') {
    const hsl = hexToHSL(data.secondary_color);
    root.style.setProperty('--background', hsl);
    root.style.setProperty('--card', hsl);
  }

  if (data.favicon_url) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = data.favicon_url;
  }
}

function removeCustomStyles() {
  const root = document.documentElement;
  const props = ['--primary', '--ring', '--sidebar-primary', '--warning', '--background', '--card'];
  props.forEach(p => root.style.removeProperty(p));

  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = '/favicon.ico';
  }
}

export function ClientCustomizationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [customization, setCustomization] = useState<ClientCustomization | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomization = useCallback(async (userId: string, parentUserId: string | null) => {
    setLoading(true);
    try {
      // 1. Buscar cliente vinculado diretamente ao usuário (user_id)
      let { data: client } = await supabase
        .from('clients')
        .select('id, parent_client_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      // 2. Se não encontrou e tem parent_user_id, tentar pelo pai
      if (!client && parentUserId) {
        const { data: parentClient } = await supabase
          .from('clients')
          .select('id, parent_client_id')
          .eq('user_id', parentUserId)
          .limit(1)
          .maybeSingle();
        client = parentClient;
      }

      if (!client) {
        setCustomization(null);
        removeCustomStyles();
        setLoading(false);
        return;
      }

      // 3. Buscar customização deste cliente
      const { data: customData } = await supabase
        .from('client_customization')
        .select('primary_color, secondary_color, logo_url, favicon_url')
        .eq('client_id', client.id)
        .maybeSingle();

      // 4. Se não tem customização própria mas tem parent_client_id, usar do pai
      if (!customData && client.parent_client_id) {
        const { data: parentCustomData } = await supabase
          .from('client_customization')
          .select('primary_color, secondary_color, logo_url, favicon_url')
          .eq('client_id', client.parent_client_id)
          .maybeSingle();

        if (parentCustomData) {
          setCustomization(parentCustomData);
          applyCustomStyles(parentCustomData);
          setLoading(false);
          return;
        }
      }

      if (customData) {
        setCustomization(customData);
        applyCustomStyles(customData);
      } else {
        setCustomization(null);
        removeCustomStyles();
      }
    } catch (error) {
      console.error('Error fetching client customization:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !profile) {
      setCustomization(null);
      removeCustomStyles();
      return;
    }

    // Admin não tem customização — usa tema padrão
    if (profile.user_type === 'admin') {
      setCustomization(null);
      removeCustomStyles();
      return;
    }

    fetchCustomization(user.id, profile.parent_user_id);
  }, [user, profile, fetchCustomization]);

  return (
    <ClientCustomizationContext.Provider value={{ customization, loading }}>
      {children}
    </ClientCustomizationContext.Provider>
  );
}

export function useClientCustomization() {
  return useContext(ClientCustomizationContext);
}
