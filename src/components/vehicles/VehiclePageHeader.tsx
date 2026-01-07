import { VehicleSearch } from "./VehicleSearch";
import { VehicleFilterButton } from "./VehicleFilterButton";
import { VehicleNewButton } from "./VehicleNewButton";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface VehiclePageHeaderProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onNewVehicleClick: () => void;
  hasFilters?: boolean;
}

export function VehiclePageHeader({
  title,
  searchValue,
  onSearchChange,
  onFilterClick,
  onNewVehicleClick,
  hasFilters = false,
}: VehiclePageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <VehicleSearch value={searchValue} onChange={onSearchChange} />
        <VehicleFilterButton onClick={onFilterClick} hasFilters={hasFilters} />
        <RequirePermission code={PERMISSIONS.VEHICLES_CREATE}>
          <VehicleNewButton onClick={onNewVehicleClick} />
        </RequirePermission>
      </div>
    </div>
  );
}
