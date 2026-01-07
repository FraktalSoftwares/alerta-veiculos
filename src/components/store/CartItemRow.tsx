import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import { formatCurrency } from '@/lib/formatters';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;
  const subtotal = product.price * quantity;

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
      {/* Product Image */}
      <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground">Sem img</span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="font-medium text-sm leading-tight">{product.title}</p>
          <p className="text-xs text-muted-foreground">
            {product.brand} {product.model && `• ${product.model}`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-background rounded-lg border border-border/50 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              disabled={quantity >= product.quantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-semibold text-sm">{formatCurrency(subtotal)}</p>
            {quantity > 1 && (
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(product.price)} cada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 self-start"
        onClick={() => onRemove(product.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
