import { StoreTableHeader } from "./StoreTableHeader";
import { StoreTableRow } from "./StoreTableRow";
import { ProductDisplay } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreTableProps {
  products: ProductDisplay[];
  onProductClick?: (product: ProductDisplay) => void;
  onEditProduct?: (product: ProductDisplay) => void;
  onDeleteProduct?: (product: ProductDisplay) => void;
  isLoading?: boolean;
}

export function StoreTable({ products, onProductClick, onEditProduct, onDeleteProduct, isLoading }: StoreTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <StoreTableHeader />
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <StoreTableHeader />
        <div className="px-6 py-12 text-center text-muted-foreground">
          Nenhum produto encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <StoreTableHeader />
      <div className="divide-y divide-border">
        {products.map((product) => (
          <StoreTableRow
            key={product.id}
            product={product}
            onClick={onProductClick}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        ))}
      </div>
    </div>
  );
}
