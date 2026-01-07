import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CartItem, ShippingAddress, PaymentData } from '@/types/cart';

interface CreateOrderData {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentData: PaymentData;
}

interface OrderResult {
  orderId: string;
  equipmentCreated: number;
}

export function useCreateOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData): Promise<OrderResult> => {
      const { data: result, error } = await supabase.functions.invoke('process-order', {
        body: {
          items: data.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
          shippingAddress: data.shippingAddress,
          paymentData: {
            cardLastFour: data.paymentData.cardNumber.slice(-4),
            cardHolder: data.paymentData.cardHolder,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pedido');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (result) => {
      toast({
        title: 'Pedido realizado com sucesso!',
        description: `${result.equipmentCreated} equipamento(s) adicionado(s) ao seu estoque.`,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao processar pedido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (title, brand, model)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
