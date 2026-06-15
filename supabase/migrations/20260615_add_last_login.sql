-- =============================================
-- Migration: Add last_login_at to users
-- Data: 2026-06-15
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_inactivity_message_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_inactivity_message_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;
