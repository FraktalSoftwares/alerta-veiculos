import { useEffect, useRef } from 'react';
import mapboxgl, { MAP_STYLE, hasMapboxToken } from '@/lib/mapbox';
import { createVehicleModelLayer, VehicleModelLayer } from '@/lib/mapbox3d';

interface MapboxViewProps {
  latitude: number;
  longitude: number;
  heading?: number;
  /** HTML do popup exibido ao clicar no marcador (dados do veículo) */
  popupHtml?: string;
  /** URL de um ícone (carro/moto). Usado quando NÃO há logo de marca. */
  iconUrl?: string;
  /** Logo da empresa (white-label) — vira o marcador quando presente. */
  logoUrl?: string | null;
  /** Cor da marca (primary_color) — anel/ponteira do pin e realces. */
  brandColor?: string | null;
  /** URL de um modelo 3D (GLB). Ativa o mapa em 3D (com pitch). */
  model3dUrl?: string | null;
  /** Tamanho do modelo no mapa, em metros (carro ~4.5, moto ~2). */
  modelSizeMeters?: number;
  /** Ajuste de rumo do modelo, se o "nariz" não apontar para -Z. */
  modelHeadingOffset?: number;
}

const DEFAULT_BRAND = '#FACC15';

/** Pin com a logo da empresa dentro e anel/ponteira na cor da marca. */
function createBrandedPin(logoUrl: string, brand: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'position:relative;width:48px;height:58px;cursor:pointer';
  el.innerHTML = `
    <div style="width:48px;height:48px;border-radius:50%;background:#fff;
                border:3px solid ${brand};box-shadow:0 2px 8px rgba(0,0,0,.35);
                display:flex;align-items:center;justify-content:center;overflow:hidden">
      <img src="${logoUrl}" alt="" style="width:36px;height:36px;object-fit:contain" />
    </div>
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);
                width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;
                border-top:12px solid ${brand};filter:drop-shadow(0 2px 1px rgba(0,0,0,.25))"></div>`;
  return el;
}

/** Ícone do veículo (carro/moto, vista de cima) — gira conforme a direção. */
function createVehicleIcon(iconUrl: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <img src="${iconUrl}" alt="veículo"
         style="width:52px;height:auto;display:block;transform-origin:center;
                filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));transition:transform .3s ease" />`;
  return el;
}

/** Área transparente (só para clique/popup) usada no modo 3D. */
function createHitArea(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:46px;height:46px;cursor:pointer;background:transparent';
  return el;
}

/** Seta padrão (sem ícone nem logo). */
function createArrow(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:28px;height:28px;cursor:pointer';
  el.innerHTML = `
    <svg viewBox="0 0 24 24" width="28" height="28" style="display:block">
      <path d="M12 2 L19 21 L12 17 L5 21 Z"
            fill="#FACC15" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
  return el;
}

/**
 * Ícone de VISTA SUPERIOR aponta para o norte (cima). Basta rotacionar pelo
 * rumo (heading) — alinha à via em qualquer direção, sempre natural.
 */
function iconTransform(heading: number): string {
  const b = ((heading % 360) + 360) % 360;
  return `rotate(${b}deg)`;
}

export function MapboxView({
  latitude,
  longitude,
  heading = 0,
  popupHtml,
  iconUrl,
  logoUrl,
  brandColor,
  model3dUrl,
  modelSizeMeters = 4.5,
  modelHeadingOffset = 0,
}: MapboxViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const layer3dRef = useRef<VehicleModelLayer | null>(null);
  // pose exibida no momento (para animar suavemente até a próxima)
  const poseRef = useRef({ lng: longitude, lat: latitude, heading });
  const animRef = useRef<number | null>(null);

  const branded = !!logoUrl;
  const use3d = !!model3dUrl;

  // Inicializa o mapa + marcador
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasMapboxToken) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 16,
      pitch: use3d ? 55 : 0, // 3D já inclinado de início
      antialias: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    const brand = brandColor || DEFAULT_BRAND;
    // No modo 3D o "marcador" é o modelo GLB; aqui só uma área de clique invisível.
    const el = use3d
      ? createHitArea()
      : branded
        ? createBrandedPin(logoUrl as string, brand)
        : iconUrl
          ? createVehicleIcon(iconUrl)
          : createArrow();
    markerElRef.current = el;

    const marker = new mapboxgl.Marker({
      element: el,
      // pin com logo aponta pelo "bico"; ícone/seta ficam centrados e giram
      anchor: branded ? 'bottom' : 'center',
      rotationAlignment: 'map',
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (!branded) {
      const img = el.querySelector('img');
      if (iconUrl && img) img.style.transform = iconTransform(heading);
      else if (!iconUrl) marker.setRotation(heading);
    }

    if (popupHtml) {
      const popup = new mapboxgl.Popup({
        offset: branded ? 28 : 18,
        maxWidth: '300px',
        className: 'vehicle-popup',
      }).setHTML(popupHtml);
      marker.setPopup(popup);
      popupRef.current = popup;
      map.on('load', () => marker.togglePopup()); // abre por padrão
    }

    // Camada 3D (GLB). A área de clique transparente cobre o popup.
    if (use3d) {
      map.on('load', () => {
        const layer = createVehicleModelLayer({
          id: 'vehicle-3d',
          modelUrl: model3dUrl as string,
          sizeMeters: modelSizeMeters,
          headingOffsetDeg: modelHeadingOffset,
          onError: (e) => console.warn('Falha ao carregar modelo 3D:', e),
        });
        layer.setPose(longitude, latitude, heading);
        map.addLayer(layer);
        layer3dRef.current = layer;
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      markerElRef.current = null;
      popupRef.current = null;
      layer3dRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Anima suavemente da pose atual até a nova posição/direção (glide)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const from = { ...poseRef.current };
    const to = { lng: longitude, lat: latitude, heading };
    // menor caminho angular para o rumo
    const dHeading = ((to.heading - from.heading + 540) % 360) - 180;
    const moved = Math.abs(to.lng - from.lng) > 1e-9 || Math.abs(to.lat - from.lat) > 1e-9;
    const duration = moved ? 1100 : 350; // parado: só ajusta o rumo rápido
    const start = performance.now();

    const apply = (lng: number, lat: number, hd: number) => {
      marker.setLngLat([lng, lat]);
      layer3dRef.current?.setPose(lng, lat, hd);
      if (!branded) {
        const img = markerElRef.current?.querySelector('img');
        if (iconUrl && img) img.style.transform = iconTransform(hd);
        else if (!iconUrl) marker.setRotation(hd);
      }
      poseRef.current = { lng, lat, heading: hd };
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t * (2 - t); // easeOut
      apply(
        from.lng + (to.lng - from.lng) * e,
        from.lat + (to.lat - from.lat) * e,
        from.heading + dHeading * e
      );
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);

    // segue o veículo suavemente (uma vez por atualização)
    if (moved) map.easeTo({ center: [longitude, latitude], duration });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [latitude, longitude, heading, iconUrl, branded]);

  // Atualiza o conteúdo do popup quando os dados mudam
  useEffect(() => {
    if (popupRef.current && popupHtml) {
      popupRef.current.setHTML(popupHtml);
    }
  }, [popupHtml]);

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
