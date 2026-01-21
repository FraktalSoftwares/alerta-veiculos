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
    <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">{title}</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
