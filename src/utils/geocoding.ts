import { MAPBOX_TOKEN } from '@/lib/mapbox';

// Geocodificação reversa (endereço a partir de lat/lng) via Mapbox Geocoding API v6.
// Mantém a mesma interface pública usada nos cards de histórico.

const geocodeCache = new Map<string, string>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

async function reverseGeocodeSingle(lat: number, lng: number): Promise<string> {
  const cacheKey = getCacheKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  if (!MAPBOX_TOKEN) {
    geocodeCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const url =
      `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}` +
      `&language=pt&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox geocoding ${res.status}`);
    const data = await res.json();
    const props = data?.features?.[0]?.properties;
    const address: string =
      props?.full_address || props?.place_formatted || props?.name || fallback;
    geocodeCache.set(cacheKey, address);
    return address;
  } catch {
    geocodeCache.set(cacheKey, fallback);
    return fallback;
  }
}

export interface GeocodablePoint {
  latitude: number;
  longitude: number;
}

export async function batchReverseGeocode(
  points: GeocodablePoint[],
  onProgress?: (done: number, total: number) => void,
  concurrency = 5
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const seen = new Set<string>();
  const pending: Array<{ key: string; lat: number; lng: number }> = [];

  for (const p of points) {
    const key = getCacheKey(p.latitude, p.longitude);
    if (seen.has(key)) continue;
    seen.add(key);

    const cached = geocodeCache.get(key);
    if (cached) {
      results.set(key, cached);
    } else {
      pending.push({ key, lat: p.latitude, lng: p.longitude });
    }
  }

  let done = results.size;
  const total = seen.size;
  onProgress?.(done, total);

  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (t) => {
        const addr = await reverseGeocodeSingle(t.lat, t.lng);
        results.set(t.key, addr);
        done++;
        onProgress?.(done, total);
      })
    );
    if (i + concurrency < pending.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
}

export function getAddress(lat: number, lng: number, addressMap: Map<string, string>): string {
  return addressMap.get(getCacheKey(lat, lng)) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
