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
    <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">{title}</h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <VehicleSearch value={searchValue} onChange={onSearchChange} />
        <div className="flex gap-2 sm:gap-3">
          <VehicleFilterButton onClick={onFilterClick} hasFilters={hasFilters} />
          <RequirePermission code={PERMISSIONS.VEHICLES_CREATE}>
            <VehicleNewButton onClick={onNewVehicleClick} />
          </RequirePermission>
        </div>
      </div>
    </div>
  );
}
