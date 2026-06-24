-- =============================================
-- FASE 1.2 / 1.3 — Decoders server-side + triggers + backfill
--
-- J16  : protocolo GT06 binário (campo `row` em hex). Decodifica aqui.
-- 8310 : protocolo Suntech STT (texto) — colunas latitude/longitude já
--        vêm corretas; apenas normalizamos para `positions`.
-- 310  : sem dados ainda (estrutura igual ao 8310 quando existir).
--
-- Validação: lógica idêntica à PoC provada (60/60 localizacao batendo com
-- o gabarito + auto-correção de hemisfério pela bounding box do Brasil).
-- =============================================

-- Faixa plausível Brasil (com folga). Usada para validar e auto-corrigir sinal.
CREATE OR REPLACE FUNCTION public.in_brazil(_lat DOUBLE PRECISION, _lng DOUBLE PRECISION)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
  SELECT _lat IS NOT NULL AND _lng IS NOT NULL
     AND _lat BETWEEN -34 AND 6 AND _lng BETWEEN -74 AND -34;
$$;

-- ---------------------------------------------
-- Decoder J16 / GT06. Retorna 0 linhas para pacotes sem bloco GPS
-- (heartbeat 0x13, login 0x01 etc.) — assim eles são naturalmente ignorados.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.decode_j16_row(p_hex TEXT)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION, rec TIMESTAMPTZ,
              spd INTEGER, hdg INTEGER, sats INTEGER, valid BOOLEAN)
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  b BYTEA;
  n INT;
  proto INT;
  yy INT; mm INT; dd INT; hh INT; mi INT; ss INT;
  latraw BIGINT; lngraw BIGINT;
  cs INT; satb INT; speed INT;
  la DOUBLE PRECISION; lo DOUBLE PRECISION;
BEGIN
  IF p_hex IS NULL THEN RETURN; END IF;
  BEGIN
    b := decode(p_hex, 'hex');
  EXCEPTION WHEN OTHERS THEN
    RETURN;  -- hex inválido
  END;
  n := length(b);
  IF n < 22 THEN RETURN; END IF;
  IF get_byte(b,0) <> 120 OR get_byte(b,1) <> 120 THEN RETURN; END IF;  -- start 0x78 0x78
  proto := get_byte(b,3);
  IF proto NOT IN (18, 22, 34, 38) THEN RETURN; END IF;  -- 0x12,0x16,0x22,0x26 (têm GPS)

  yy := get_byte(b,4); mm := get_byte(b,5); dd := get_byte(b,6);
  hh := get_byte(b,7); mi := get_byte(b,8); ss := get_byte(b,9);
  satb   := get_byte(b,10);
  latraw := get_byte(b,11)::BIGINT * 16777216 + get_byte(b,12) * 65536 + get_byte(b,13) * 256 + get_byte(b,14);
  lngraw := get_byte(b,15)::BIGINT * 16777216 + get_byte(b,16) * 65536 + get_byte(b,17) * 256 + get_byte(b,18);
  speed  := get_byte(b,19);
  cs     := get_byte(b,20) * 256 + get_byte(b,21);

  la := latraw::DOUBLE PRECISION / 1800000.0;
  lo := lngraw::DOUBLE PRECISION / 1800000.0;
  IF (cs & 4096) <> 0 THEN la := -la; END IF;  -- bit12 -> Sul
  IF (cs & 2048) <> 0 THEN lo := -lo; END IF;  -- bit11 -> Oeste

  -- auto-correção: se cair fora do Brasil mas o espelho cair dentro, corrige o sinal
  IF NOT public.in_brazil(la, lo) AND public.in_brazil(-la, lo) THEN la := -la; END IF;
  IF NOT public.in_brazil(la, lo) AND public.in_brazil(la, -lo) THEN lo := -lo; END IF;

  -- horário do equipamento é UTC (validado contra created_at do 8310)
  BEGIN
    rec := make_timestamptz(2000 + yy, mm, dd, hh, mi, ss, 'UTC');
  EXCEPTION WHEN OTHERS THEN
    rec := NULL;
  END;

  lat := la; lng := lo;
  spd := speed; hdg := (cs & 1023); sats := (satb & 15);
  valid := public.in_brazil(la, lo);
  RETURN NEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN;  -- qualquer pacote malformado é ignorado
END;
$$;

-- ---------------------------------------------
-- Trigger J16: AFTER INSERT em pacotes_rastreador_j16 -> positions
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_positions_from_j16()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d RECORD;
  v_vehicle UUID;
