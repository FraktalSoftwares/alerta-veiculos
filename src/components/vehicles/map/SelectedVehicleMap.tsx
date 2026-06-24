import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MapboxView } from './MapboxView';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { useVehiclePositionRealtime } from '@/hooks/useVehiclePositionRealtime';
import { batchReverseGeocode, getAddress } from '@/utils/geocoding';
import { useClientCustomization } from '@/contexts/ClientCustomizationContext';
import motoModel from '@/assets/moto3d.glb?url';
import carroModel from '@/assets/Carro3d.glb?url';

/** Modelo 3D (GLB) por tipo. */
function model3dForType(vehicleType?: string | null): { url: string; size: number } {
  // Por enquanto carro e moto usam o mesmo modelo 3D (Carro3d.glb).
  // size = tamanho na tela em pixels (constante em qualquer zoom)
  return { url: carroModel, size: 90 };
}

interface SelectedVehicleMapProps {
  vehicleId: string;
}

function row(label: string, value: string): string {
  return `
    <div style="display:flex;gap:8px;margin:2px 0;font-size:12px">
      <span style="color:#6b7280;min-width:78px">${label}</span>
      <span style="color:#111827;font-weight:500">${value}</span>
    </div>`;
}

/**
 * Mapa do veículo selecionado — lê a última posição válida de `positions`
 * (dados corrigidos), atualiza ao vivo e mostra um popup com os dados ao
 * clicar no marcador (placa, data, IMEI, velocidade, ignição, endereço, lat/lng).
 */
export function SelectedVehicleMap({ vehicleId }: SelectedVehicleMapProps) {
  const { data: tracking, isLoading } = useVehicleTracking(vehicleId);
  const { data: vehicle } = useVehicle(vehicleId);
  const { customization } = useClientCustomization();
  useVehiclePositionRealtime(vehicleId);

  const [address, setAddress] = useState<string>('');

  // Geocodifica o endereço da posição atual
  useEffect(() => {
    if (!tracking) return;
    let active = true;
    batchReverseGeocode([{ latitude: tracking.latitude, longitude: tracking.longitude }])
      .then((map) => {
        if (active) setAddress(getAddress(tracking.latitude, tracking.longitude, map));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tracking?.latitude, tracking?.longitude]);

  const popupHtml = useMemo(() => {
    if (!tracking) return undefined;
    const equip = vehicle?.equipment?.[0];
    const brand = (vehicle?.brand || '').trim();
    const model = (vehicle?.model || '').trim();
    // evita "HONDA//HONDA/CG 160": se o modelo já contém a marca, usa só o modelo
    let desc = model && brand && model.toLowerCase().includes(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(' ');
    desc = desc.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const title = [vehicle?.plate, desc].filter(Boolean).join(' — ');
    const data = tracking.recorded_at
      ? new Date(tracking.recorded_at).toLocaleString('pt-BR')
      : '—';
    const speed = tracking.speed != null ? `${tracking.speed.toFixed(2)} km/h` : '—';
    const ign = tracking.ignition == null ? '—' : tracking.ignition ? 'Ligada' : 'Desligada';

    return `
      <div style="min-width:236px">
        <div style="font-weight:700;font-size:14px;color:#111827;margin:0 30px 8px 0;line-height:1.3">${title || 'Veículo'}</div>
        <div style="height:1px;background:#e5e7eb;margin:0 0 8px"></div>
        ${row('Data:', data)}
        ${equip?.imei ? row('IMEI:', equip.imei) : ''}
        ${row('Velocidade:', speed)}
        ${row('Ignição:', ign)}
        ${address ? row('Endereço:', address) : ''}
        ${row('Latitude:', tracking.latitude.toFixed(6))}
        ${row('Longitude:', tracking.longitude.toFixed(6))}
      </div>`;
  }, [tracking, vehicle, address]);

  if (isLoading) {
    return (
      <div className="w-full flex-1 min-h-[240px] flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="w-full flex-1 min-h-[240px] flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground p-4">
          <p className="text-base sm:text-lg font-semibold mb-2">Sem posição válida</p>
          <p className="text-sm">Ainda não há posição GPS válida registrada para este veículo.</p>
        </div>
      </div>
    );
  }

  const model = model3dForType((vehicle as any)?.vehicle_type);

  return (
    <MapboxView
      latitude={tracking.latitude}
      longitude={tracking.longitude}
      heading={tracking.heading ?? 0}
      popupHtml={popupHtml}
      logoUrl={customization?.logo_url}
      brandColor={customization?.primary_color}
      model3dUrl={model.url}
      modelSizeMeters={model.size}
      modelHeadingOffset={270}
    />
  );
}
