-- =============================================
-- Migration: Alinhar planos com landing page
-- Planos reais: trial, ile, axe, orun
-- Data: 2026-05-27
-- =============================================

DO $$
BEGIN
  -- 1. Remove qualquer CHECK constraint existente na coluna plan
  -- (lida com nomes de constraint gerados automaticamente)
  EXECUTE (
    SELECT COALESCE(
      (SELECT 'ALTER TABLE terreiros DROP CONSTRAINT ' || quote_ident(conname)
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'terreiros'
         AND c.contype = 'c'
         AND pg_get_constraintdef(c.oid) LIKE '%plan%'
       LIMIT 1),
      'SELECT 1'
    )
  );

  -- 2. Altera valores existentes: 'free' -> 'trial', 'pro' -> 'axe'
  UPDATE terreiros SET plan = 'trial' WHERE plan = 'free';
  UPDATE terreiros SET plan = 'axe'  WHERE plan = 'pro';

  -- 3. Adiciona a coluna plan_status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan_status'
  ) THEN
    ALTER TABLE terreiros
      ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'trialing';
  END IF;

  -- 4. Adiciona a coluna plan_updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan_updated_at'
  ) THEN
    ALTER TABLE terreiros
      ADD COLUMN plan_updated_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- 5. Define default da coluna plan
  ALTER TABLE terreiros ALTER COLUMN plan SET DEFAULT 'trial';

  -- 6. Atualiza defaults para registros existentes
  UPDATE terreiros SET plan_updated_at = now() WHERE plan_updated_at IS NULL;
  UPDATE terreiros SET plan_status = 'active' WHERE plan_status IS NULL OR plan_status = 'trialing';

  -- 7. Recria índices (drop if exist, then create)
  DROP INDEX IF EXISTS terreiros_plan_status_idx;
  CREATE INDEX IF NOT EXISTS terreiros_plan_status_idx ON terreiros (plan_status);

END $$;
