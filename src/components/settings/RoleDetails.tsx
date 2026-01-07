import { Switch } from "@/components/ui/switch";
import { RoleBadge } from "./RoleBadge";
import { PermissionGroup } from "./PermissionGroup";
import { AdminRoleDisplay, PermissionGroup as PermissionGroupType } from "@/types/settings";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleDetailsProps {
  role: AdminRoleDisplay;
  permissions: PermissionGroupType[];
  isLoading?: boolean;
  onToggleActive: (active: boolean) => void;
  onPermissionChange: (groupName: string, permissionId: string, checked: boolean) => void;
  onSelectAllInGroup: (groupName: string, checked: boolean) => void;
}

export function RoleDetails({
  role,
  permissions,
  isLoading,
  onToggleActive,
  onPermissionChange,
  onSelectAllInGroup,
}: RoleDetailsProps) {
  const totalPermissions = permissions.reduce((acc, group) => acc + group.items.length, 0);
  const selectedPermissions = permissions.reduce(
    (acc, group) => acc + group.items.filter((p) => p.checked).length,
    0
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-heading text-foreground">{role.name}</h2>
        <span className="text-sm text-muted-foreground">
          {selectedPermissions} / {totalPermissions} funções selecionadas
        </span>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Ativar função administrativa</span>
          <RoleBadge variant={role.isActive ? "ativo" : "inativo"} />
        </div>
        <Switch checked={role.isActive} onCheckedChange={onToggleActive} />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Funcionalidades do usuário:</h3>

      <div className="space-y-3 mb-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : permissions.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 border border-border rounded-lg">
            Nenhuma permissão disponível
          </div>
        ) : (
          permissions.map((group, index) => (
            <PermissionGroup
              key={group.groupName}
              title={group.groupName}
              permissions={group.items}
              defaultOpen={index === 0}
              onPermissionChange={(permissionId, checked) =>
                onPermissionChange(group.groupName, permissionId, checked)
              }
              onSelectAll={(checked) => onSelectAllInGroup(group.groupName, checked)}
            />
          ))
        )}
      </div>
    </div>
  );
}
