import { AlertTriangle, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SendConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  targetLabel: string;
  isPending: boolean;
}

export function SendConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  targetLabel,
  isPending,
}: SendConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[547px] p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-center text-lg font-semibold">
            Enviar Notificação
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>

          <p className="text-sm text-center text-muted-foreground max-w-[451px] mb-8">
            Será enviada uma notificação para <strong className="text-foreground">{targetLabel}</strong>. 
            Deseja realmente enviar a notificação?
          </p>

          <div className="border-t border-border w-full pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="gap-1 text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isPending}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90"
              >
                <Check className="h-4 w-4" />
                {isPending ? 'Enviando...' : 'Sim, enviar notificação'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
