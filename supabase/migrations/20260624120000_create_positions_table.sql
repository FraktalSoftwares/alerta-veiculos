-- =============================================
-- FASE 1.1 — Tabela unificada `positions`
--
-- Centraliza as posições decodificadas de TODOS os modelos de rastreador
-- (j16 / 8310 / 310) numa estrutura única, limpa e validada. O front passa
-- a ler daqui (sem o "null -> 0" e sem heartbeats sem GPS).
--
-- Origem dos dados: triggers nas tabelas pacotes_rastreador_* decodificam
-- o pacote e inserem aqui (ver migration 20260624120100).
-- =============================================

CREATE TABLE IF NOT EXISTS public.positions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id    UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  imei          TEXT NOT NULL,
  modelo        TEXT,
  source_table  TEXT NOT NULL,           -- de qual pacotes_rastreador_* veio
  source_id     BIGINT NOT NULL,         -- id do registro de origem
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  speed         DOUBLE PRECISION,
  heading       DOUBLE PRECISION,
  satellites    INTEGER,
  ignition      BOOLEAN,
  recorded_at   TIMESTAMPTZ,             -- horário do pacote (do equipamento)
  valid         BOOLEAN NOT NULL DEFAULT FALSE,  -- coordenada dentro de faixa plausível
  raw           TEXT,                    -- pacote bruto (auditoria/re-decode)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- evita duplicar a mesma origem (idempotente p/ backfill e reprocesso)
  UNIQUE (source_table, source_id)
);

-- Última posição por veículo (rastreio ao vivo) e por IMEI
CREATE INDEX IF NOT EXISTS idx_positions_vehicle_recorded
  ON public.positions (vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_imei_recorded
  ON public.positions (imei, recorded_at DESC);
-- Histórico só de pontos válidos
CREATE INDEX IF NOT EXISTS idx_positions_vehicle_valid_recorded
  ON public.positions (vehicle_id, recorded_at DESC) WHERE valid;

-- =============================================
-- RLS — herda exatamente a visibilidade de `vehicles`.
-- O EXISTS abaixo respeita a RLS de vehicles (hierarquia + motorista),
-- então quem enxerga o veículo enxerga suas posições. Sem reimplementar regra.
-- =============================================
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "positions visible if vehicle visible" ON public.positions;
CREATE POLICY "positions visible if vehicle visible"
  ON public.positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = positions.vehicle_id)
  );

-- INSERT/UPDATE são feitos pelos triggers (definer) e pelo service_role,
-- ambos contornam RLS — nenhuma policy de escrita para usuários comuns.

-- =============================================
-- Realtime — habilita push de novas posições (usado na Fase 2)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'positions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
  END IF;
END $$;
