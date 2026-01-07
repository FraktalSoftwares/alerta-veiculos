import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDisplay } from "@/types/notification";

interface NotificationItemProps {
  notification: NotificationDisplay;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function NotificationItem({ notification, onDelete, isDeleting }: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{notification.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{notification.date}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex gap-8 mb-4">
            <div>
              <span className="text-sm font-medium text-foreground">Para: </span>
              <span className="text-sm text-muted-foreground">{notification.target}</span>
            </div>
            {notification.notificationType && (
              <div>
                <span className="text-sm font-medium text-foreground">Tipo: </span>
                <span className="text-sm text-muted-foreground">{notification.notificationType}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onDelete(notification.id)}
              disabled={isDeleting}
              className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export type for backwards compatibility
export type { NotificationDisplay as Notification };
