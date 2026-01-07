import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface StockPageHeaderProps {
  title: string;
  onNewClick: () => void;
}

export function StockPageHeader({ title, onNewClick }: StockPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
      <RequirePermission code={PERMISSIONS.STOCK_CREATE}>
        <Button onClick={onNewClick} className="bg-foreground text-background hover:bg-foreground/90 gap-2">
          <Plus className="h-4 w-4" />
          Novo equipamento
        </Button>
      </RequirePermission>
    </div>
  );
}
