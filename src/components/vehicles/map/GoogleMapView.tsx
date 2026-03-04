/// <reference types="google.maps" />
import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GoogleMapViewProps {
  latitude: number;
  longitude: number;
  heading?: number;
}

export function GoogleMapView({ latitude, longitude, heading = 0 }: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { isLoaded } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 16,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Create custom marker icon (car/vehicle icon)
    const marker = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#FACC15',
        fillOpacity: 1,
        strokeColor: '#000000',
        strokeWeight: 2,
        rotation: heading,
      },
      title: 'Veículo',
    });

    markerRef.current = marker;
  }, [isLoaded]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;

    const newPosition = { lat: latitude, lng: longitude };
    
    // Smoothly animate marker to new position
    markerRef.current.setPosition(newPosition);
    
    // Update marker rotation based on heading
    markerRef.current.setIcon({
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#FACC15',
      fillOpacity: 1,
      strokeColor: '#000000',
      strokeWeight: 2,
      rotation: heading,
    });

    // Pan map to follow vehicle
    mapInstanceRef.current.panTo(newPosition);
  }, [latitude, longitude, heading]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
