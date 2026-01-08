import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, MapPin, Edit, Trash2, Radio, Bell, BellOff } from "lucide-react";
import { useVirtualFences, useDeleteVirtualFence } from "@/hooks/useVirtualFences";
import { VirtualFenceDisplay } from "@/types/virtualFence";
import { VirtualFenceModal } from "./VirtualFenceModal";
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
import { useToast } from "@/hooks/use-toast";

interface VirtualFenceListProps {
  equipmentId: string;
  onFenceSelect?: (fence: VirtualFenceDisplay) => void; // Para mostrar no mapa
}

export function VirtualFenceList({ equipmentId, onFenceSelect }: VirtualFenceListProps) {
  const { toast } = useToast();
  const { data: fences, isLoading } = useVirtualFences(equipmentId);
  const deleteFence = useDeleteVirtualFence();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFenceId, setEditingFenceId] = useState<string | null>(null);
  const [deletingFenceId, setDeletingFenceId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingFenceId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (fenceId: string) => {
    setEditingFenceId(fenceId);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFenceId) return;
    
    try {
      await deleteFence.mutateAsync({ 
        id: deletingFenceId, 
        equipmentId 
      });
      setDeletingFenceId(null);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleShowOnMap = (fence: VirtualFenceDisplay) => {
    if (onFenceSelect) {
      onFenceSelect(fence);
    } else {
      toast({
        title: 'Cerca selecionada',
        description: `${fence.name} - ${fence.radius}m de raio`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!fences || fences.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cercas Virtuais</h3>
          <Button onClick={handleCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Cerca
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Radio className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma cerca virtual cadastrada</p>
          <p className="text-sm">Crie uma cerca para começar</p>
        </div>

        <VirtualFenceModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingFenceId(null);
            }
          }}
          equipmentId={equipmentId}
          fenceId={editingFenceId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cercas Virtuais ({fences.length})</h3>
        <Button onClick={handleCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cerca
        </Button>
      </div>

      <div className="space-y-2">
        {fences.map((fence) => (
          <div
            key={fence.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{fence.name}</h4>
                  {fence.isPrimary && (
                    <Badge variant="default" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    <span>Raio: {fence.radius}m</span>
                  </div>
                  {fence.speedLimit && (
                    <div>
                      <span>Velocidade: {fence.speedLimit} km/h</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">
                      {fence.latitude.toFixed(4)}, {fence.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fence.notifyOnEnter ? (
                      <Bell className="h-3 w-3 text-green-500" />
                    ) : (
                      <BellOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs">Entrada</span>
                    {fence.notifyOnExit ? (
                      <Bell className="h-3 w-3 text-green-500" />
                    ) : (
                      <BellOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs">Saída</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleShowOnMap(fence)}
                  title="Mostrar no mapa"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(fence.id)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingFenceId(fence.id)}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de criar/editar */}
      <VirtualFenceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        equipmentId={equipmentId}
        fenceId={editingFenceId}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingFenceId} onOpenChange={(open) => !open && setDeletingFenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cerca Virtual?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A cerca virtual será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFence.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

