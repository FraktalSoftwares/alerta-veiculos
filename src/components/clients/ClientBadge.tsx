import { cn } from "@/lib/utils";

type BadgeVariant = "client" | "associate" | "franchisee" | "fleet" | "driver" | "active" | "inactive";

interface ClientBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  client: "bg-secondary text-foreground border border-border",
  associate: "bg-secondary text-foreground border border-border",
  franchisee: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  fleet: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  driver: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  active: "bg-success text-success-foreground",
  inactive: "bg-destructive/20 text-destructive",
};

export function ClientBadge({ variant, children, className }: ClientBadgeProps) {
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
