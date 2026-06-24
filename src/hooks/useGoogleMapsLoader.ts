import { useEffect, useState } from 'react';

// Aceita nome completo ou abreviado (compat. com a config da Vercel).
const _env = import.meta.env as Record<string, string | undefined>;
const GOOGLE_MAPS_KEY = _env.VITE_GOOGLE_MAPS_API_KEY || _env.VITE_GOOGLE_MAPS || '';
const CALLBACK = '__googleMapsTestCb';

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    (window as any)[CALLBACK] = () => {
      delete (window as any)[CALLBACK];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=${CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Falha ao carregar o Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** Loader exclusivo da tela de teste com Google Maps (não usado no resto do app). */
export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState<boolean>(!!(window as any).google?.maps?.Map);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    loadGoogleMaps()
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(false));
  }, []);

  return { isLoaded, hasKey: !!GOOGLE_MAPS_KEY };
}
