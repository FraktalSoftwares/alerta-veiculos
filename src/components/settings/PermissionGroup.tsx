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
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          isOpen ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"
        )}
      >
        <span className="font-medium">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="text-sm text-foreground">Selecionar todos</span>
            <Checkbox
              checked={allChecked}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
            />
          </div>
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-center justify-between p-4 border-b border-border last:border-b-0"
            >
              <span className="text-sm text-muted-foreground pl-4">{permission.name}</span>
              <Checkbox
                checked={permission.checked}
                onCheckedChange={(checked) => onPermissionChange(permission.id, checked as boolean)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
