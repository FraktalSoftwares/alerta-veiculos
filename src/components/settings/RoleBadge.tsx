import { cn } from "@/lib/utils";

type RoleBadgeVariant = "ativo" | "inativo";

interface RoleBadgeProps {
  variant: RoleBadgeVariant;
  className?: string;
}

const variantStyles: Record<RoleBadgeVariant, string> = {
  ativo: "bg-success text-success-foreground",
  inativo: "bg-muted text-muted-foreground",
};

export function RoleBadge({ variant, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {variant === "ativo" ? "ATIVO" : "INATIVO"}
    </span>
  );
}
