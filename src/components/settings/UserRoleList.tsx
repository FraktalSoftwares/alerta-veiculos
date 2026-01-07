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
          <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
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
          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
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
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{user.full_name}</span>
                <Badge variant="outline" className="text-xs">
                  {getUserTypeLabel(user.user_type)}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <SelectTrigger className="w-48">
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
                className="text-muted-foreground hover:text-destructive"
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
