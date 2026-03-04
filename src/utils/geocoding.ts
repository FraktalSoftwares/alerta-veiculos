/// <reference types="google.maps" />

const geocodeCache = new Map<string, string>();

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function getComponent(components: google.maps.GeocoderAddressComponent[], type: string): string | null {
  const comp = components.find((c) => c.types.includes(type));
  return comp?.long_name || null;
}

function getComponentShort(components: google.maps.GeocoderAddressComponent[], type: string): string | null {
  const comp = components.find((c) => c.types.includes(type));
  return comp?.short_name || null;
}

function formatBrazilianAddress(result: google.maps.GeocoderResult): string {
  const components = result.address_components;
  if (!components?.length) return result.formatted_address || '';

  const route = getComponent(components, 'route');
  const streetNumber = getComponent(components, 'street_number');
  const neighborhood =
    getComponent(components, 'sublocality_level_1') ||
    getComponent(components, 'sublocality') ||
    getComponent(components, 'neighborhood');
  const city =
    getComponent(components, 'administrative_area_level_2') ||
    getComponent(components, 'locality');
  const stateShort = getComponentShort(components, 'administrative_area_level_1');
  const postalCode = getComponent(components, 'postal_code');
  const country = getComponent(components, 'country');

  const parts: string[] = [];

  if (route) {
    parts.push(streetNumber ? `${route}, ${streetNumber}` : route);
  }
  if (neighborhood) parts.push(neighborhood);
  if (city && stateShort) {
    parts.push(`${city} - ${stateShort}`);
  } else if (city) {
    parts.push(city);
  }
  if (postalCode) parts.push(postalCode);
  if (country) parts.push(country);

  return parts.length > 0 ? parts.join(', ') : result.formatted_address || '';
}

function waitForGoogleMaps(timeoutMs = 10000): Promise<void> {
  if (window.google?.maps?.Geocoder) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.google?.maps?.Geocoder) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error('Google Maps não carregou a tempo'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

let geocoderInstance: google.maps.Geocoder | null = null;

function getGeocoder(): google.maps.Geocoder {
  if (!geocoderInstance) {
    geocoderInstance = new google.maps.Geocoder();
  }
  return geocoderInstance;
}

async function reverseGeocodeSingle(lat: number, lng: number): Promise<string> {
  const cacheKey = getCacheKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const geocoder = getGeocoder();
    const response = await geocoder.geocode({
      location: { lat, lng },
    });

    if (response.results?.length) {
      const address = formatBrazilianAddress(response.results[0]);
      geocodeCache.set(cacheKey, address);
      return address;
    }

    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    geocodeCache.set(cacheKey, fallback);
    return fallback;
  } catch {
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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
  concurrency = 3
): Promise<Map<string, string>> {
  await waitForGoogleMaps();

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
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return results;
}

export function getAddress(lat: number, lng: number, addressMap: Map<string, string>): string {
  return addressMap.get(getCacheKey(lat, lng)) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
