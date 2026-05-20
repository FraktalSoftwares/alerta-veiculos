import { ProductDisplay } from "@/types/product";
import gpsTrackerImage from "@/assets/gps-tracker.png";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface StoreTableRowProps {
  product: ProductDisplay;
  onClick?: (product: ProductDisplay) => void;
  onEdit?: (product: ProductDisplay) => void;
  onDelete?: (product: ProductDisplay) => void;
}

export function StoreTableRow({ product, onClick, onEdit, onDelete }: StoreTableRowProps) {
  const imageUrl = product.image || gpsTrackerImage;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(product);
  };

  return (
    <>
      {/* Mobile compact card */}
      <div
        onClick={() => onClick?.(product)}
        className="md:hidden flex items-center gap-3 px-3 py-2.5 border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
      >
        <div className="w-14 h-12 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-1"
            onError={(e) => { e.currentTarget.src = gpsTrackerImage; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-foreground font-bold text-sm truncate">{product.title}</span>
            <span className="text-xs font-medium text-foreground shrink-0">Qtd: {product.quantity}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {[product.brand, product.model].filter(Boolean).join(' / ') || '-'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {[product.vehicleType, product.frequency].filter(Boolean).join(' · ') || '-'}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {/* Desktop grid row */}
      <div
        onClick={() => onClick?.(product)}
        className="hidden md:grid grid-cols-[1fr_140px_100px_100px_120px_100px_80px] gap-4 px-6 py-4 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors items-center"
      >
      <div className="flex items-center gap-4">
        <div className="w-16 h-12 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.src = gpsTrackerImage;
            }}
          />
        </div>
        <span className="text-foreground font-medium truncate">{product.title}</span>
      </div>
      <div className="text-muted-foreground">{product.vehicleType || "-"}</div>
      <div className="text-foreground">{product.frequency || "-"}</div>
      <div className="text-foreground">{product.model || "-"}</div>
      <div className="text-foreground">{product.brand || "-"}</div>
      <div className="text-foreground text-right font-medium">{product.quantity}</div>
      <div className="flex items-center justify-end gap-1">
        <RequirePermission code={PERMISSIONS.STORE_EDIT}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </RequirePermission>
        <RequirePermission code={PERMISSIONS.STORE_DELETE}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </RequirePermission>
      </div>
      </div>
    </>
  );
}
