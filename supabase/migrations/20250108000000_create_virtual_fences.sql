-- =============================================
-- CERCAS VIRTUAIS
-- =============================================

-- Tabela de cercas virtuais
CREATE TABLE public.virtual_fences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INTEGER NOT NULL CHECK (radius > 0), -- Raio em metros
    speed_limit INTEGER, -- Limite de velocidade em km/h (opcional)
    is_primary BOOLEAN DEFAULT false, -- Se é a cerca principal
    notify_on_enter BOOLEAN DEFAULT true, -- Notificar ao entrar na cerca
    notify_on_exit BOOLEAN DEFAULT true, -- Notificar ao sair da cerca
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que apenas uma cerca seja principal por equipamento
    CONSTRAINT unique_primary_fence_per_equipment UNIQUE (equipment_id, is_primary) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Índices para melhor performance
CREATE INDEX idx_virtual_fences_equipment_id ON public.virtual_fences(equipment_id);
CREATE INDEX idx_virtual_fences_is_primary ON public.virtual_fences(is_primary) WHERE is_primary = true;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_virtual_fences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_virtual_fences_updated_at
    BEFORE UPDATE ON public.virtual_fences
    FOR EACH ROW
    EXECUTE FUNCTION update_virtual_fences_updated_at();

-- Função para garantir apenas uma cerca principal por equipamento
CREATE OR REPLACE FUNCTION ensure_single_primary_fence()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está marcando como principal, desmarca as outras
    IF NEW.is_primary = true THEN
        UPDATE public.virtual_fences
        SET is_primary = false
        WHERE equipment_id = NEW.equipment_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir apenas uma cerca principal
CREATE TRIGGER ensure_single_primary_fence_trigger
    BEFORE INSERT OR UPDATE ON public.virtual_fences
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_fence();

-- Habilitar RLS
ALTER TABLE public.virtual_fences ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver cercas de equipamentos que possuem
CREATE POLICY "Users can view fences of their equipment"
ON public.virtual_fences
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.equipment e
        JOIN public.vehicles v ON v.id = e.vehicle_id
        JOIN public.clients c ON c.id = v.client_id
        WHERE e.id = virtual_fences.equipment_id
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = virtual_fences.equipment_id
        AND e.owner_id = auth.uid()
    )
);

-- Política: Usuários podem criar cercas para seus equipamentos
CREATE POLICY "Users can create fences for their equipment"
ON public.virtual_fences
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.equipment e
        JOIN public.vehicles v ON v.id = e.vehicle_id
        JOIN public.clients c ON c.id = v.client_id
        WHERE e.id = virtual_fences.equipment_id
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = virtual_fences.equipment_id
        AND e.owner_id = auth.uid()
    )
);

-- Política: Usuários podem atualizar cercas de seus equipamentos
CREATE POLICY "Users can update fences of their equipment"
ON public.virtual_fences
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.equipment e
        JOIN public.vehicles v ON v.id = e.vehicle_id
        JOIN public.clients c ON c.id = v.client_id
        WHERE e.id = virtual_fences.equipment_id
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = virtual_fences.equipment_id
        AND e.owner_id = auth.uid()
    )
);

-- Política: Usuários podem deletar cercas de seus equipamentos
CREATE POLICY "Users can delete fences of their equipment"
ON public.virtual_fences
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.equipment e
        JOIN public.vehicles v ON v.id = e.vehicle_id
        JOIN public.clients c ON c.id = v.client_id
        WHERE e.id = virtual_fences.equipment_id
        AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = virtual_fences.equipment_id
        AND e.owner_id = auth.uid()
    )
);

