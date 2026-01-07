import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  variant?: "warning" | "danger";
  className?: string;
}

export function NotificationBadge({ count, variant = "danger", className }: NotificationBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1",
        variant === "danger" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
