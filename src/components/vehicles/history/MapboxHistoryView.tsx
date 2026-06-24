import { useEffect, useRef } from 'react';
import mapboxgl, { MAP_STYLE, hasMapboxToken } from '@/lib/mapbox';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';

interface MapboxHistoryViewProps {
  trackingData: VehicleTrackingData[];
  selectedPoint?: VehicleTrackingData | null;
}

const ROUTE_SOURCE = 'route';
const ROUTE_LAYER = 'route-line';

export function MapboxHistoryView({ trackingData, selectedPoint }: MapboxHistoryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Inicializa o mapa uma vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasMapboxToken) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-46.6333, -23.5505], // [lng, lat]
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.on('load', () => {
      loadedRef.current = true;
      renderRoute();
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desenha a rota (polyline) + marcadores de início/fim
  const renderRoute = () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const coords = trackingData.map((p) => [p.longitude, p.latitude] as [number, number]);

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    };

    const existing = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(geojson);
    } else {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: geojson });
      map.addLayer({
        id: ROUTE_LAYER,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#FACC15', 'line-width': 4 },
      });
    }

    // limpa marcadores antigos
    startMarkerRef.current?.remove();
    endMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current = null;

    if (coords.length === 0) return;

    startMarkerRef.current = new mapboxgl.Marker({ color: '#22C55E' })
      .setLngLat(coords[0])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('Início'))
      .addTo(map);

    endMarkerRef.current = new mapboxgl.Marker({ color: '#EF4444' })
      .setLngLat(coords[coords.length - 1])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('Fim'))
      .addTo(map);

    // enquadra a rota
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 600 });
  };

  // Re-renderiza quando os dados mudam
  useEffect(() => {
    if (loadedRef.current) renderRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingData]);

  // Marcador do ponto selecionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;

    if (selectedPoint) {
      const lngLat: [number, number] = [selectedPoint.longitude, selectedPoint.latitude];
      selectedMarkerRef.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat(lngLat)
        .addTo(map);
      map.flyTo({ center: lngLat, zoom: 17, duration: 800 });
    }
  }, [selectedPoint]);

  if (!hasMapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Configure <code>VITE_MAPBOX_TOKEN</code> no <code>.env</code> para exibir o mapa.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
