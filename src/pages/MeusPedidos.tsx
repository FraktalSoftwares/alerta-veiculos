import { Header } from "@/components/layout/Header";
import { useOrders } from "@/hooks/useOrders";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingBag, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregue", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  completed: { label: "Concluído", variant: "default" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractAddress(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Entrega:\s*(.+?)(?:\s*\||$)/);
  return match ? match[1].trim() : null;
}

function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;
  const address = extractAddress(order.notes);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                Pedido #{order.id.substring(0, 8)}
              </span>
              <Badge variant={status.variant} className="text-[10px] h-5">
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">
            {formatCurrency(order.total_amount)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Itens do Pedido
            </h4>
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50">
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products?.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.products?.title || "Produto"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.products?.brand} {item.products?.model && `- ${item.products.model}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">
                    {item.quantity}x {formatCurrency(item.unit_price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Address */}
          {address && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-foreground">{address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 border-t border-border/50 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const MeusPedidos = () => {
  const { data: orders = [], isLoading } = useOrders();

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Pedidos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe o histórico de compras realizadas na loja
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground">Nenhum pedido ainda</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Seus pedidos realizados na loja aparecerão aqui.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/loja">Ir para a Loja</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeusPedidos;
