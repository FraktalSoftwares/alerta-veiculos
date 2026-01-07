import { cn } from "@/lib/utils";

type StockBadgeVariant = "funcionando" | "manutencao" | "inativo" | "defeito" | "na_loja";

interface StockBadgeProps {
  variant: StockBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StockBadgeVariant, string> = {
  funcionando: "bg-success text-success-foreground",
  manutencao: "bg-warning text-warning-foreground",
  inativo: "bg-gray-500 text-white",
  defeito: "bg-destructive text-destructive-foreground",
  na_loja: "bg-primary text-primary-foreground",
};

export function StockBadge({ variant, children, className }: StockBadgeProps) {
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
