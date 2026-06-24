import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Power, Calendar, Gauge, MapPin } from 'lucide-react';
import { usePublicVehicleMap } from '@/hooks/usePublicVehicleMap';
import { batchReverseGeocode, getAddress } from '@/utils/geocoding';
import { GoogleMapTestView } from '@/components/vehicles/map/GoogleMapTestView';
import carroIcon from '@/assets/Carro.svg';
import motoIcon from '@/assets/Moto.svg';

const VeiculoMapaPublico = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePublicVehicleMap(id || '');
  const [address, setAddress] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  const pos = data?.position || null;

  useEffect(() => {
    if (!pos || !showAddress) return;
    let active = true;
    batchReverseGeocode([{ latitude: pos.latitude, longitude: pos.longitude }])
      .then((m) => active && setAddress(getAddress(pos.latitude, pos.longitude, m)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pos?.latitude, pos?.longitude, showAddress]);

  const title = useMemo(() => {
    if (!data) return 'Veículo';
    const brand = (data.brand || '').trim();
    const model = (data.model || '').trim();
    let desc = model && brand && model.toLowerCase().includes(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(' ');
    desc = desc.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return [data.plate, desc].filter(Boolean).join(' — ') || 'Veículo';
  }, [data]);

  const iconUrl = (data?.vehicle_type || '').toLowerCase().includes('moto') ? motoIcon : carroIcon;
  const isOn = pos?.ignition === true;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-2">
        <p className="text-muted-foreground">Veículo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-4 pointer-events-none">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg pointer-events-auto">
          <h1 className="font-semibold text-foreground text-center">{title}</h1>
          <p className="text-xs text-muted-foreground text-center">{data.client_name || 'Cliente'}</p>
        </div>
      </div>

      {/* Card de dados */}
      {pos && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[320px] max-w-[92vw] rounded-xl bg-card shadow-2xl border p-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data:</span>
              <span className="ml-auto font-medium">
                {pos.recorded_at ? new Date(pos.recorded_at).toLocaleString('pt-BR') : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Velocidade:</span>
              <span className="ml-auto font-medium">{pos.speed != null ? `${pos.speed.toFixed(0)} km/h` : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Power className={`h-4 w-4 ${isOn ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground">Ignição:</span>
              <span className="ml-auto font-medium">{pos.ignition == null ? '—' : isOn ? 'Ligada' : 'Desligada'}</span>
            </div>
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

      {/* Mapa */}
      {!pos ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">Sem posição válida para este veículo.</p>
        </div>
      ) : (
        <GoogleMapTestView
          latitude={pos.latitude}
          longitude={pos.longitude}
          heading={pos.heading ?? 0}
          iconUrl={iconUrl}
        />
      )}
    </div>
  );
};

export default VeiculoMapaPublico;
