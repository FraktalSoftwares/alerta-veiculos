import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Loader2, X } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { VirtualFenceList } from "@/components/vehicles/VirtualFenceList";
import { FenceMapGoogle, FenceDraft } from "@/components/vehicles/map/FenceMapGoogle";
import { useVirtualFences, useCreateVirtualFence } from "@/hooks/useVirtualFences";
import { VirtualFenceDisplay } from "@/types/virtualFence";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VeiculoCercas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: vehicle, isLoading } = useVehicle(id || '');

  const [activeTab, setActiveTab] = useState("map");
  const [draft, setDraft] = useState<FenceDraft | null>(null);
  const [name, setName] = useState("");
  const [notifyExit, setNotifyExit] = useState(true);
  const [notifyEnter, setNotifyEnter] = useState(false);

  const equipment = vehicle?.equipment?.[0];
  const equipmentId = equipment?.id || null;

  const { data: trackingData } = useVehicleTracking(id || '');
  const { data: fences } = useVirtualFences(equipmentId || undefined);
  const createFence = useCreateVirtualFence();

  const mapCenter = trackingData
    ? { lat: trackingData.latitude, lng: trackingData.longitude }
    : fences && fences.length > 0
    ? { lat: fences[0].latitude, lng: fences[0].longitude }
    : { lat: -23.5505, lng: -46.6333 };

  const startDraft = () => {
    setName("");
    setNotifyExit(true);
    setNotifyEnter(false);
    setDraft({ lat: mapCenter.lat, lng: mapCenter.lng, radius: 100 });
    setActiveTab("map");
  };

  const save = () => {
    if (!draft || !equipmentId) return;
    createFence.mutate(
      {
        equipment_id: equipmentId,
        name: name.trim() || 'Cerca',
        latitude: draft.lat,
        longitude: draft.lng,
        radius: draft.radius,
        is_primary: false,
        notify_on_enter: notifyEnter,
        notify_on_exit: notifyExit,
      },
      { onSuccess: () => { setDraft(null); setActiveTab("list"); } }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!vehicle || !equipmentId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-destructive mb-4">Veículo não encontrado ou sem equipamento</p>
            <Button onClick={() => navigate('/veiculos')}>Voltar para Veículos</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/veiculos/${id}/mapa`)} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold truncate">Cercas Virtuais</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {vehicle.plate} - {vehicle.clients?.name || 'Cliente'}
              </p>
            </div>
          </div>
          <Button onClick={startDraft} className="gap-2 w-full sm:w-auto shrink-0" disabled={!!draft}>
            <Plus className="h-4 w-4" />
            Nova Cerca
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <VirtualFenceList equipmentId={equipmentId} onFenceSelect={(f: VirtualFenceDisplay) => setActiveTab("map")} />
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <div className="relative bg-card rounded-lg border border-border overflow-hidden min-h-[280px] h-[50vh] sm:h-[500px] lg:h-[600px]">
              <FenceMapGoogle
                center={mapCenter}
                fences={fences || []}
                draft={draft}
                onDraftChange={setDraft}
              />

              {draft && (
                <div className="absolute top-3 right-3 z-10 w-[280px] max-w-[85%] rounded-xl bg-card shadow-2xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Nova cerca</span>
                    <button onClick={() => setDraft(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Arraste o círculo para mover / redimensionar, ou clique no mapa para reposicionar.
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground">Nome</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Garagem" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Raio (metros)</label>
                    <Input
                      type="number"
                      value={draft.radius}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n) && n > 0) setDraft({ ...draft, radius: n });
                      }}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avisar ao sair</span>
                    <Switch checked={notifyExit} onCheckedChange={setNotifyExit} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avisar ao entrar</span>
                    <Switch checked={notifyEnter} onCheckedChange={setNotifyEnter} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => setDraft(null)}>Cancelar</Button>
                    <Button className="flex-1" onClick={save} disabled={createFence.isPending}>
                      {createFence.isPending ? 'Salvando…' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
