import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, X, User, Info, Share2,
  Calendar, Fingerprint, Phone, Gauge, Power, Clock, MapPin, Battery,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { useVehiclePositionRealtime } from '@/hooks/useVehiclePositionRealtime';
import { batchReverseGeocode, getAddress } from '@/utils/geocoding';
import { GoogleMapTestView } from '@/components/vehicles/map/GoogleMapTestView';
import { vehicleMarkerPin } from '@/lib/vehicleMarker';

type Tab = 'motorista' | 'info' | 'share';

function elapsed(fromIso: string | null): string {
  if (!fromIso) return '—';
  const ms = Date.now() - new Date(fromIso).getTime();
  if (ms < 0 || Number.isNaN(ms)) return '—';
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

const Row = ({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2 py-1 text-sm">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground ml-auto text-right">{children}</span>
  </div>
);

const VeiculoMapaGoogleTeste = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(id || '');
  const { data: tracking, isLoading: loadingTracking } = useVehicleTracking(id || '');
  useVehiclePositionRealtime(id);

  const [address, setAddress] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('motorista');

  useEffect(() => {
    if (!tracking || !showAddress) return;
    let active = true;
    batchReverseGeocode([{ latitude: tracking.latitude, longitude: tracking.longitude }])
      .then((m) => active && setAddress(getAddress(tracking.latitude, tracking.longitude, m)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tracking?.latitude, tracking?.longitude, showAddress]);

  const equip = vehicle?.equipment?.[0] as any;
  const brand = (vehicle?.brand || '').trim();
  const model = (vehicle?.model || '').trim();
  let desc =
    model && brand && model.toLowerCase().includes(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(' ');
  desc = desc.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const title = [vehicle?.plate, desc].filter(Boolean).join(' — ');

  const iconUrl = vehicleMarkerPin({
    vehicleType: vehicle?.vehicle_type,
    speed: tracking?.speed,
    ignition: tracking?.ignition,
    recordedAt: tracking?.recorded_at,
  });
  const shareUrl = `${window.location.origin}/compartilhar/${id}`;
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link de compartilhamento copiado!');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  if (loadingVehicle) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/95 to-transparent">
        <div className="flex items-center gap-3 p-4">
          <Button variant="secondary" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-full shadow-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground">{vehicle?.plate || 'Veículo'}</h1>
            </div>
            <p className="text-xs text-muted-foreground">{vehicle?.clients?.name || 'Cliente'}</p>
          </div>
        </div>
      </div>

      {/* Card de dados (modal) */}
      {cardOpen && tracking && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[330px] max-w-[92vw] rounded-xl bg-card shadow-2xl border p-4">
          <button onClick={() => setCardOpen(false)} className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
          <div className="font-bold text-foreground pr-8 mb-2">{title || 'Veículo'}</div>
          <div className="h-px bg-border mb-2" />

          {/* Bloco comum */}
          <Row icon={Calendar} label="Data:">
            {tracking.recorded_at ? new Date(tracking.recorded_at).toLocaleString('pt-BR') : '—'}
          </Row>
          <Row icon={Fingerprint} label="IMEI:">{equip?.imei || '—'}</Row>
          <Row icon={Phone} label="Chip:">{equip?.chip_number || equip?.chip_operator || '—'}</Row>
          <Row icon={Gauge} label="Velocidade:">{tracking.speed != null ? `${tracking.speed.toFixed(0)} km/h` : '—'}</Row>
          <Row icon={Power} label="Ignição:">{tracking.ignition == null ? '—' : tracking.ignition ? 'Ligada' : 'Desligada'}</Row>
          {tracking.speed === 0 && (
            <Row icon={Clock} label="Parado há:">{elapsed(tracking.recorded_at)}</Row>
          )}
          <Row icon={MapPin} label="Endereço:">
            {showAddress ? (address || 'Buscando…') : (
              <button onClick={() => setShowAddress(true)} className="text-primary underline">Ver endereço</button>
            )}
          </Row>

          {/* Ícones das abas */}
          <div className="flex items-center justify-center gap-2 my-3">
            {([
              { key: 'motorista', icon: User, title: 'Motorista' },
              { key: 'info', icon: Info, title: 'Informações' },
              { key: 'share', icon: Share2, title: 'Compartilhar' },
            ] as { key: Tab; icon: any; title: string }[]).map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                title={title}
                onClick={() => { setTab(key); if (key === 'share') copyShare(); }}
                className={`h-10 w-10 flex items-center justify-center rounded-md border transition ${
                  tab === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted-foreground/10'
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
          <div className="h-px bg-border mb-2" />

          {/* Conteúdo da aba */}
          {tab === 'motorista' && (
            <div className="space-y-1">
              <Row icon={User} label="Motorista:">{vehicle?.clients?.name || '—'}</Row>
              {(vehicle?.clients as any)?.phone && (
                <Row icon={Phone} label="Telefone:">{(vehicle?.clients as any).phone}</Row>
              )}
            </div>
          )}
          {tab === 'info' && (
            <div className="space-y-1">
              <Row icon={MapPin} label="Latitude:">{tracking.latitude.toFixed(6)}</Row>
              <Row icon={MapPin} label="Longitude:">{tracking.longitude.toFixed(6)}</Row>
              <Row icon={Battery} label="Voltagem:">{(tracking as any).voltage ?? '— (não disponível)'}</Row>
            </div>
          )}
          {tab === 'share' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Link público (sem login):</p>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="flex-1 text-xs bg-muted rounded px-2 py-1.5 truncate" />
                <Button size="sm" onClick={copyShare}>Copiar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      {loadingTracking && !tracking ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !tracking ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">Sem posição válida para este veículo.</p>
        </div>
      ) : (
        <GoogleMapTestView
          latitude={tracking.latitude}
          longitude={tracking.longitude}
          iconUrl={iconUrl}
          onMarkerClick={() => setCardOpen(true)}
        />
      )}
    </div>
  );
};

export default VeiculoMapaGoogleTeste;
