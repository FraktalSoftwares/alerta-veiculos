import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Loader2, X, Pencil, Trash2, MapPin } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { FenceMapGoogle, FenceDraft } from "@/components/vehicles/map/FenceMapGoogle";
import { useVirtualFences, useCreateVirtualFence, useUpdateVirtualFence, useDeleteVirtualFence } from "@/hooks/useVirtualFences";

export default function VeiculoCercas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id || '');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FenceDraft | null>(null);
  const [name, setName] = useState("");
  const [notifyExit, setNotifyExit] = useState(true);
  const [notifyEnter, setNotifyEnter] = useState(false);

  const equipment = vehicle?.equipment?.[0];
  const equipmentId = equipment?.id || null;

  const { data: trackingData } = useVehicleTracking(id || '');
  const { data: fences } = useVirtualFences(equipmentId || undefined);
  const createFence = useCreateVirtualFence();
  const updateFence = useUpdateVirtualFence();
  const deleteFence = useDeleteVirtualFence();

  const existing = fences && fences.length > 0 ? fences[0] : null;
  const busy = createFence.isPending || updateFence.isPending;

  const mapCenter = trackingData
    ? { lat: trackingData.latitude, lng: trackingData.longitude }
    : existing
    ? { lat: existing.latitude, lng: existing.longitude }
    : { lat: -23.5505, lng: -46.6333 };

  const startEdit = () => {
    setName(existing?.name || '');
    setNotifyExit(existing ? existing.notifyOnExit : true);
    setNotifyEnter(existing ? existing.notifyOnEnter : false);
    setDraft(existing
      ? { lat: existing.latitude, lng: existing.longitude, radius: existing.radius }
      : { lat: mapCenter.lat, lng: mapCenter.lng, radius: 100 });
    setEditing(true);
  };

  const cancel = () => { setEditing(false); setDraft(null); };

  const save = () => {
    if (!draft || !equipmentId) return;
    const payload = {
      name: name.trim() || 'Cerca',
      latitude: draft.lat, longitude: draft.lng, radius: draft.radius,
      is_primary: false, notify_on_enter: notifyEnter, notify_on_exit: notifyExit,
    };
    const done = () => { setEditing(false); setDraft(null); };
    if (existing) updateFence.mutate({ id: existing.id, data: payload }, { onSuccess: done });
    else createFence.mutate({ equipment_id: equipmentId, ...payload }, { onSuccess: done });
  };

  const remove = () => {
    if (existing && equipmentId) deleteFence.mutate({ id: existing.id, equipmentId });
  };

  if (isLoading) {
    return (<div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);
  }
  if (!vehicle || !equipmentId) {
    return (<div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20"><div className="text-center"><p className="text-destructive mb-4">Veículo não encontrado ou sem equipamento</p><Button onClick={() => navigate('/veiculos')}>Voltar para Veículos</Button></div></div></div>);
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium text-right">{value}</span></div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-muted/30">
      <Header />
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/veiculos')} className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate">Cerca Virtual</h1>
          <p className="text-xs text-muted-foreground truncate">{vehicle.plate} - {vehicle.clients?.name || 'Cliente'}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Esquerda: cerca / criar / editar */}
        <aside className="w-full lg:w-[360px] shrink-0 border-r bg-card overflow-y-auto p-4 space-y-4">
          {!editing && !existing && (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Nenhuma cerca definida para este veículo.</p>
              <Button onClick={startEdit} className="gap-2"><Plus className="h-4 w-4" />Definir cerca no mapa</Button>
            </div>
          )}

          {!editing && existing && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{existing.name}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={startEdit} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={remove} disabled={deleteFence.isPending} title="Remover"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <Row label="Raio" value={`${existing.radius} m`} />
              <Row label="Centro" value={`${existing.latitude.toFixed(5)}, ${existing.longitude.toFixed(5)}`} />
              <Row label="Avisar ao sair" value={existing.notifyOnExit ? 'Sim' : 'Não'} />
              <Row label="Avisar ao entrar" value={existing.notifyOnEnter ? 'Sim' : 'Não'} />
              <p className="text-xs text-muted-foreground pt-1">Uma cerca por veículo. "Editar" reposiciona no mapa.</p>
            </div>
          )}

          {editing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{existing ? 'Editar cerca' : 'Nova cerca'}</span>
                <button onClick={cancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">Arraste o círculo no mapa (mover / redimensionar) ou clique para reposicionar.</p>
              <div><label className="text-xs text-muted-foreground">Nome</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Garagem" className="h-9" /></div>
              <div><label className="text-xs text-muted-foreground">Raio (metros)</label>
                <Input type="number" value={draft?.radius ?? 100} onChange={(e) => { const n = parseInt(e.target.value, 10); if (draft && !Number.isNaN(n) && n > 0) setDraft({ ...draft, radius: n }); }} className="h-9" /></div>
              <div className="flex items-center justify-between"><span className="text-sm">Avisar ao sair</span><Switch checked={notifyExit} onCheckedChange={setNotifyExit} /></div>
              <div className="flex items-center justify-between"><span className="text-sm">Avisar ao entrar</span><Switch checked={notifyEnter} onCheckedChange={setNotifyEnter} /></div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={cancel}>Cancelar</Button>
                <Button className="flex-1" onClick={save} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</Button>
              </div>
            </div>
          )}
        </aside>

        {/* Direita: mapa */}
        <div className="flex-1 min-h-[300px]">
          <FenceMapGoogle center={mapCenter} fences={draft ? [] : (fences || [])} draft={draft} onDraftChange={setDraft} />
        </div>
      </div>
    </div>
  );
}
