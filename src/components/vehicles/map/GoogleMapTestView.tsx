import { useEffect, useRef, useState } from 'react';
import { Loader2, Layers } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';

interface GoogleMapTestViewProps {
  latitude: number;
  longitude: number;
  heading?: number;
  /** URL do ícone (carro.svg / moto.svg). */
  iconUrl: string;
  /** Chamado ao clicar no marcador (abre o card React de dados). */
  onMarkerClick?: () => void;
}

/**
 * Alinha o ícone (vista lateral "olhando" para a direita) ao rumo, mantendo-o
 * sempre em pé: na metade oeste apenas espelha na horizontal.
 */
function iconTransform(heading: number): string {
  const b = ((heading % 360) + 360) % 360;
  if (b <= 180) return `rotate(${b - 90}deg)`;
  return `scaleX(-1) rotate(${270 - b}deg)`;
}

export function GoogleMapTestView({ latitude, longitude, heading = 0, iconUrl, onMarkerClick }: GoogleMapTestViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const poseRef = useRef({ lat: latitude, lng: longitude, heading });
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

  // Inicializa mapa + overlay (marcador HTML rotacionável)
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const g = (window as any).google;

    const map = new g.maps.Map(containerRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 16,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false, // usamos botão customizado de troca de visão
      mapTypeId: 'roadmap',
    });
    mapRef.current = map;

    class VehicleOverlay extends g.maps.OverlayView {
      div?: HTMLDivElement;
      img?: HTMLImageElement;
      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.cursor = 'pointer';
        this.div.style.transform = 'translate(-50%, -50%)';
        this.img = document.createElement('img');
        this.img.src = iconUrl;
        this.img.style.width = '64px';
        this.img.style.height = 'auto';
        this.img.style.display = 'block';
        this.img.style.transformOrigin = 'center';
        this.img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
        this.div.appendChild(this.img);
        this.div.addEventListener('click', () => clickRef.current?.());
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }
      draw() {
        if (!this.div || !this.img) return;
        const proj = this.getProjection();
        if (!proj) return;
        const p = poseRef.current;
        const pt = proj.fromLatLngToDivPixel(new g.maps.LatLng(p.lat, p.lng));
        if (!pt) return;
        this.div.style.left = `${pt.x}px`;
        this.div.style.top = `${pt.y}px`;
        this.img.style.transform = iconTransform(p.heading);
      }
      onRemove() {
        this.div?.remove();
        this.div = undefined;
      }
    }

    const overlay = new VehicleOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Atualiza pose (posição/rumo) e segue o veículo
  useEffect(() => {
    poseRef.current = { lat: latitude, lng: longitude, heading };
    const map = mapRef.current;
    if (map) map.panTo({ lat: latitude, lng: longitude });
    overlayRef.current?.draw?.();
  }, [latitude, longitude, heading]);

  // Troca de ícone (carro/moto) sem recriar o mapa
  useEffect(() => {
    if (overlayRef.current?.img) overlayRef.current.img.src = iconUrl;
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
      {/* Botão de troca de visão (Mapa <-> Satélite) */}
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
