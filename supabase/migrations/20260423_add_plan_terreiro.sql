-- =============================================
-- Migration: Adicionar campos de plano ao terreiro
-- Data: 2026-04-23
-- Execute em: Supabase → SQL Editor → New Query
-- =============================================

-- Adiciona campo `plan` com valor padrão 'free'
ALTER TABLE terreiros
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro'));

-- Adiciona campo `plan_expires_at` (NULL = sem expiração / free)
ALTER TABLE terreiros
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Adiciona campo `created_by` para vincular terreiro ao usuário criador
-- (usado pelo webhook para localizar o terreiro a partir do email)
ALTER TABLE terreiros
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT NULL;

-- Índice para busca rápida pelo criador
CREATE INDEX IF NOT EXISTS terreiros_created_by_idx ON terreiros (created_by);
CREATE INDEX IF NOT EXISTS terreiros_plan_idx       ON terreiros (plan);

-- =============================================
-- Verificação: rode após aplicar para confirmar
-- =============================================
-- SELECT id, name, plan, plan_expires_at, created_by FROM terreiros LIMIT 10;
