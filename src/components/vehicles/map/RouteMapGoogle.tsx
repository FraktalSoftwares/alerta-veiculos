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

interface RouteMapGoogleProps {
  /** Centro inicial (posição atual do veículo). */
  center: { lat: number; lng: number };
  /** Pontos da rota (origem, paradas, destino). */
  points: RoutePoint[];
  /** Linha da rota seguindo as ruas (vinda do preview do servidor). */
  routePath?: Array<{ lat: number; lng: number }>;
  /** Modo edição: clique adiciona ponto e marcadores são arrastáveis. */
  editable?: boolean;
  /** Clique no mapa adiciona um ponto (só no modo edição). */
  onAddPoint?: (lat: number, lng: number) => void;
  /** Arrastar um marcador reposiciona o ponto (só no modo edição). */
  onMovePoint?: (id: string, lat: number, lng: number) => void;
}

const COLORS: Record<RoutePointType, string> = {
  origin: '#16a34a', // verde
  stop: '#f59e0b', // laranja
  destination: '#dc2626', // vermelho
};

function markerLabel(points: RoutePoint[], point: RoutePoint): string {
  if (point.type === 'origin') return 'A';
  if (point.type === 'destination') return 'B';
  const stopIndex = points.filter((p) => p.type === 'stop').indexOf(point) + 1;
  return String(stopIndex);
}

/**
 * Mapa Google para criar/visualizar rota obrigatória. Centra no veículo,
 * desenha os pontos (A / paradas / B) e a linha da rota que SEGUE AS RUAS
 * (recebida via `routePath`, calculada no servidor). No modo edição, clicar
 * adiciona pontos e os marcadores são arrastáveis.
 */
export function RouteMapGoogle({
  center,
  points,
  routePath,
  editable = false,
  onAddPoint,
  onMovePoint,
}: RouteMapGoogleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const vehicleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);
  const didFitRef = useRef(false);

  const addRef = useRef(onAddPoint);
  addRef.current = onAddPoint;
  const moveRef = useRef(onMovePoint);
  moveRef.current = onMovePoint;
  const editableRef = useRef(editable);
  editableRef.current = editable;

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
      if (editableRef.current) addRef.current?.(e.latLng.lat(), e.latLng.lng());
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
        draggable: editable,
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
      if (editable) {
        marker.addListener('dragend', (e: any) => moveRef.current?.(p.id, e.latLng.lat(), e.latLng.lng()));
      }
      return marker;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, editable]);

  // linha da rota (segue as ruas)
  useEffect(() => {
    const g = (window as any).google;
    if (!mapRef.current || !g) return;
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }
    if (routePath && routePath.length >= 2) {
      lineRef.current = new g.maps.Polyline({
        path: routePath,
        map: mapRef.current,
        strokeColor: '#2563eb',
        strokeWeight: 5,
        strokeOpacity: 0.9,
      });
      // Em visualização, enquadra a rota uma vez.
      if (!editable && !didFitRef.current) {
        const bounds = new g.maps.LatLngBounds();
        routePath.forEach((c) => bounds.extend(c));
        mapRef.current.fitBounds(bounds, 48);
        didFitRef.current = true;
      }
    }
  }, [routePath, editable]);

  // ao trocar de rota selecionada (viz), permite reenquadrar
  useEffect(() => {
    if (!editable) didFitRef.current = false;
  }, [points, editable]);

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
