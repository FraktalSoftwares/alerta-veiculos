import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Módulo base do Mapbox: configura o token e re-exporta a lib.
 * Importe daqui (`import mapboxgl from '@/lib/mapbox'`) em vez de 'mapbox-gl'
 * direto, para garantir que o token e o CSS estejam sempre carregados.
 */
// Aceita nome completo ou abreviado (compat. com a config da Vercel).
const _env = import.meta.env as Record<string, string | undefined>;
export const MAPBOX_TOKEN: string =
  _env.VITE_MAPBOX_TOKEN || _env.VITE_MAPBOX || '';

mapboxgl.accessToken = MAPBOX_TOKEN;

/** Estilo padrão dos mapas do app */
export const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

/** true se há token configurado (para exibir aviso amigável quando faltar) */
export const hasMapboxToken = MAPBOX_TOKEN.startsWith('pk.');

export default mapboxgl;