BEGIN
  SELECT * INTO d FROM public.decode_j16_row(NEW.row);
  IF NOT FOUND THEN
    RETURN NEW;  -- sem GPS (heartbeat etc.) -> não cria posição
  END IF;

  SELECT vehicle_id INTO v_vehicle FROM public.equipment WHERE imei = NEW.identificador LIMIT 1;

  INSERT INTO public.positions
    (vehicle_id, imei, modelo, source_table, source_id, latitude, longitude,
     speed, heading, satellites, ignition, recorded_at, valid, raw)
  VALUES
    (v_vehicle, NEW.identificador, 'j16', 'pacotes_rastreador_j16', NEW.id,
     d.lat, d.lng, d.spd, d.hdg, d.sats,
     (NEW.ignicao ~ '^\s*[1-9]'), d.rec, d.valid, NEW.row)
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_positions_j16 ON public.pacotes_rastreador_j16;
CREATE TRIGGER trg_positions_j16
  AFTER INSERT ON public.pacotes_rastreador_j16
  FOR EACH ROW EXECUTE FUNCTION public.tg_positions_from_j16();

-- ---------------------------------------------
-- Trigger 8310 (Suntech STT): colunas já numéricas e corretas
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_positions_from_8310()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_vehicle UUID;
  la DOUBLE PRECISION;
  lo DOUBLE PRECISION;
  v_rec TIMESTAMPTZ;
BEGIN
  la := NULLIF(NEW.latitude, '')::DOUBLE PRECISION;
  lo := NULLIF(NEW.longitude, '')::DOUBLE PRECISION;
  IF la IS NULL OR lo IS NULL THEN
    RETURN NEW;  -- pacote sem posição
  END IF;

  SELECT vehicle_id INTO v_vehicle FROM public.equipment WHERE imei = NEW.identificador LIMIT 1;

  BEGIN
    v_rec := (NEW.date || ' ' || NEW.time)::TIMESTAMP AT TIME ZONE 'UTC';
  EXCEPTION WHEN OTHERS THEN
    v_rec := NULL;
  END;

  INSERT INTO public.positions
    (vehicle_id, imei, modelo, source_table, source_id, latitude, longitude,
     speed, heading, satellites, ignition, recorded_at, valid, raw)
  VALUES
    (v_vehicle, NEW.identificador, '8310', 'pacotes_rastreador_8310', NEW.id,
     la, lo,
     NULLIF(NEW.speed, '')::DOUBLE PRECISION,
     NULLIF(NEW.crs, '')::DOUBLE PRECISION,
     NULLIF(NEW.satellites, '')::INTEGER,
     (NEW.ignicao ~ '^\s*[1-9]'),
     v_rec, public.in_brazil(la, lo), NEW.row)
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_positions_8310 ON public.pacotes_rastreador_8310;
CREATE TRIGGER trg_positions_8310
  AFTER INSERT ON public.pacotes_rastreador_8310
  FOR EACH ROW EXECUTE FUNCTION public.tg_positions_from_8310();

-- =============================================
-- BACKFILL — reprocessa o histórico já salvo (idempotente)
-- =============================================

-- J16: o LATERAL com a função SRF descarta automaticamente pacotes sem GPS
INSERT INTO public.positions
  (vehicle_id, imei, modelo, source_table, source_id, latitude, longitude,
   speed, heading, satellites, ignition, recorded_at, valid, raw)
SELECT e.vehicle_id, p.identificador, 'j16', 'pacotes_rastreador_j16', p.id,
       d.lat, d.lng, d.spd, d.hdg, d.sats,
       (p.ignicao ~ '^\s*[1-9]'), d.rec, d.valid, p.row
FROM public.pacotes_rastreador_j16 p
LEFT JOIN public.equipment e ON e.imei = p.identificador
CROSS JOIN LATERAL public.decode_j16_row(p.row) d
ON CONFLICT (source_table, source_id) DO NOTHING;

-- 8310
INSERT INTO public.positions
  (vehicle_id, imei, modelo, source_table, source_id, latitude, longitude,
   speed, heading, satellites, ignition, recorded_at, valid, raw)
SELECT e.vehicle_id, p.identificador, '8310', 'pacotes_rastreador_8310', p.id,
       NULLIF(p.latitude,'')::DOUBLE PRECISION, NULLIF(p.longitude,'')::DOUBLE PRECISION,
       NULLIF(p.speed,'')::DOUBLE PRECISION, NULLIF(p.crs,'')::DOUBLE PRECISION,
       NULLIF(p.satellites,'')::INTEGER, (p.ignicao ~ '^\s*[1-9]'),
       (p.date || ' ' || p.time)::TIMESTAMP AT TIME ZONE 'UTC',
       public.in_brazil(NULLIF(p.latitude,'')::DOUBLE PRECISION, NULLIF(p.longitude,'')::DOUBLE PRECISION),
       p.row
FROM public.pacotes_rastreador_8310 p
LEFT JOIN public.equipment e ON e.imei = p.identificador
WHERE NULLIF(p.latitude,'') IS NOT NULL AND NULLIF(p.longitude,'') IS NOT NULL
ON CONFLICT (source_table, source_id) DO NOTHING;
