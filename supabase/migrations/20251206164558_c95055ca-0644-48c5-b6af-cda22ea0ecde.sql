-- =============================================
-- ETAPA 1: ESTRUTURA COMPLETA DO BANCO DE DADOS
-- Sistema Alerta Rastreamento
-- =============================================

-- =============================================
-- PARTE 1: ENUMS E TIPOS CUSTOMIZADOS
-- =============================================

-- Tipos de usuário do sistema (hierarquia)
CREATE TYPE public.user_type AS ENUM ('admin', 'associacao', 'franqueado', 'frotista', 'motorista');

-- Roles administrativas para permissões granulares
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'operator', 'viewer');

-- Status de veículos
CREATE TYPE public.vehicle_status AS ENUM ('active', 'inactive', 'blocked', 'maintenance', 'no_signal');

-- Status de equipamentos
CREATE TYPE public.equipment_status AS ENUM ('available', 'installed', 'maintenance', 'defective');

-- Status de pedidos
CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'shipped', 'delivered', 'cancelled');

-- Tipo financeiro
CREATE TYPE public.finance_type AS ENUM ('revenue', 'expense');

-- Status financeiro
CREATE TYPE public.finance_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- =============================================
-- PARTE 2: TABELAS CORE
-- =============================================

-- Tabela de Perfis (extensão do auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
    document_number TEXT,
    user_type user_type NOT NULL DEFAULT 'motorista',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    parent_user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Roles (SEPARADA para segurança - evita privilege escalation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Tabela de Clientes (hierárquica)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    parent_client_id UUID REFERENCES public.clients(id),
    name TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
    document_number TEXT,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    client_type user_type NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Endereços
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    zip_code TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contatos secundários
CREATE TABLE public.secondary_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações de cobrança
CREATE TABLE public.billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
    payment_method TEXT,
    auto_billing BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customização white-label
CREATE TABLE public.client_customization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    custom_domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTE 3: MÓDULO DE VEÍCULOS
-- =============================================

-- Veículos
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    plate TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    color TEXT,
    vehicle_type TEXT,
    chassis TEXT,
    renavam TEXT,
    status vehicle_status DEFAULT 'active',
    last_location JSONB,
    last_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de rastreamento
CREATE TABLE public.vehicle_tracking_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2),
    heading INTEGER,
    ignition BOOLEAN,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de histórico
CREATE INDEX idx_vehicle_tracking_vehicle_id ON public.vehicle_tracking_data(vehicle_id);
CREATE INDEX idx_vehicle_tracking_recorded_at ON public.vehicle_tracking_data(recorded_at DESC);

-- Alertas de veículos
CREATE TABLE public.vehicle_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_alerts_vehicle_id ON public.vehicle_alerts(vehicle_id);
CREATE INDEX idx_vehicle_alerts_is_read ON public.vehicle_alerts(is_read);

-- =============================================
-- PARTE 4: MÓDULO LOJA/ESTOQUE
-- =============================================

-- Produtos (APENAS Admin pode CRUD)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    vehicle_type TEXT,
    frequency TEXT,
    brand TEXT,
    model TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipamentos (rastreadores)
CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id),
    serial_number TEXT UNIQUE NOT NULL,
    imei TEXT,
    chip_number TEXT,
    chip_operator TEXT,
    status equipment_status DEFAULT 'available',
    vehicle_id UUID REFERENCES public.vehicles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_owner ON public.equipment(owner_id);
CREATE INDEX idx_equipment_status ON public.equipment(status);

-- Pedidos
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTE 5: MÓDULO FINANCEIRO
-- =============================================

CREATE TABLE public.finance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    type finance_type NOT NULL,
    category TEXT,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    payment_date DATE,
    status finance_status DEFAULT 'pending',
    payment_method TEXT,
    reference_month DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finance_owner ON public.finance_records(owner_id);
CREATE INDEX idx_finance_type ON public.finance_records(type);
CREATE INDEX idx_finance_status ON public.finance_records(status);

-- =============================================
-- PARTE 6: MÓDULO NOTIFICAÇÕES
-- =============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT,
    target_type TEXT CHECK (target_type IN ('all', 'user_type', 'specific')),
    target_user_type user_type,
    target_user_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (notification_id, user_id)
);

-- =============================================
-- PARTE 7: MÓDULO CONFIGURAÇÕES
-- =============================================

-- Funções administrativas
CREATE TABLE public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissões do sistema
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT
);

