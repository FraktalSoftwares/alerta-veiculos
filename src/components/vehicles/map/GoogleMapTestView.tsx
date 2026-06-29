import { useEffect, useRef, useState } from 'react';
import { Loader2, Layers } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';

interface GoogleMapTestViewProps {
  latitude: number;
  longitude: number;
  /** URL do PIN (carro/moto/parada) — imagem 30x45 ancorada na ponta. */
  iconUrl: string;
  /** Chamado ao clicar no marcador (abre o card de dados). */
  onMarkerClick?: () => void;
}

// Tamanho de exibição do pin (mantém proporção 30x45)
const PIN_W = 38;
const PIN_H = 57;

export function GoogleMapTestView({ latitude, longitude, iconUrl, onMarkerClick }: GoogleMapTestViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const clickRef = useRef<(() => void) | undefined>(onMarkerClick);
  clickRef.current = onMarkerClick;
  const [satellite, setSatellite] = useState(false);
  const { isLoaded, hasKey } = useGoogleMapsLoader();

  const toggleView = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !satellite;
    setSatellite(next);
    map.setMapTypeId(next ? 'hybrid' : 'roadmap'); // hybrid = satélite + nomes de ruas
  };

  const pinIcon = () => {
    const g = (window as any).google;
    return {
      url: iconUrl,
      scaledSize: new g.maps.Size(PIN_W, PIN_H),
      anchor: new g.maps.Point(PIN_W / 2, PIN_H), // ponta do pin no local
    };
  };

  // Inicializa mapa + marcador
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const g = (window as any).google;

    const map = new g.maps.Map(containerRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 16,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false, // usamos botão customizado
      mapTypeId: 'roadmap',
    });
    const marker = new g.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      icon: pinIcon(),
      title: 'Veículo',
    });
    marker.addListener('click', () => clickRef.current?.());

    mapRef.current = map;
    markerRef.current = marker;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Atualiza posição e segue o veículo
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    marker.setPosition({ lat: latitude, lng: longitude });
    map.panTo({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  // Troca o pin (carro/moto/parada) sem recriar o mapa
  useEffect(() => {
    if (markerRef.current && (window as any).google) markerRef.current.setIcon(pinIcon());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconUrl]);

  if (!hasKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> (ou <code>VITE_GOOGLE_MAPS</code>) no <code>.env</code>.
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

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={toggleView}
        className="absolute bottom-6 left-4 z-10 flex items-center gap-2 rounded-lg bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg border hover:bg-card"
        title="Trocar visão"
      >
        <Layers className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{satellite ? 'Mapa' : 'Satélite'}</span>
      </button>
    </div>
  );
}
