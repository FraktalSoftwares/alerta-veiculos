import { cn } from "@/lib/utils";

type VehicleBadgeVariant =
  | "rastreando"
  | "parado"
  | "desligado"
  | "sem-sinal"
  | "bloqueado";

interface VehicleBadgeProps {
  variant: VehicleBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<VehicleBadgeVariant, string> = {
  rastreando: "bg-success text-success-foreground",
  parado: "bg-warning text-warning-foreground",
  desligado: "bg-gray-600 text-white",
  "sem-sinal": "bg-destructive text-destructive-foreground",
  bloqueado: "bg-slate-800 text-white",
};

export function VehicleBadge({ variant, children, className }: VehicleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
