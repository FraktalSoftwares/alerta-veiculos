import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PermissionDisplay } from "@/types/settings";

interface PermissionGroupProps {
  title: string;
  permissions: PermissionDisplay[];
  defaultOpen?: boolean;
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export function PermissionGroup({
  title,
  permissions,
  defaultOpen = false,
  onPermissionChange,
  onSelectAll,
}: PermissionGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const allChecked = permissions.length > 0 && permissions.every((p) => p.checked);
  const someChecked = permissions.some((p) => p.checked);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-4 text-left transition-colors min-h-[48px]",
          isOpen ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"
        )}
      >
        <span className="font-medium truncate min-w-0">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[70vh] sm:max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-card max-h-[70vh] sm:max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border sticky top-0 bg-card z-[1]">
            <span className="text-sm text-foreground">Selecionar todos</span>
            <Checkbox
              checked={allChecked}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              className="shrink-0"
            />
          </div>
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-border last:border-b-0 min-h-[48px]"
            >
              <span className="text-sm text-muted-foreground pl-0 sm:pl-4 min-w-0 truncate">{permission.name}</span>
              <Checkbox
                checked={permission.checked}
                onCheckedChange={(checked) => onPermissionChange(permission.id, checked as boolean)}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
