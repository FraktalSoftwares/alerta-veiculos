import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Loader2, Radio } from "lucide-react";
import { useCreateVirtualFence, useUpdateVirtualFence, useVirtualFence } from "@/hooks/useVirtualFences";
import { VirtualFenceDisplay, VirtualFenceFormData } from "@/types/virtualFence";
import { useToast } from "@/hooks/use-toast";

interface VirtualFenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  fenceId?: string | null; // Se fornecido, é edição
  onLocationSelect?: () => void; // Callback para selecionar no mapa
  initialLocation?: { lat: number; lng: number } | null; // Localização inicial do mapa
}

export function VirtualFenceModal({
  open,
  onOpenChange,
  equipmentId,
  fenceId,
  onLocationSelect,
  initialLocation,
}: VirtualFenceModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VirtualFenceFormData>({
    equipment_id: equipmentId,
    name: '',
    latitude: 0,
    longitude: 0,
    radius: 100, // 100 metros padrão
    speed_limit: null,
    is_primary: false,
    notify_on_enter: true,
    notify_on_exit: true,
  });

  // Busca dados da cerca se for edição
  const { data: existingFence, isLoading: isLoadingFence } = useVirtualFence(fenceId || undefined);
  const createFence = useCreateVirtualFence();
  const updateFence = useUpdateVirtualFence();

  // Preenche formulário quando carrega cerca existente
  useEffect(() => {
    if (existingFence) {
      setFormData({
        equipment_id: existingFence.equipmentId,
        name: existingFence.name,
        latitude: existingFence.latitude,
        longitude: existingFence.longitude,
        radius: existingFence.radius,
        speed_limit: existingFence.speedLimit,
        is_primary: existingFence.isPrimary,
        notify_on_enter: existingFence.notifyOnEnter,
        notify_on_exit: existingFence.notifyOnExit,
      });
    } else if (!fenceId) {
      // Reset para novo
      setFormData({
        equipment_id: equipmentId,
        name: '',
        latitude: initialLocation?.lat || 0,
        longitude: initialLocation?.lng || 0,
        radius: 100,
        speed_limit: null,
        is_primary: false,
        notify_on_enter: true,
        notify_on_exit: true,
      });
    }
  }, [existingFence, fenceId, equipmentId, initialLocation]);

  // Atualiza localização quando selecionada no mapa
  useEffect(() => {
    if (initialLocation && initialLocation.lat !== 0 && initialLocation.lng !== 0) {
      setFormData(prev => ({
        ...prev,
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
      }));
    }
  }, [initialLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da cerca é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione uma localização no mapa',
        variant: 'destructive',
      });
      return;
    }

    if (formData.radius <= 0) {
      toast({
        title: 'Erro',
        description: 'O raio deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (fenceId) {
        await updateFence.mutateAsync({ id: fenceId, data: formData });
      } else {
        await createFence.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleSelectLocation = () => {
    if (onLocationSelect) {
      // Fecha o modal para que o usuário possa ver o mapa
      onOpenChange(false);
      // Chama o callback para ativar modo de seleção no mapa pai
      onLocationSelect();
    }
  };

  const isLoading = createFence.isPending || updateFence.isPending || isLoadingFence;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 max-h-[90vh] overflow-auto">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">
            {fenceId ? 'Editar Cerca Virtual' : 'Nova Cerca Virtual'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Cerca *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Escritório Central"
              required
            />
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label>Localização *</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="-23.5505"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  placeholder="-46.6333"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Selecionar no Mapa
                </Button>
              </div>
            </div>
            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <p className="text-xs text-muted-foreground">
                Localização: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Raio */}
          <div className="space-y-2">
            <Label htmlFor="radius">Raio (metros) *</Label>
            <Input
              id="radius"
              type="number"
              min="1"
              value={formData.radius}
              onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) || 0 }))}
              placeholder="100"
              required
            />
            <p className="text-xs text-muted-foreground">
              Distância em metros do centro da cerca
            </p>
          </div>

          {/* Limite de Velocidade */}
          <div className="space-y-2">
            <Label htmlFor="speed_limit">Limite de Velocidade (km/h)</Label>
            <Input
              id="speed_limit"
              type="number"
              min="0"
              value={formData.speed_limit || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                speed_limit: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="Opcional"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para não definir limite de velocidade
            </p>
          </div>

          {/* Cerca Principal */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked as boolean }))}
            />
            <Label htmlFor="is_primary" className="cursor-pointer">
              Definir como cerca principal
            </Label>
          </div>
          {formData.is_primary && (
            <p className="text-xs text-muted-foreground ml-6">
              A cerca principal será usada como padrão para este equipamento
            </p>
          )}

          {/* Notificações */}
          <div className="space-y-4 border-t border-border pt-4">
            <Label className="text-base font-medium">Notificações</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_on_enter"
                checked={formData.notify_on_enter}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_on_enter: checked as boolean }))}
              />
              <Label htmlFor="notify_on_enter" className="cursor-pointer">
                Notificar ao entrar na cerca
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify_on_exit"
                checked={formData.notify_on_exit}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_on_exit: checked as boolean }))}
              />
              <Label htmlFor="notify_on_exit" className="cursor-pointer">
                Notificar ao sair da cerca
              </Label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {fenceId ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                fenceId ? 'Salvar' : 'Criar Cerca'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

