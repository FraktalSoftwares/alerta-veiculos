import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';
import { VirtualFenceDisplay } from '@/types/virtualFence';

export interface FenceDraft { lat: number; lng: number; radius: number }

interface FenceMapGoogleProps {
  /** Centro inicial (posição do veículo). */
  center: { lat: number; lng: number };
  /** Cercas já salvas (círculos azuis, só leitura). */
  fences: VirtualFenceDisplay[];
  /** Rascunho editável (círculo laranja) ou null. */
  draft: FenceDraft | null;
  onDraftChange: (d: FenceDraft) => void;
}

/**
 * Mapa Google para criar/visualizar cercas. Em modo rascunho, mostra um
 * círculo EDITÁVEL e ARRASTÁVEL (alças de raio) — clicar no mapa reposiciona
 * o centro. As cercas salvas aparecem como círculos azuis.
 */
export function FenceMapGoogle({ center, fences, draft, onDraftChange }: FenceMapGoogleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const vehicleRef = useRef<any>(null);
  const savedCirclesRef = useRef<any[]>([]);
  const draftCircleRef = useRef<any>(null);
  const cbRef = useRef(onDraftChange);
  cbRef.current = onDraftChange;
  const { isLoaded, hasKey } = useGoogleMapsLoader();

  // init
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const g = (window as any).google;
    const map = new g.maps.Map(containerRef.current, {
      center, zoom: 15, streetViewControl: false, mapTypeControl: false, fullscreenControl: true,
    });
    vehicleRef.current = new g.maps.Marker({ position: center, map, title: 'Veículo' });
    // Clicar no mapa reposiciona o centro do rascunho.
    map.addListener('click', (e: any) => {
      if (!draftCircleRef.current) return;
      const lat = e.latLng.lat(), lng = e.latLng.lng();
      draftCircleRef.current.setCenter({ lat, lng });
      cbRef.current({ lat, lng, radius: Math.round(draftCircleRef.current.getRadius()) });
    });
    mapRef.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // move veículo / recentra quando muda o center
  useEffect(() => {
    if (!mapRef.current || !vehicleRef.current) return;
    vehicleRef.current.setPosition(center);
  }, [center.lat, center.lng]);

  // círculos das cercas salvas
  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;
    const g = (window as any).google;
    savedCirclesRef.current.forEach((c) => c.setMap(null));
    savedCirclesRef.current = fences.map((f) => new g.maps.Circle({
      map: mapRef.current, center: { lat: f.latitude, lng: f.longitude }, radius: f.radius,
      strokeColor: '#2563EB', strokeWeight: 2, fillColor: '#3B82F6', fillOpacity: 0.12,
      clickable: false,
    }));
  }, [fences]);

  // círculo do rascunho (editável)
  useEffect(() => {
    const g = (window as any).google;
    if (!mapRef.current || !g) return;
    if (draft && !draftCircleRef.current) {
      const c = new g.maps.Circle({
        map: mapRef.current, center: { lat: draft.lat, lng: draft.lng }, radius: draft.radius,
        editable: true, draggable: true,
        strokeColor: '#F59E0B', strokeWeight: 2, fillColor: '#F59E0B', fillOpacity: 0.18,
      });
      c.addListener('radius_changed', () =>
        cbRef.current({ lat: c.getCenter().lat(), lng: c.getCenter().lng(), radius: Math.round(c.getRadius()) }));
      c.addListener('center_changed', () =>
        cbRef.current({ lat: c.getCenter().lat(), lng: c.getCenter().lng(), radius: Math.round(c.getRadius()) }));
      draftCircleRef.current = c;
      mapRef.current.panTo({ lat: draft.lat, lng: draft.lng });
    } else if (!draft && draftCircleRef.current) {
      draftCircleRef.current.setMap(null);
      draftCircleRef.current = null;
    }
  }, [draft]);

  // sincroniza raio digitado no painel -> círculo
  useEffect(() => {
    const c = draftCircleRef.current;
    if (c && draft && Math.round(c.getRadius()) !== draft.radius) c.setRadius(draft.radius);
  }, [draft?.radius]);

  if (!hasKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> no .env.</p>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <div ref={containerRef} className="w-full h-full" />;
}
