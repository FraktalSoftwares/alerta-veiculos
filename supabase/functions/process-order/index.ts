import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== Asaas Client (inline) ==========
class AsaasClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { apiKey: string; environment: 'production' | 'sandbox' }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.environment === 'production'
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.errors?.[0]?.description ||
        result.message ||
        `Asaas API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  async createCustomer(data: any): Promise<any> {
    return this.request('POST', '/customers', data);
  }

  async createPayment(data: any): Promise<any> {
    return this.request('POST', '/payments', data);
  }
}

// ========== Interfaces ==========
interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
}

interface RequestBody {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentData: {
    creditCard: CreditCardData;
    creditCardHolderInfo: CreditCardHolderInfo;
  };
}

// ========== Stock Reservation ==========
const RESERVATION_TTL_MINUTES = 15;

async function reserveStock(
  supabase: any,
  items: OrderItem[],
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  for (const item of items) {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, title, stock_quantity')
      .eq('id', item.productId)
      .single();

    if (error || !product) {
      return { success: false, error: `Produto não encontrado: ${item.productId}` };
    }

    if (product.stock_quantity < item.quantity) {
      return {
        success: false,
        error: `Estoque insuficiente para ${product.title}. Disponível: ${product.stock_quantity}`,
      };
    }

    // Decrement stock immediately as reservation
    const { error: stockError } = await supabase.rpc('decrement_stock', {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });

    if (stockError) {
      // Fallback: manual decrement
      const { data: current } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.productId)
        .single();

      if (current) {
        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, current.stock_quantity - item.quantity) })
          .eq('id', item.productId);
      }
    }
  }

  // Save reservation metadata on the order
  await supabase
    .from('orders')
    .update({
      notes: `RESERVATION_EXPIRES:${new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000).toISOString()}`,
    })
    .eq('id', orderId);

  return { success: true };
}

async function releaseStock(supabase: any, items: OrderItem[]): Promise<void> {
  for (const item of items) {
    const { data: current } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.productId)
      .single();

    if (current) {
      await supabase
        .from('products')
        .update({ stock_quantity: current.stock_quantity + item.quantity })
        .eq('id', item.productId);
    }
  }
}

// ========== Main Handler ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Profile check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['associacao', 'franqueado'].includes(profile.user_type)) {
      return new Response(
        JSON.stringify({ error: 'Apenas Associação e Franqueado podem realizar compras' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { items, shippingAddress, paymentData } = body;

    console.log('Processing order for user:', user.id, 'Items:', items.length);

    // Validate items exist and are active
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, stock_quantity, is_active')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Produto não encontrado: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!product.is_active) {
        return new Response(
          JSON.stringify({ error: `Produto indisponível: ${product.title}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Estoque insuficiente para ${product.title}. Disponível: ${product.stock_quantity}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Create order (pending)
    const addressText = `${shippingAddress.street}, ${shippingAddress.number}${shippingAddress.complement ? `, ${shippingAddress.complement}` : ''}, ${shippingAddress.neighborhood}, ${shippingAddress.city}-${shippingAddress.state}, CEP: ${shippingAddress.cep}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        notes: `Entrega: ${addressText}`,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao adicionar itens ao pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reserve stock
    const reservation = await reserveStock(supabase, items, order.id);
    if (!reservation.success) {
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: reservation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== Asaas Payment Integration ==========
    // Fetch Asaas configuration
    const { data: asaasConfig } = await supabase
      .from('asaas_configuration')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const apiKey = Deno.env.get(asaasConfig?.secret_name || 'ASAAS_API_KEY');

    let paymentSuccess = false;
    let asaasPaymentId: string | null = null;

    if (asaasConfig && apiKey) {
      const asaasClient = new AsaasClient({
        apiKey,
        environment: asaasConfig.environment as 'production' | 'sandbox',
      });

      // Ensure buyer has an Asaas customer ID
      // Check if profile has linked client record with asaas_customer_id
      let asaasCustomerId: string | null = null;

      const { data: clientRecord } = await supabase
        .from('clients')
        .select('id, asaas_customer_id, document_number, phone')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (clientRecord?.asaas_customer_id) {
        asaasCustomerId = clientRecord.asaas_customer_id;
      } else {
        // Create customer in Asaas
        try {
          const customerData: any = {
            name: profile.full_name || paymentData.creditCard.holderName,
            email: profile.email || user.email || '',
          };
          if (clientRecord?.document_number) {
            customerData.cpfCnpj = clientRecord.document_number.replace(/\D/g, '');
          }
          if (clientRecord?.phone) {
            customerData.phone = clientRecord.phone.replace(/\D/g, '');
          }
          if (paymentData.creditCardHolderInfo?.cpfCnpj) {
            customerData.cpfCnpj = paymentData.creditCardHolderInfo.cpfCnpj.replace(/\D/g, '');
          }

          const asaasCustomer = await asaasClient.createCustomer(customerData);
          asaasCustomerId = asaasCustomer.id;

          // Save customer ID
          if (clientRecord) {
            await supabase
              .from('clients')
              .update({ asaas_customer_id: asaasCustomerId })
              .eq('id', clientRecord.id);
          }
        } catch (error) {
          console.error('Error creating Asaas customer:', error);
          // Release stock and rollback
          await releaseStock(supabase, items);
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
          return new Response(
            JSON.stringify({ error: `Erro ao criar cliente no gateway de pagamento: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create payment in Asaas
      try {
        const asaasPaymentData: any = {
          customer: asaasCustomerId,
          billingType: 'CREDIT_CARD',
          value: totalAmount,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Pedido #${order.id.substring(0, 8)} - Loja Alerta Veículos`,
          externalReference: order.id,
          creditCard: {
            holderName: paymentData.creditCard.holderName,
            number: paymentData.creditCard.number.replace(/\s/g, ''),
            expiryMonth: paymentData.creditCard.expiryMonth,
            expiryYear: paymentData.creditCard.expiryYear,
            ccv: paymentData.creditCard.ccv,
          },
          creditCardHolderInfo: {
            name: paymentData.creditCardHolderInfo.name || paymentData.creditCard.holderName,
            email: paymentData.creditCardHolderInfo.email || profile.email || user.email || '',
            cpfCnpj: paymentData.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ''),
            postalCode: shippingAddress.cep.replace(/\D/g, ''),
            addressNumber: shippingAddress.number,
            addressComplement: shippingAddress.complement || undefined,
            phone: paymentData.creditCardHolderInfo.phone?.replace(/\D/g, '') || undefined,
          },
        };

        const asaasPayment = await asaasClient.createPayment(asaasPaymentData);
        asaasPaymentId = asaasPayment.id;

        // CONFIRMED or RECEIVED means immediate approval for credit card
        paymentSuccess = ['CONFIRMED', 'RECEIVED', 'PENDING'].includes(asaasPayment.status);

        console.log('Asaas payment created:', asaasPaymentId, 'Status:', asaasPayment.status);
      } catch (error) {
        console.error('Asaas payment error:', error);
        // Release stock and mark order as failed
        await releaseStock(supabase, items);
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
        return new Response(
          JSON.stringify({ error: `Pagamento recusado: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // No Asaas config - simulate payment (development/fallback)
      console.warn('Asaas not configured. Simulating payment success.');
      paymentSuccess = true;
    }

    if (!paymentSuccess) {
      await releaseStock(supabase, items);
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Pagamento recusado. Verifique os dados do cartão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - transfer existing equipment or create new ones
    let equipmentTransferred = 0;

    for (const item of items) {
      // First, try to find existing equipment linked to this product with status 'in_store'
      const { data: existingEquipment } = await supabase
        .from('equipment')
        .select('id')
        .eq('product_id', item.productId)
        .eq('status', 'in_store')
        .limit(item.quantity);

      const transferCount = existingEquipment?.length || 0;

      // Transfer existing equipment to the buyer
      if (existingEquipment && existingEquipment.length > 0) {
        const equipmentIds = existingEquipment.map((e: any) => e.id);
        const { error: transferError } = await supabase
          .from('equipment')
          .update({
            owner_id: user.id,
            status: 'available',
          })
          .in('id', equipmentIds);

        if (!transferError) {
          equipmentTransferred += transferCount;
          console.log(`Transferred ${transferCount} existing equipment for product ${item.productId}`);
        } else {
          console.error('Equipment transfer error:', transferError);
        }
      }

      // If not enough existing equipment, create new ones for the remainder
      const remaining = item.quantity - transferCount;
      if (remaining > 0) {
        const { data: product } = await supabase
          .from('products')
          .select('id, title, model, brand')
          .eq('id', item.productId)
          .single();

        for (let i = 0; i < remaining; i++) {
          const serialNumber = `${product?.title?.substring(0, 3).toUpperCase() || 'EQP'}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          const { error: equipmentError } = await supabase.from('equipment').insert({
            owner_id: user.id,
            product_id: item.productId,
            serial_number: serialNumber,
            status: 'available',
          });

          if (!equipmentError) {
            equipmentTransferred++;
          } else {
            console.error('Equipment creation error:', equipmentError);
          }
        }
      }
    }

    // Update order to completed with payment info
    const orderNotes = `Entrega: ${addressText}${asaasPaymentId ? ` | Pagamento Asaas: ${asaasPaymentId}` : ''}`;
    await supabase
      .from('orders')
      .update({
        status: 'approved',
        notes: orderNotes,
      })
      .eq('id', order.id);

    console.log('Order completed. Equipment created:', equipmentTransferred);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        equipmentTransferred,
        totalAmount,
        asaasPaymentId,
        message: 'Pedido processado com sucesso!',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process order error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar pedido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
