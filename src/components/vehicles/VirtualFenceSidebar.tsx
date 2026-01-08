import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VirtualFenceList } from "./VirtualFenceList";
import { VirtualFenceModal } from "./VirtualFenceModal";
import { VirtualFenceDisplay } from "@/types/virtualFence";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualFenceSidebarProps {
  equipmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onFenceSelect?: (fence: VirtualFenceDisplay) => void;
  onLocationSelect?: () => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export function VirtualFenceSidebar({
  equipmentId,
  isOpen,
  onClose,
  onFenceSelect,
  onLocationSelect,
  selectedLocation,
}: VirtualFenceSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFenceId, setEditingFenceId] = useState<string | null>(null);

  // Abre modal quando location é selecionada
  useEffect(() => {
    if (selectedLocation && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [selectedLocation, isModalOpen]);

  const handleFenceSelect = (fence: VirtualFenceDisplay) => {
    onFenceSelect?.(fence);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingFenceId(null);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Cercas Virtuais</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="mt-6">
            <VirtualFenceList
              equipmentId={equipmentId}
              onFenceSelect={handleFenceSelect}
            />
          </div>
        </SheetContent>
      </Sheet>

      <VirtualFenceModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        equipmentId={equipmentId}
        fenceId={editingFenceId}
        onLocationSelect={onLocationSelect}
        initialLocation={selectedLocation}
      />
    </>
  );
}
