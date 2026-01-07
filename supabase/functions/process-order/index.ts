import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface PaymentInfo {
  cardLastFour: string;
  cardHolder: string;
}

interface RequestBody {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentData: PaymentInfo;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user token to get user info
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile to check type
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only associacao and franqueado can purchase
    if (!['associacao', 'franqueado'].includes(profile.user_type)) {
      return new Response(
        JSON.stringify({ error: 'Apenas Associação e Franqueado podem realizar compras' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { items, shippingAddress, paymentData } = body;

    console.log('Processing order for user:', user.id, 'Items:', items.length);

    // Validate items and check stock
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
            error: `Estoque insuficiente para ${product.title}. Disponível: ${product.stock_quantity}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        notes: `Entrega: ${shippingAddress.street}, ${shippingAddress.number}, ${shippingAddress.neighborhood}, ${shippingAddress.city}-${shippingAddress.state}, CEP: ${shippingAddress.cep}`,
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

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao adicionar itens ao pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate payment processing (always succeeds for demo)
    console.log('Processing payment for card ending:', paymentData.cardLastFour);
    
    // In production, integrate with Stripe or other payment gateway here
    const paymentSuccess = true;

    if (!paymentSuccess) {
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ error: 'Pagamento recusado. Verifique os dados do cartão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment successful - update stock and create equipment
    let equipmentCreated = 0;

    for (const item of items) {
      // Get product info for equipment
      const { data: product } = await supabase
        .from('products')
        .select('id, title, model, brand')
        .eq('id', item.productId)
        .single();

      // Decrement stock
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity
      });

      // If RPC doesn't exist, do it manually
      if (stockError) {
        console.log('Using manual stock update');
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();

        if (currentProduct) {
          await supabase
            .from('products')
            .update({ stock_quantity: currentProduct.stock_quantity - item.quantity })
            .eq('id', item.productId);
        }
      }

      // Create equipment entries for each unit purchased
      for (let i = 0; i < item.quantity; i++) {
        const serialNumber = `${product?.title?.substring(0, 3).toUpperCase() || 'EQP'}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { error: equipmentError } = await supabase
          .from('equipment')
          .insert({
            owner_id: user.id,
            product_id: item.productId,
            serial_number: serialNumber,
            status: 'available',
          });

        if (!equipmentError) {
          equipmentCreated++;
        } else {
          console.error('Equipment creation error:', equipmentError);
        }
      }
    }

    // Update order status to completed
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id);

    console.log('Order completed. Equipment created:', equipmentCreated);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        equipmentCreated,
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
