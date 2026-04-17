import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Trash2 } from "lucide-react";
import { useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from "@/hooks/useEquipment";
import { EquipmentDisplay } from "@/types/equipment";
import { formatIMEI, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NewEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: EquipmentDisplay | null;
}

export interface EquipmentFormData {
  serial_number: string;
  imei: string;
  chip_number: string;
  chip_operator: string;
  status: string;
  model_type?: string;
  owner_id?: string;
}

export function NewEquipmentModal({ open, onOpenChange, equipment }: NewEquipmentModalProps) {
  const isEditing = !!equipment;
  const { profile } = useAuth();
  const isAdmin = profile?.user_type === 'admin';

  const clientTypeLabels: Record<string, string> = {
    associacao: 'Associação',
    frotista: 'Frotista',
    franquia: 'Franquia',
    franqueado: 'Franqueado',
  };

  const { data: assignableOwners } = useQuery({
    queryKey: ['equipment-assignable-owners'],
    enabled: isAdmin && open,
    queryFn: async () => {
      const targetTypes = ['associacao', 'frotista', 'franquia', 'franqueado'];

      const [profilesRes, clientsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, user_type')
          .in('user_type', targetTypes as ('associacao' | 'frotista' | 'franquia' | 'franqueado')[]),
        supabase
          .from('clients')
          .select('id, name, client_type, user_id')
          .in('client_type', targetTypes as ('associacao' | 'frotista' | 'franquia' | 'franqueado')[])
          .not('user_id', 'is', null),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const byUserId = new Map<string, { id: string; name: string; type: string }>();

      for (const p of profilesRes.data || []) {
        byUserId.set(p.id, {
          id: p.id,
          name: p.full_name || '(sem nome)',
          type: p.user_type,
        });
      }

      for (const c of clientsRes.data || []) {
        if (!c.user_id) continue;
        byUserId.set(c.user_id, {
          id: c.user_id,
          name: (c.name || '').trim() || '(sem nome)',
          type: c.client_type,
        });
      }

      return Array.from(byUserId.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const [formData, setFormData] = useState<EquipmentFormData>({
    serial_number: "",
    imei: "",
    chip_number: "",
    chip_operator: "",
    status: "available",
    model_type: "",
    owner_id: "",
  });

  // Atualiza o formulário quando o equipamento ou o modal abrir mudar
  useEffect(() => {
    if (open) {
      if (equipment) {
        // Mapeia o modelo do equipamento para o model_type
        const modelType = equipment.model === 'J16' ? 'J16' :
                         equipment.model === '8310' ? '8310' :
                         equipment.model === '310' ? '310' : '';
        
        // Converte o status do display para o status do banco
        // Se dbStatus estiver disponível, usa ele, senão converte do status do display
        let statusValue = 'available';
        if (equipment.dbStatus) {
          statusValue = equipment.dbStatus;
        } else {
          // Converte do status do display para o status do banco
          // Se o equipamento está instalado (tem vehicleId), usa 'installed'
          if (equipment.vehicleId && equipment.status === 'funcionando') {
            statusValue = 'installed';
          } else {
            statusValue = equipment.status === 'funcionando' ? 'available' :
                         equipment.status === 'manutencao' ? 'maintenance' :
                         equipment.status === 'defeito' ? 'defective' :
                         equipment.status === 'na_loja' ? 'in_store' : 'available';
          }
        }
        
        // Se o owner é o próprio admin, considera como "sem vínculo"
        const ownerValue = (equipment.ownerId && equipment.ownerId !== profile?.id)
          ? equipment.ownerId
          : "";

        setFormData({
          serial_number: equipment.serialNumber || "",
          imei: equipment.imei === "-" ? "" : equipment.imei || "",
          chip_number: equipment.chipNumber || "",
          chip_operator: equipment.chipOperator || "",
          status: statusValue,
          model_type: modelType,
          owner_id: ownerValue,
        });
      } else {
        // Limpa o formulário para criar novo equipamento
        setFormData({
          serial_number: "",
          imei: "",
          chip_number: "",
          chip_operator: "",
          status: "available",
          model_type: "",
          owner_id: "",
        });
      }
    }
  }, [equipment, open]);

  // Determina o label do campo baseado no modelo selecionado
  const getFieldLabel = () => {
    if (formData.model_type === '8310') {
      return 'ESN';
    }
    return 'IMEI';
  };

  // Determina o placeholder baseado no modelo selecionado
  const getFieldPlaceholder = () => {
    if (formData.model_type === '8310') {
      return 'Digite o ESN';
    }
    return 'Digite o IMEI (15 dígitos)';
  };

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const handleSubmit = () => {
    if (!formData.serial_number) {
      return;
    }

    if (isEditing && equipment) {
      updateEquipment.mutate({
        id: equipment.id,
        data: {
          serial_number: formData.serial_number,
          imei: formData.imei || undefined,
          chip_number: formData.chip_number || undefined,
          chip_operator: formData.chip_operator || undefined,
          model: formData.model_type || undefined,
          status: formData.status as 'available' | 'installed' | 'maintenance' | 'defective',
          ...(isAdmin && { owner_id: formData.owner_id || null }),
        },
      }, {
        onSuccess: () => {
          onOpenChange(false);
        }
      });
    } else {
      createEquipment.mutate({
        serial_number: formData.serial_number,
        imei: formData.imei || undefined,
        chip_number: formData.chip_number || undefined,
        chip_operator: formData.chip_operator || undefined,
        model: formData.model_type || undefined,
        status: formData.status as 'available' | 'installed' | 'maintenance' | 'defective',
        ...(isAdmin ? { owner_id: formData.owner_id || null } : {}),
      }, {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            serial_number: "",
            imei: "",
            chip_number: "",
            chip_operator: "",
            status: "available",
            model_type: "",
            owner_id: "",
          });
        }
      });
    }
  };

  const handleDelete = () => {
    if (equipment) {
      deleteEquipment.mutate(equipment.id, {
        onSuccess: () => {
          onOpenChange(false);
        }
      });
    }
  };

  const isPending = createEquipment.isPending || updateEquipment.isPending || deleteEquipment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 bg-muted/50 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-semibold text-center">
            {isEditing ? 'Editar equipamento' : 'Cadastrar equipamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto">
          <div className="border border-border rounded-lg p-6 space-y-6">
            {/* Número de Série */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Número de Série *</Label>
              <Input
                placeholder="Ex: GT06-123456"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Modelo</Label>
              <Select
                value={formData.model_type}
                onValueChange={(value) => setFormData({ ...formData, model_type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="J16">J16</SelectItem>
                  <SelectItem value="8310">8310</SelectItem>
                  <SelectItem value="310">310</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IMEI/ESN (dinâmico) */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{getFieldLabel()}</Label>
              <Input
                placeholder={getFieldPlaceholder()}
                value={formData.imei}
                onChange={(e) => {
                  // Aplica formatação apenas para IMEI (não para ESN)
                  const value = formData.model_type === '8310' 
                    ? e.target.value 
                    : formatIMEI(e.target.value);
                  setFormData({ ...formData, imei: value });
                }}
                className="bg-background"
                maxLength={formData.model_type === '8310' ? undefined : 15}
              />
            </div>

            {/* Chip e Operadora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Número do Chip</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={formData.chip_number}
                  onChange={(e) => setFormData({ ...formData, chip_number: formatPhone(e.target.value) })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Operadora</Label>
                <Select
                  value={formData.chip_operator}
                  onValueChange={(value) => setFormData({ ...formData, chip_operator: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vivo">Vivo</SelectItem>
                    <SelectItem value="Claro">Claro</SelectItem>
                    <SelectItem value="TIM">TIM</SelectItem>
                    <SelectItem value="Oi">Oi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Situação */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Situação</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="installed">Instalado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="defective">Defeito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vincular a usuário (apenas admin) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {isEditing ? 'Proprietário' : 'Atribuir a usuário'}
                </Label>
                <Select
                  value={formData.owner_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, owner_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Sem vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vínculo</SelectItem>
                    {(assignableOwners || []).map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({clientTypeLabels[owner.type] ?? owner.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            {isEditing ? (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir equipamento
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formData.serial_number}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2"
            >
              <Check className="h-4 w-4" />
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
