-- =============================================
-- Migration: Garantir colunas de plano nos terreiros
-- Data: 2026-06-01
-- =============================================

DO $$
BEGIN
  -- plan (trial, ile, axe, orun)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan'
  ) THEN
    ALTER TABLE terreiros ADD COLUMN plan TEXT NOT NULL DEFAULT 'trial';
  END IF;

  -- plan_status (trialing, active, past_due, canceled, expired)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan_status'
  ) THEN
    ALTER TABLE terreiros ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'trialing';
  END IF;

  -- plan_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan_expires_at'
  ) THEN
    ALTER TABLE terreiros ADD COLUMN plan_expires_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- plan_updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terreiros' AND column_name = 'plan_updated_at'
  ) THEN
    ALTER TABLE terreiros ADD COLUMN plan_updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Atualiza trial com 21 dias de expiração se estiver NULL
UPDATE terreiros
SET plan_expires_at = now() + INTERVAL '21 days'
WHERE plan = 'trial' AND plan_expires_at IS NULL;

-- Atualiza plan_updated_at se estiver NULL
UPDATE terreiros SET plan_updated_at = now() WHERE plan_updated_at IS NULL;

-- Índices
CREATE INDEX IF NOT EXISTS terreiros_plan_idx ON terreiros (plan);
CREATE INDEX IF NOT EXISTS terreiros_plan_status_idx ON terreiros (plan_status);
