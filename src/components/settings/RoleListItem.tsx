import { ChevronRight } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { cn } from "@/lib/utils";
import { AdminRoleDisplay } from "@/types/settings";

interface RoleListItemProps {
  role: AdminRoleDisplay;
  isSelected: boolean;
  onClick: (role: AdminRoleDisplay) => void;
}

export function RoleListItem({ role, isSelected, onClick }: RoleListItemProps) {
  return (
    <button
      onClick={() => onClick(role)}
      className={cn(
        "w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors text-left",
        isSelected && "bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <RoleBadge variant={role.isActive ? "ativo" : "inativo"} />
        <span className="text-sm font-medium text-foreground">{role.name}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
