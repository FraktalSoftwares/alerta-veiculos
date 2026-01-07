import { AlertTriangle } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-primary" />
      </div>
      <span className="text-lg font-bold text-primary-foreground">
        Alerta Rastreamento
      </span>
    </div>
  );
}
