/**
 * Link do Google Maps apontando para uma coordenada.
 * Ao abrir, cai no Google Maps do próprio cliente (app ou site) com um pin
 * na posição — NÃO abre a nossa plataforma.
 */
export function googleMapsLocationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
