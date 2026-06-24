import { useEffect, useRef } from 'react';
import mapboxgl, { MAP_STYLE, hasMapboxToken } from '@/lib/mapbox';
import { VirtualFenceDisplay } from '@/types/virtualFence';

interface VirtualFenceMapViewProps {
  latitude: number;
  longitude: number;
  fences?: VirtualFenceDisplay[];
  onLocationClick?: (lat: number, lng: number) => void;
  isSelectingLocation?: boolean;
  selectedFenceId?: string | null;
}

const FENCE_SOURCE = 'fences';
const FENCE_FILL = 'fences-fill';
const FENCE_LINE = 'fences-line';

/** Aproxima um círculo (raio em metros) por um polígono GeoJSON. */
function circlePolygon(lng: number, lat: number, radiusM: number, steps = 64): number[][] {
  const coords: number[][] = [];
  const dx = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const dy = radiusM / 110540;
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    coords.push([lng + dx * Math.cos(theta), lat + dy * Math.sin(theta)]);
  }
  coords.push(coords[0]);
  return coords;
}

function fenceColor(fence: VirtualFenceDisplay, selected: boolean): string {
  if (selected) return '#FF0000';
  if (fence.isPrimary) return '#3B82F6';
  return '#10B981';
}

function createVehicleElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <svg viewBox="0 0 24 24" width="26" height="26" style="display:block">
      <circle cx="12" cy="12" r="8" fill="#FACC15" stroke="#000" stroke-width="2"/>
    </svg>`;
  return el;
}

export function VirtualFenceMapView({
  latitude,
  longitude,
  fences = [],
  onLocationClick,
  isSelectingLocation = false,
  selectedFenceId,
}: VirtualFenceMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const centerMarkersRef = useRef<mapboxgl.Marker[]>([]);
  // refs sempre atuais para usar dentro de handlers/load
  const onLocationClickRef = useRef(onLocationClick);
  const isSelectingRef = useRef(isSelectingLocation);
  onLocationClickRef.current = onLocationClick;
  isSelectingRef.current = isSelectingLocation;

  // Inicializa o mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasMapboxToken) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 15,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      if (isSelectingRef.current && onLocationClickRef.current) {
        onLocationClickRef.current(e.lngLat.lat, e.lngLat.lng);
      }
    });

    map.on('load', () => {
      loadedRef.current = true;
      vehicleMarkerRef.current = new mapboxgl.Marker({ element: createVehicleElement() })
        .setLngLat([longitude, latitude])
        .addTo(map);
      renderFences();
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza posição do veículo
  useEffect(() => {
    vehicleMarkerRef.current?.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  // Desenha/atualiza as cercas
  const renderFences = () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = fences.map((f) => {
      const selected = f.id === selectedFenceId;
      return {
        type: 'Feature',
        properties: { color: fenceColor(f, selected), selected },
        geometry: { type: 'Polygon', coordinates: [circlePolygon(f.longitude, f.latitude, f.radius)] },
      };
    });
    const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };

    const src = map.getSource(FENCE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
    } else {
      map.addSource(FENCE_SOURCE, { type: 'geojson', data });
      map.addLayer({
        id: FENCE_FILL, type: 'fill', source: FENCE_SOURCE,
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.15 },
      });
      map.addLayer({
        id: FENCE_LINE, type: 'line', source: FENCE_SOURCE,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['get', 'selected'], 3, 2],
          'line-opacity': 0.8,
        },
      });
    }

    // marcadores de centro (com popup)
    centerMarkersRef.current.forEach((m) => m.remove());
    centerMarkersRef.current = fences.map((f) => {
      const selected = f.id === selectedFenceId;
      const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(`
        <div style="padding:4px">
          <strong>${f.name}</strong><br/>
          Raio: ${f.radius}m<br/>
          ${f.speedLimit ? `Velocidade: ${f.speedLimit} km/h<br/>` : ''}
          ${f.isPrimary ? '<span style="color:#3B82F6">Principal</span><br/>' : ''}
          Notificar: ${f.notifyOnEnter ? 'Entrada' : ''}${f.notifyOnEnter && f.notifyOnExit ? ' e ' : ''}${f.notifyOnExit ? 'Saída' : ''}
        </div>`);
      return new mapboxgl.Marker({ color: fenceColor(f, selected) })
        .setLngLat([f.longitude, f.latitude])
        .setPopup(popup)
        .addTo(map);
    });

    // enquadra
    if (fences.length > 0) {
      const bounds = new mapboxgl.LngLatBounds([longitude, latitude], [longitude, latitude]);
      fences.forEach((f) => {
        circlePolygon(f.longitude, f.latitude, f.radius).forEach((c) =>
          bounds.extend(c as [number, number])
        );
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 500 });
    } else {
      map.easeTo({ center: [longitude, latitude], zoom: 15, duration: 400 });
    }
  };

  useEffect(() => {
    if (loadedRef.current) renderFences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fences, selectedFenceId]);

  if (!hasMapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Configure <code>VITE_MAPBOX_TOKEN</code> no <code>.env</code> para exibir o mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Clique no mapa para definir a localização</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
