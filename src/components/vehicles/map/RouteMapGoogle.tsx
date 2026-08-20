import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';

export type RoutePointType = 'origin' | 'stop' | 'destination';

export interface RoutePoint {
  id: string;
  type: RoutePointType;
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteInfo {
  distanceMeters: number;
  durationText: string;
}

interface RouteMapGoogleProps {
  /** Centro inicial (posição atual do veículo). */
  center: { lat: number; lng: number };
  /** Pontos da rota (origem, paradas, destino). */
  points: RoutePoint[];
  /** Clique no mapa adiciona um ponto na posição clicada. */
  onAddPoint: (lat: number, lng: number) => void;
  /** Arrastar um marcador reposiciona o ponto. */
  onMovePoint: (id: string, lat: number, lng: number) => void;
  /** Informa distância/tempo calculados pelo Google (ou null se rota incompleta). */
  onRouteInfo?: (info: RouteInfo | null) => void;
}

const COLORS: Record<RoutePointType, string> = {
  origin: '#16a34a', // verde
  stop: '#f59e0b', // laranja
  destination: '#dc2626', // vermelho
};

/** Rótulo do marcador: A (origem), 1..N (paradas), B (destino). */
function markerLabel(points: RoutePoint[], point: RoutePoint): string {
  if (point.type === 'origin') return 'A';
  if (point.type === 'destination') return 'B';
  const stopIndex = points.filter((p) => p.type === 'stop').indexOf(point) + 1;
  return String(stopIndex);
}

/** Ordena para o traçado: origem → paradas (na ordem) → destino. */
function orderForRoute(points: RoutePoint[]): RoutePoint[] {
  const origin = points.find((p) => p.type === 'origin');
  const stops = points.filter((p) => p.type === 'stop');
  const dest = points.find((p) => p.type === 'destination');
  return [origin, ...stops, dest].filter(Boolean) as RoutePoint[];
}

/**
 * Mapa Google para criar rota obrigatória. Centra no veículo, deixa clicar
 * para adicionar pontos (origem/parada/destino) e desenha o trajeto real de
 * carro via DirectionsService quando há origem + destino.
 */
export function RouteMapGoogle({ center, points, onAddPoint, onMovePoint, onRouteInfo }: RouteMapGoogleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const vehicleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const dirServiceRef = useRef<any>(null);
  const dirRendererRef = useRef<any>(null);
  const straightLineRef = useRef<any>(null);

  const addRef = useRef(onAddPoint);
  addRef.current = onAddPoint;
  const moveRef = useRef(onMovePoint);
  moveRef.current = onMovePoint;
  const infoRef = useRef(onRouteInfo);
  infoRef.current = onRouteInfo;

  const { isLoaded, hasKey } = useGoogleMapsLoader();

  // init
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const g = (window as any).google;
    const map = new g.maps.Map(containerRef.current, {
      center,
      zoom: 15,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
    });
    vehicleRef.current = new g.maps.Marker({
      position: center,
      map,
      title: 'Veículo (posição atual)',
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      zIndex: 1,
    });
    map.addListener('click', (e: any) => {
      addRef.current(e.latLng.lat(), e.latLng.lng());
    });
    dirServiceRef.current = new g.maps.DirectionsService();
    dirRendererRef.current = new g.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: { strokeColor: '#2563eb', strokeWeight: 5, strokeOpacity: 0.9 },
    });
    mapRef.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // recentra veículo quando muda o center
  useEffect(() => {
    if (vehicleRef.current) vehicleRef.current.setPosition(center);
  }, [center.lat, center.lng]);

  // markers dos pontos
  useEffect(() => {
    const g = (window as any).google;
    if (!mapRef.current || !g) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = points.map((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        draggable: true,
        label: { text: markerLabel(points, p), color: '#fff', fontWeight: 'bold', fontSize: '12px' },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: COLORS[p.type],
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        zIndex: 2,
      });
      marker.addListener('dragend', (e: any) => {
        moveRef.current(p.id, e.latLng.lat(), e.latLng.lng());
      });
      return marker;
    });
  }, [points]);

  // traçado da rota (DirectionsService) + info distância/tempo
  useEffect(() => {
    const g = (window as any).google;
    if (!mapRef.current || !g || !dirServiceRef.current) return;

    const ordered = orderForRoute(points);
    const origin = points.find((p) => p.type === 'origin');
    const dest = points.find((p) => p.type === 'destination');
    const stops = points.filter((p) => p.type === 'stop');

    // limpa traçados anteriores
    dirRendererRef.current.setDirections({ routes: [] });
    if (straightLineRef.current) {
      straightLineRef.current.setMap(null);
      straightLineRef.current = null;
    }

    if (!origin || !dest) {
      infoRef.current?.(null);
      return;
    }

    dirServiceRef.current.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        waypoints: stops.map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
        travelMode: g.maps.TravelMode.DRIVING,
      },
      (res: any, status: string) => {
        if (status === 'OK' && res?.routes?.[0]) {
          dirRendererRef.current.setDirections(res);
          const legs = res.routes[0].legs || [];
          const distanceMeters = legs.reduce((sum: number, l: any) => sum + (l.distance?.value || 0), 0);
          const durationSecs = legs.reduce((sum: number, l: any) => sum + (l.duration?.value || 0), 0);
          const mins = Math.round(durationSecs / 60);
          const durationText = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}min` : `${mins} min`;
          infoRef.current?.({ distanceMeters, durationText });
        } else {
          // fallback: linha reta ligando os pontos na ordem
          const path = ordered.map((p) => ({ lat: p.lat, lng: p.lng }));
          straightLineRef.current = new g.maps.Polyline({
            path,
            map: mapRef.current,
            strokeColor: '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.6,
          });
          infoRef.current?.(null);
        }
      }
    );
  }, [points]);

  if (!hasKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> no .env.
        </p>
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
