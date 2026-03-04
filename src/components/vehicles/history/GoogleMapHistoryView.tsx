/// <reference types="google.maps" />
import { useEffect, useRef } from 'react';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GoogleMapHistoryViewProps {
  trackingData: VehicleTrackingData[];
  selectedPoint?: VehicleTrackingData | null;
}

export function GoogleMapHistoryView({ trackingData, selectedPoint }: GoogleMapHistoryViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const endMarkerRef = useRef<google.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const { isLoaded } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = { lat: -23.5505, lng: -46.6333 };
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
  }, [isLoaded]);

  // Update polyline and markers when tracking data changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !trackingData.length) return;

    const map = mapInstanceRef.current;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Clear existing markers
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.setMap(null);
    }

    // Create path from tracking data
    const path = trackingData.map(point => ({
      lat: point.latitude,
      lng: point.longitude,
    }));

    // Create polyline
    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#FACC15',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });
    polyline.setMap(map);
    polylineRef.current = polyline;

    // Create start marker (green)
    const firstPoint = trackingData[0];
    const startMarker = new window.google.maps.Marker({
      position: { lat: firstPoint.latitude, lng: firstPoint.longitude },
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#22C55E',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: 'Início',
      zIndex: 10,
    });
    startMarkerRef.current = startMarker;

    // Create end marker (red)
    const lastPoint = trackingData[trackingData.length - 1];
    const endMarker = new window.google.maps.Marker({
      position: { lat: lastPoint.latitude, lng: lastPoint.longitude },
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: 'Fim',
      zIndex: 10,
    });
    endMarkerRef.current = endMarker;

    // Fit bounds to show entire route
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
    
    // Add padding after fitBounds
    const listener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 16) {
        map.setZoom(16);
      }
    });

  }, [isLoaded, trackingData]);

  // Handle selected point
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear previous selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }

    if (selectedPoint) {
      // Create selected point marker (blue)
      const marker = new window.google.maps.Marker({
        position: { lat: selectedPoint.latitude, lng: selectedPoint.longitude },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        title: 'Ponto selecionado',
        zIndex: 20,
      });
      selectedMarkerRef.current = marker;

      // Pan to selected point
      map.panTo({ lat: selectedPoint.latitude, lng: selectedPoint.longitude });
      map.setZoom(17);
    }
  }, [isLoaded, selectedPoint]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!trackingData.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Nenhum dado de rastreamento para exibir</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
