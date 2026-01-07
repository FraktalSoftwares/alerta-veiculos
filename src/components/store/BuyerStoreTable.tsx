import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDisplay } from '@/types/product';
import { useCart } from './CartContext';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface BuyerStoreTableProps {
  products: ProductDisplay[];
  isLoading?: boolean;
}

export function BuyerStoreTable({ products, isLoading }: BuyerStoreTableProps) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <Skeleton className="aspect-square w-full rounded-lg mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground text-lg">Nenhum produto disponível no momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {products.map((product) => {
        const cartQuantity = getCartQuantity(product.id);
        const isOutOfStock = product.quantity <= 0;
        const maxReached = cartQuantity >= product.quantity;

        return (
          <div
            key={product.id}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200"
          >
            <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden relative">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground/50">
                  <ShoppingCart className="h-8 w-8 mb-1" />
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
              {cartQuantity > 0 && (
                <Badge className="absolute top-2 right-2 bg-primary">
                  {cartQuantity}x
                </Badge>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Badge variant="destructive">Esgotado</Badge>
                </div>
              )}
            </div>

            <div className="p-3 space-y-2">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{product.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {product.brand} {product.model && `• ${product.model}`}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {!isOutOfStock && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {product.quantity} disp.
                  </span>
                )}
              </div>

              {cartQuantity === 0 ? (
                <Button
                  className="w-full h-8 text-xs"
                  onClick={() => addToCart(product, 1)}
                  disabled={isOutOfStock}
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (cartQuantity === 1) {
                        removeFromCart(product.id);
                      } else {
                        updateQuantity(product.id, cartQuantity - 1);
                      }
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="flex-1 text-center text-sm font-medium">
                    {cartQuantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => addToCart(product, 1)}
                    disabled={maxReached}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
