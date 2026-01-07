import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface FinancePageHeaderProps {
  title: string;
  onNewClick: () => void;
  newButtonLabel: string;
  createPermission?: string;
}

export function FinancePageHeader({ 
  title, 
  onNewClick, 
  newButtonLabel,
  createPermission = PERMISSIONS.FINANCE_REVENUE,
}: FinancePageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
      <RequirePermission code={createPermission}>
        <Button onClick={onNewClick} className="bg-foreground text-background hover:bg-foreground/90 gap-2">
          <Plus className="h-4 w-4" />
          {newButtonLabel}
        </Button>
      </RequirePermission>
    </div>
  );
}
