import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EquipmentDisplay } from "@/types/equipment";

interface EquipmentMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentDisplay | null;
}

export function EquipmentMapModal({ isOpen, onClose, equipment }: EquipmentMapModalProps) {
  const imei = equipment?.imei && equipment.imei !== "-" ? equipment.imei : null;
  const protocolo = equipment?.model && equipment.model !== "-" ? equipment.model : null;

  const iframeUrl =
    imei && protocolo
      ? `https://fraktalsistemas.com.br:8004/mapa/${encodeURIComponent(imei)}?protocolo=${encodeURIComponent(protocolo)}`
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            Localização do Rastreador
            {equipment?.imei && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                IMEI: {equipment.imei}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full h-[70vh] bg-muted">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              title="Mapa do Rastreador"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-2 font-semibold">Mapa não disponível</p>
                <p className="text-sm text-muted-foreground">
                  {!imei
                    ? "O equipamento precisa ter um IMEI configurado."
                    : "O equipamento precisa ter um modelo/protocolo configurado."}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