-- Relacionamento role-permissão
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    UNIQUE (admin_role_id, permission_id)
);

-- Atribuição de roles administrativas a usuários
CREATE TABLE public.user_admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    admin_role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, admin_role_id)
);

-- =============================================
-- PARTE 8: FUNÇÕES DE SEGURANÇA
-- =============================================

-- Função para verificar role (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter tipo de usuário
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id UUID)
RETURNS user_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE id = _user_id
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND user_type = 'admin'
  )
$$;

-- =============================================
-- PARTE 9: TRIGGERS
-- =============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::user_type, 'motorista')
  );
  RETURN NEW;
END;
$$;

-- Aplicar trigger de criação de perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aplicar triggers de updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_records_updated_at BEFORE UPDATE ON finance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_settings_updated_at BEFORE UPDATE ON billing_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_customization_updated_at BEFORE UPDATE ON client_customization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PARTE 10: HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondary_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_admin_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 11: POLÍTICAS RLS
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES (apenas admins gerenciam)
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- CLIENTS
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all clients" ON clients FOR ALL USING (public.is_admin(auth.uid()));

-- ADDRESSES
CREATE POLICY "Users can manage addresses of own clients" ON addresses FOR ALL 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = addresses.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all addresses" ON addresses FOR ALL USING (public.is_admin(auth.uid()));

-- SECONDARY_CONTACTS
CREATE POLICY "Users can manage contacts of own clients" ON secondary_contacts FOR ALL 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = secondary_contacts.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all contacts" ON secondary_contacts FOR ALL USING (public.is_admin(auth.uid()));

-- BILLING_SETTINGS
CREATE POLICY "Users can manage billing of own clients" ON billing_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = billing_settings.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all billing" ON billing_settings FOR ALL USING (public.is_admin(auth.uid()));

-- CLIENT_CUSTOMIZATION
CREATE POLICY "Users can manage customization of own clients" ON client_customization FOR ALL 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_customization.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all customization" ON client_customization FOR ALL USING (public.is_admin(auth.uid()));

-- VEHICLES
CREATE POLICY "Users can view vehicles of own clients" ON vehicles FOR SELECT 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = vehicles.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Users can insert vehicles for own clients" ON vehicles FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = vehicles.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Users can update vehicles of own clients" ON vehicles FOR UPDATE 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = vehicles.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Users can delete vehicles of own clients" ON vehicles FOR DELETE 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = vehicles.client_id AND clients.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all vehicles" ON vehicles FOR ALL USING (public.is_admin(auth.uid()));

-- VEHICLE_TRACKING_DATA
CREATE POLICY "Users can view tracking of own vehicles" ON vehicle_tracking_data FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM vehicles v 
  JOIN clients c ON c.id = v.client_id 
  WHERE v.id = vehicle_tracking_data.vehicle_id AND c.owner_id = auth.uid()
));
CREATE POLICY "System can insert tracking data" ON vehicle_tracking_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all tracking" ON vehicle_tracking_data FOR SELECT USING (public.is_admin(auth.uid()));

-- VEHICLE_ALERTS
CREATE POLICY "Users can view alerts of own vehicles" ON vehicle_alerts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM vehicles v 
  JOIN clients c ON c.id = v.client_id 
  WHERE v.id = vehicle_alerts.vehicle_id AND c.owner_id = auth.uid()
));
CREATE POLICY "Users can update alerts of own vehicles" ON vehicle_alerts FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM vehicles v 
  JOIN clients c ON c.id = v.client_id 
  WHERE v.id = vehicle_alerts.vehicle_id AND c.owner_id = auth.uid()
));
CREATE POLICY "Admins can manage all alerts" ON vehicle_alerts FOR ALL USING (public.is_admin(auth.uid()));

-- PRODUCTS (somente Admin gerencia, todos podem ver ativos)
CREATE POLICY "Everyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Only admins can insert products" ON products FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Only admins can update products" ON products FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Only admins can delete products" ON products FOR DELETE USING (public.is_admin(auth.uid()));

-- EQUIPMENT
CREATE POLICY "Users can view own equipment" ON equipment FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own equipment" ON equipment FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own equipment" ON equipment FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own equipment" ON equipment FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all equipment" ON equipment FOR ALL USING (public.is_admin(auth.uid()));

