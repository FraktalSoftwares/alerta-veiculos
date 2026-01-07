import { ClientSearch } from "./ClientSearch";
import { ClientFilterButton } from "./ClientFilterButton";
import { ClientNewButton } from "./ClientNewButton";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface ClientPageHeaderProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onNewClientClick: () => void;
  hasFilters?: boolean;
}

export function ClientPageHeader({
  title,
  searchValue,
  onSearchChange,
  onFilterClick,
  onNewClientClick,
  hasFilters = false,
}: ClientPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <ClientSearch value={searchValue} onChange={onSearchChange} />
        <ClientFilterButton onClick={onFilterClick} hasFilters={hasFilters} />
        <RequirePermission code={PERMISSIONS.CLIENTS_CREATE}>
          <ClientNewButton onClick={onNewClientClick} />
        </RequirePermission>
      </div>
    </div>
  );
}
