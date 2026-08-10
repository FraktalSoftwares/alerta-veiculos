import { useEffect, useMemo, useState } from 'react';
import { Loader2, X, Calendar, Gauge, Power, MapPin, Fingerprint } from 'lucide-react';
import { GoogleMapTestView } from './GoogleMapTestView';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { useVehiclePositionRealtime } from '@/hooks/useVehiclePositionRealtime';
import { batchReverseGeocode, getAddress } from '@/utils/geocoding';
import { vehicleMarkerPin } from '@/lib/vehicleMarker';

interface SelectedVehicleMapProps {
  vehicleId: string;
}

function Row({ icon: Icon, label, value, iconClass }: { icon: any; label: string; value: string; iconClass?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${iconClass || 'text-muted-foreground'}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium text-right">{value}</span>
    </div>
  );
}

/**
 * Mapa do veículo selecionado — Google Maps (mesmo mapa da tela pública),
 * lendo a última posição válida de `positions` (dados corrigidos) e atualizando
 * ao vivo. O card de dados fica fechado por padrão e abre ao clicar no pino.
 */
export function SelectedVehicleMap({ vehicleId }: SelectedVehicleMapProps) {
  const { data: tracking, isLoading } = useVehicleTracking(vehicleId);
  const { data: vehicle } = useVehicle(vehicleId);
  useVehiclePositionRealtime(vehicleId);

  const [cardOpen, setCardOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  // Geocodifica o endereço só quando o usuário pede (economiza chamadas).
  useEffect(() => {
    if (!tracking || !showAddress) return;
    let active = true;
    batchReverseGeocode([{ latitude: tracking.latitude, longitude: tracking.longitude }])
      .then((m) => {
        if (active) setAddress(getAddress(tracking.latitude, tracking.longitude, m));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tracking?.latitude, tracking?.longitude, showAddress]);

  const title = useMemo(() => {
    const brand = (vehicle?.brand || '').trim();
    const model = (vehicle?.model || '').trim();
    let desc = model && brand && model.toLowerCase().includes(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(' ');
    desc = desc.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return [vehicle?.plate, desc].filter(Boolean).join(' — ') || 'Veículo';
  }, [vehicle]);

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

  const equip = vehicle?.equipment?.[0];
  const isOn = tracking.ignition === true;
  const iconUrl = vehicleMarkerPin({
    vehicleType: (vehicle as any)?.vehicle_type,
    speed: tracking.speed,
    ignition: tracking.ignition,
    recordedAt: tracking.recorded_at,
  });

  return (
    <div className="w-full h-full flex-1 min-h-[240px] relative">
      <GoogleMapTestView
        latitude={tracking.latitude}
        longitude={tracking.longitude}
        iconUrl={iconUrl}
        onMarkerClick={() => setCardOpen((v) => !v)}
      />

      {cardOpen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[320px] max-w-[92vw] rounded-xl bg-card shadow-2xl border p-4">
          <button
            onClick={() => setCardOpen(false)}
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="font-bold text-sm text-foreground mb-2 pr-6 leading-tight">{title}</div>
          <div className="h-px bg-border mb-2" />
          <div className="space-y-1.5 text-sm">
            <Row icon={Calendar} label="Data:" value={tracking.recorded_at ? new Date(tracking.recorded_at).toLocaleString('pt-BR') : '—'} />
            {equip?.imei && <Row icon={Fingerprint} label="IMEI:" value={equip.imei} />}
            <Row icon={Gauge} label="Velocidade:" value={tracking.speed != null ? `${tracking.speed.toFixed(0)} km/h` : '—'} />
            <Row icon={Power} label="Ignição:" value={tracking.ignition == null ? '—' : isOn ? 'Ligada' : 'Desligada'} iconClass={isOn ? 'text-green-500' : undefined} />
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span className="text-muted-foreground">Endereço:</span>
              <span className="ml-auto font-medium text-right">
                {showAddress ? (address || 'Buscando…') : (
                  <button onClick={() => setShowAddress(true)} className="text-primary underline">Ver endereço</button>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
