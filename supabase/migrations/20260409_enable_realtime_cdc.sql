-- ============================================================
-- Habilita Realtime e prepara replicação lógica para CDC
-- Execute: SQL Editor → New Query → Run
-- ============================================================

-- 1. Habilitar Realtime nas tabelas (seguro: só adiciona se não estiver)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['terreiros','users','events','broadcasts','charges','bank_accounts']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;

-- 2. REPLICA IDENTITY FULL (necessário para old_record em UPDATE/DELETE)
ALTER TABLE terreiros     REPLICA IDENTITY FULL;
ALTER TABLE users         REPLICA IDENTITY FULL;
ALTER TABLE events        REPLICA IDENTITY FULL;
ALTER TABLE broadcasts    REPLICA IDENTITY FULL;
ALTER TABLE charges       REPLICA IDENTITY FULL;
ALTER TABLE bank_accounts REPLICA IDENTITY FULL;

-- 3. Tabela de auditoria local
CREATE TABLE IF NOT EXISTS cdc_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL CHECK (event_type IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  payload     JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cdc_audit_log_table_idx       ON cdc_audit_log (table_name);
CREATE INDEX IF NOT EXISTS cdc_audit_log_occurred_at_idx ON cdc_audit_log (occurred_at DESC);

ALTER TABLE cdc_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cdc_audit_log' AND policyname = 'Allow all for cdc_audit_log'
  ) THEN
    CREATE POLICY "Allow all for cdc_audit_log" ON cdc_audit_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Função trigger de auditoria
CREATE OR REPLACE FUNCTION fn_cdc_log_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  _record_id TEXT;
  _payload   JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::TEXT;
    _payload   := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::TEXT;
    _payload   := jsonb_build_object('new', to_jsonb(NEW), 'old', to_jsonb(OLD));
  ELSE
    _record_id := NEW.id::TEXT;
    _payload   := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO cdc_audit_log (event_type, table_name, record_id, payload)
  VALUES (TG_OP, TG_TABLE_NAME, _record_id, _payload);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Aplica triggers (DROP IF EXISTS + CREATE garante idempotência)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['terreiros','users','events','broadcasts','charges','bank_accounts']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_cdc_%1$s ON %1$s;
       CREATE TRIGGER trg_cdc_%1$s
         AFTER INSERT OR UPDATE OR DELETE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION fn_cdc_log_change();',
      t
    );
  END LOOP;
END $$;
