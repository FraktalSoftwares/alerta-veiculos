import { StoreSearch } from "./StoreSearch";
import { StoreNewButton } from "./StoreNewButton";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface StorePageHeaderProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewProductClick?: () => void;
  showNewButton?: boolean;
}

export function StorePageHeader({
  title,
  searchValue,
  onSearchChange,
  onNewProductClick,
  showNewButton = true,
}: StorePageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <StoreSearch value={searchValue} onChange={onSearchChange} />
        {showNewButton && onNewProductClick && (
          <RequirePermission code={PERMISSIONS.STORE_CREATE}>
            <StoreNewButton onClick={onNewProductClick} />
          </RequirePermission>
        )}
      </div>
    </div>
  );
}
