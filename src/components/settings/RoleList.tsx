import { RoleListItem } from "./RoleListItem";
import { AdminRoleDisplay } from "@/types/settings";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleListProps {
  roles: AdminRoleDisplay[];
  selectedRole: AdminRoleDisplay | null;
  onRoleSelect: (role: AdminRoleDisplay) => void;
  isLoading?: boolean;
}

export function RoleList({ roles, selectedRole, onRoleSelect, isLoading }: RoleListProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-border">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        Nenhuma função administrativa cadastrada
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {roles.map((role) => (
        <RoleListItem
          key={role.id}
          role={role}
          isSelected={selectedRole?.id === role.id}
          onClick={onRoleSelect}
        />
      ))}
    </div>
  );
}
