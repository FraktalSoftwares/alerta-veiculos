import { cn } from "@/lib/utils";

type FinanceBadgeVariant = "vencido" | "pago" | "pendente" | "cancelado";

interface FinanceBadgeProps {
  variant: FinanceBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<FinanceBadgeVariant, string> = {
  vencido: "bg-red-500 text-white",
  pago: "bg-success text-success-foreground",
  pendente: "bg-warning text-warning-foreground",
  cancelado: "bg-gray-500 text-white",
};

export function FinanceBadge({ variant, children, className }: FinanceBadgeProps) {
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
