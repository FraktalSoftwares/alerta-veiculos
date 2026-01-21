import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { UserWithRole } from "@/hooks/useSettings";
import { AdminRoleDisplay } from "@/types/settings";

interface UserRoleListProps {
  users: UserWithRole[];
  roles: AdminRoleDisplay[];
  isLoading: boolean;
  onAssignRole: (userId: string, roleId: string) => void;
  onRemoveRole: (userId: string) => void;
}

export function UserRoleList({
  users,
  roles,
  isLoading,
  onAssignRole,
  onRemoveRole,
}: UserRoleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-4 w-32 sm:w-48" />
                <Skeleton className="h-3 w-40 sm:w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8 bg-card border border-border rounded-xl">
        <p className="text-muted-foreground text-sm sm:text-base">Nenhum usuário encontrado</p>
      </div>
    );
  }

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      associacao: "Associação",
      franqueado: "Franqueado",
      frotista: "Frotista",
      motorista: "Motorista",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-card border border-border rounded-xl hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-foreground truncate">{user.full_name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {getUserTypeLabel(user.user_type)}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground truncate block">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Select
              value={user.admin_role_id || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onRemoveRole(user.id);
                } else {
                  onAssignRole(user.id, value);
                }
              }}
            >
              <SelectTrigger className="w-full min-w-0 sm:w-48 h-10">
                <SelectValue placeholder="Selecionar função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem função</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {user.admin_role_id && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveRole(user.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 min-h-[40px] min-w-[40px]"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
