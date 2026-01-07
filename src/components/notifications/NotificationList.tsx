import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationItem } from "./NotificationItem";
import { NotificationDisplay } from "@/types/notification";
import { Loader2 } from "lucide-react";

interface NotificationListProps {
  notifications: NotificationDisplay[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isDeletingId?: string | null;
}

export function NotificationList({
  notifications,
  searchValue,
  onSearchChange,
  onDelete,
  isLoading,
  isDeletingId,
}: NotificationListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading text-foreground">Notificações Enviadas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border w-56"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Nenhuma notificação encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDelete={onDelete}
              isDeleting={isDeletingId === notification.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
