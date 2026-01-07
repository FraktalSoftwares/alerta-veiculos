import { LucideIcon } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";
import { cn } from "@/lib/utils";

interface HeaderIconProps {
  icon: LucideIcon;
  notification?: {
    count: number;
    variant?: "warning" | "danger";
  };
  onClick?: () => void;
  className?: string;
}

export function HeaderIcon({ icon: Icon, notification, onClick, className }: HeaderIconProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-full hover:bg-background/20 transition-colors",
        className
      )}
    >
      <Icon className="h-5 w-5 text-background" />
      {notification && notification.count > 0 && (
        <NotificationBadge count={notification.count} variant={notification.variant} />
      )}
    </button>
  );
}
