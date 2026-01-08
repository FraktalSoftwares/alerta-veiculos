/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { VirtualFenceDisplay } from '@/types/virtualFence';

interface VirtualFenceMapViewProps {
  latitude: number;
  longitude: number;
  fences?: VirtualFenceDisplay[];
  onLocationClick?: (lat: number, lng: number) => void;
  isSelectingLocation?: boolean;
  selectedFenceId?: string | null;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

declare global {
  interface Window {
    initVirtualFenceMap: () => void;
  }
}

export function VirtualFenceMapView({
  latitude,
  longitude,
  fences = [],
  onLocationClick,
  isSelectingLocation = false,
  selectedFenceId,
}: VirtualFenceMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    window.initVirtualFenceMap = () => {
      setIsLoaded(true);
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initVirtualFenceMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initVirtualFenceMap;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Add click listener if selecting location
    if (isSelectingLocation && onLocationClick) {
      clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onLocationClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    return () => {
      if (clickListenerRef.current) {
        window.google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [isLoaded, latitude, longitude, isSelectingLocation, onLocationClick]);

  // Update click listener when selecting location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing listener
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // Add new listener if selecting location
    if (isSelectingLocation && onLocationClick) {
      clickListenerRef.current = mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onLocationClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    }
  }, [isSelectingLocation, onLocationClick]);

  // Draw fences as circles
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing circles and markers
    circlesRef.current.forEach(circle => circle.setMap(null));
    markersRef.current.forEach(marker => marker.setMap(null));
    circlesRef.current = [];
    markersRef.current = [];

    // Draw each fence
    fences.forEach((fence) => {
      const isSelected = fence.id === selectedFenceId;
      const isPrimary = fence.isPrimary;

      // Create circle for fence
      const circle = new window.google.maps.Circle({
        strokeColor: isSelected ? '#FF0000' : isPrimary ? '#3B82F6' : '#10B981',
        strokeOpacity: 0.8,
        strokeWeight: isSelected ? 3 : 2,
        fillColor: isSelected ? '#FF0000' : isPrimary ? '#3B82F6' : '#10B981',
        fillOpacity: 0.15,
        map: map,
        center: { lat: fence.latitude, lng: fence.longitude },
        radius: fence.radius, // radius in meters
      });

      circlesRef.current.push(circle);

      // Create marker for center
      const marker = new window.google.maps.Marker({
        position: { lat: fence.latitude, lng: fence.longitude },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 8 : isPrimary ? 7 : 6,
          fillColor: isSelected ? '#FF0000' : isPrimary ? '#3B82F6' : '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: `${fence.name} - ${fence.radius}m`,
        zIndex: isSelected ? 100 : isPrimary ? 50 : 10,
      });

      markersRef.current.push(marker);

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${fence.name}</strong><br/>
            Raio: ${fence.radius}m<br/>
            ${fence.speedLimit ? `Velocidade: ${fence.speedLimit} km/h<br/>` : ''}
            ${fence.isPrimary ? '<span style="color: #3B82F6;">Principal</span><br/>' : ''}
            Notificar: ${fence.notifyOnEnter ? 'Entrada' : ''} ${fence.notifyOnEnter && fence.notifyOnExit ? 'e' : ''} ${fence.notifyOnExit ? 'Saída' : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

    // Fit bounds to show all fences if there are any
    if (fences.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      fences.forEach(fence => {
        // Extend bounds to include the circle
        const circleBounds = new window.google.maps.Circle({
          center: { lat: fence.latitude, lng: fence.longitude },
          radius: fence.radius,
        }).getBounds();
        if (circleBounds) {
          bounds.union(circleBounds);
        }
      });
      map.fitBounds(bounds);
    } else {
      // Center on provided location
      map.setCenter({ lat: latitude, lng: longitude });
      map.setZoom(15);
    }
  }, [isLoaded, fences, selectedFenceId]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Clique no mapa para definir a localização</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
