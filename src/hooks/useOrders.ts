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
  equipmentTransferred: number;
  totalAmount: number;
  asaasPaymentId?: string;
}

export function useCreateOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData): Promise<OrderResult> => {
      const [expiryMonth, expiryYear] = data.paymentData.expiryDate.split('/');

      const { data: result, error } = await supabase.functions.invoke('process-order', {
        body: {
          items: data.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
          shippingAddress: data.shippingAddress,
          paymentData: {
            creditCard: {
              holderName: data.paymentData.cardHolder,
              number: data.paymentData.cardNumber.replace(/\s/g, ''),
              expiryMonth: expiryMonth,
              expiryYear: `20${expiryYear}`,
              ccv: data.paymentData.cvv,
            },
            creditCardHolderInfo: {
              name: data.paymentData.cardHolder,
              cpfCnpj: data.paymentData.cpfCnpj.replace(/\D/g, ''),
              phone: data.paymentData.phone.replace(/\D/g, ''),
              email: '',
              postalCode: data.shippingAddress.cep.replace(/\D/g, ''),
              addressNumber: data.shippingAddress.number,
              addressComplement: data.shippingAddress.complement || undefined,
            },
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
        description: `${result.equipmentTransferred} equipamento(s) adicionado(s) ao seu estoque.`,
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
            products (title, brand, model, image_url, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
