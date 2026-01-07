import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateVehicle, useVehicle } from "@/hooks/useVehicles";
import { useUnlinkEquipmentFromVehicle } from "@/hooks/useEquipment";
import { VehicleDisplay } from "@/types/vehicle";
import { Loader2, Unlink, Radio } from "lucide-react";
import { toast } from "sonner";
import { formatPlate } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleDisplay | null;
}

export function EditVehicleModal({ isOpen, onClose, vehicle }: EditVehicleModalProps) {
  const updateVehicle = useUpdateVehicle();
  const unlinkEquipment = useUnlinkEquipmentFromVehicle();
  const { data: vehicleDetails } = useVehicle(vehicle?.id);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    plate: "",
    vehicle_type: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    status: "active" as "active" | "inactive" | "blocked" | "maintenance" | "no_signal",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate,
        vehicle_type: vehicle.type || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year?.toString() || "",
        color: vehicle.color || "",
        status: vehicle.status === "rastreando" ? "active"
          : vehicle.status === "desligado" ? "inactive"
          : vehicle.status === "bloqueado" ? "blocked"
          : "no_signal",
      });
    }
  }, [vehicle]);

  const linkedEquipment = vehicleDetails?.equipment?.[0];

  const handleUnlinkEquipment = async () => {
    if (!linkedEquipment) return;
    
    try {
      await unlinkEquipment.mutateAsync(linkedEquipment.id);
      setShowUnlinkDialog(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;
    
    if (!formData.plate) {
      toast.error("Placa é obrigatória");
      return;
    }

    try {
      await updateVehicle.mutateAsync({ 
        id: vehicle.id, 
        data: {
          plate: formData.plate,
          vehicle_type: formData.vehicle_type || null,
          brand: formData.brand || null,
          model: formData.model || null,
          year: formData.year ? parseInt(formData.year) : null,
          color: formData.color || null,
          status: formData.status,
        }
      });
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!vehicle) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rastreador vinculado */}
            {linkedEquipment && (
              <div className="p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Radio className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rastreador Vinculado</p>
                      <p className="text-xs text-muted-foreground">
                        IMEI: {linkedEquipment.imei || 'N/A'} | Serial: {linkedEquipment.serial_number}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnlinkDialog(true)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4" />
                    Desvincular
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plate">
                  Placa<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-plate"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: formatPlate(e.target.value) })}
                  placeholder="ABC-1234"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Input
                  id="edit-type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="Carro, Moto, Caminhão..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-brand">Marca</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ford, Chevrolet..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Focus, Onix..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-year">Ano</Label>
                <Input
                  id="edit-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Cor</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Preto, Branco..."
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "blocked" | "maintenance" | "no_signal") => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Rastreando</SelectItem>
                    <SelectItem value="inactive">Desligado</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="no_signal">Sem Sinal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-foreground hover:bg-foreground/90 text-background"
                disabled={updateVehicle.isPending}
              >
                {updateVehicle.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Rastreador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular o rastreador <strong>IMEI: {linkedEquipment?.imei}</strong> deste veículo? 
              O rastreador voltará para o estoque como disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkEquipment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unlinkEquipment.isPending}
            >
              {unlinkEquipment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Desvincular'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