-- ORDERS
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (buyer_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (public.is_admin(auth.uid()));

-- ORDER_ITEMS
CREATE POLICY "Users can view items of own orders" ON order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY "Users can insert items in own orders" ON order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (public.is_admin(auth.uid()));

-- FINANCE_RECORDS
CREATE POLICY "Users can view own finance" ON finance_records FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own finance" ON finance_records FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own finance" ON finance_records FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own finance" ON finance_records FOR DELETE USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage all finance" ON finance_records FOR ALL USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view notifications for them" ON notifications FOR SELECT USING (
    target_type = 'all' OR
    (target_type = 'user_type' AND target_user_type = public.get_user_type(auth.uid())) OR
    (target_type = 'specific' AND auth.uid() = ANY(target_user_ids)) OR
    sender_id = auth.uid()
);
CREATE POLICY "Authorized users can create notifications" ON notifications FOR INSERT WITH CHECK (
    public.get_user_type(auth.uid()) IN ('admin', 'associacao', 'franqueado')
);
CREATE POLICY "Admins can manage all notifications" ON notifications FOR ALL USING (public.is_admin(auth.uid()));

-- NOTIFICATION_READS
CREATE POLICY "Users can manage own notification reads" ON notification_reads FOR ALL USING (user_id = auth.uid());

-- ADMIN_ROLES (somente admins)
CREATE POLICY "Authenticated can view admin roles" ON admin_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage admin roles" ON admin_roles FOR ALL USING (public.is_admin(auth.uid()));

-- PERMISSIONS (somente leitura para autenticados)
CREATE POLICY "Authenticated can view permissions" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage permissions" ON permissions FOR ALL USING (public.is_admin(auth.uid()));

-- ROLE_PERMISSIONS
CREATE POLICY "Authenticated can view role permissions" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage role permissions" ON role_permissions FOR ALL USING (public.is_admin(auth.uid()));

-- USER_ADMIN_ROLES
CREATE POLICY "Users can view own admin roles" ON user_admin_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Only admins can manage user admin roles" ON user_admin_roles FOR ALL USING (public.is_admin(auth.uid()));

-- =============================================
-- PARTE 12: DADOS INICIAIS (SEED)
-- =============================================

-- Permissões base do sistema
INSERT INTO public.permissions (code, name, module, description) VALUES
('clients.view', 'Visualizar Clientes', 'clients', 'Permite visualizar lista de clientes'),
('clients.create', 'Criar Clientes', 'clients', 'Permite criar novos clientes'),
('clients.edit', 'Editar Clientes', 'clients', 'Permite editar clientes existentes'),
('clients.delete', 'Excluir Clientes', 'clients', 'Permite excluir clientes'),
('vehicles.view', 'Visualizar Veículos', 'vehicles', 'Permite visualizar veículos'),
('vehicles.create', 'Criar Veículos', 'vehicles', 'Permite criar novos veículos'),
('vehicles.edit', 'Editar Veículos', 'vehicles', 'Permite editar veículos'),
('vehicles.delete', 'Excluir Veículos', 'vehicles', 'Permite excluir veículos'),
('vehicles.block', 'Bloquear Veículos', 'vehicles', 'Permite bloquear/desbloquear veículos'),
('finance.view', 'Visualizar Financeiro', 'finance', 'Permite visualizar registros financeiros'),
('finance.create', 'Criar Lançamentos', 'finance', 'Permite criar lançamentos financeiros'),
('finance.edit', 'Editar Lançamentos', 'finance', 'Permite editar lançamentos'),
('finance.delete', 'Excluir Lançamentos', 'finance', 'Permite excluir lançamentos'),
('stock.view', 'Visualizar Estoque', 'stock', 'Permite visualizar estoque'),
('stock.manage', 'Gerenciar Estoque', 'stock', 'Permite gerenciar equipamentos'),
('store.view', 'Visualizar Loja', 'store', 'Permite visualizar produtos'),
('store.buy', 'Comprar na Loja', 'store', 'Permite fazer pedidos'),
('store.manage', 'Gerenciar Loja', 'store', 'Permite gerenciar produtos (Admin)'),
('notifications.view', 'Visualizar Notificações', 'notifications', 'Permite visualizar notificações'),
('notifications.send', 'Enviar Notificações', 'notifications', 'Permite enviar notificações'),
('settings.view', 'Visualizar Configurações', 'settings', 'Permite visualizar configurações'),
('settings.manage', 'Gerenciar Configurações', 'settings', 'Permite alterar configurações'),
('users.view', 'Visualizar Usuários', 'users', 'Permite visualizar usuários'),
('users.manage', 'Gerenciar Usuários', 'users', 'Permite gerenciar usuários');