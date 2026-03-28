-- =============================================
-- Terreiro App — Supabase Database Schema
-- Execute este SQL no painel do Supabase:
-- SQL Editor → New Query → Colar → Run
-- =============================================

-- 1. Terreiros
CREATE TABLE IF NOT EXISTS terreiros (
  id TEXT PRIMARY KEY DEFAULT ('terreiro-' || gen_random_uuid()::text),
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  admin_id TEXT,
  master_id TEXT,
  pix_key TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('user-' || gen_random_uuid()::text),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  is_master BOOLEAN DEFAULT false,
  is_panel_admin BOOLEAN DEFAULT false,
  cpf TEXT NOT NULL,
  password TEXT,
  palavra_chave TEXT,
  nome_completo TEXT NOT NULL,
  nome_de_santo TEXT DEFAULT '',
  data_nascimento TEXT DEFAULT '',
  rg TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  profissao TEXT DEFAULT '',
  nome_pais TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  spiritual JSONB DEFAULT '{}'::jsonb,
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT ('evt-' || gen_random_uuid()::text),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Charges
CREATE TABLE IF NOT EXISTS charges (
  id TEXT PRIMARY KEY DEFAULT ('charge-' || gen_random_uuid()::text),
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Mensalidade', 'Colaboração', 'Evento', 'Outros')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date TEXT DEFAULT '',
  assigned_to JSONB DEFAULT '[]'::jsonb,
  paid_by JSONB DEFAULT '[]'::jsonb,
  notified_by JSONB DEFAULT '[]'::jsonb,
  target_type TEXT CHECK (target_type IN ('USER', 'SYSTEM')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY DEFAULT ('bank-' || gen_random_uuid()::text),
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  agency TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  account_type TEXT DEFAULT 'Corrente' CHECK (account_type IN ('Corrente', 'Poupança')),
  pix_key TEXT DEFAULT '',
  owner_name TEXT DEFAULT '',
  owner_document TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security (RLS) — desabilitado para
-- permitir acesso com anon key por enquanto
-- =============================================
ALTER TABLE terreiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total via anon key)
CREATE POLICY "Allow all for terreiros" ON terreiros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for charges" ON charges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for bank_accounts" ON bank_accounts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Seed: Master Admin + Terreiro inicial
-- =============================================
INSERT INTO terreiros (id, name, logo_url, endereco, admin_id)
VALUES ('terreiro-001', 'master terreira', '', '', 'user-admin-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, role, is_master, cpf, password, nome_completo, nome_de_santo, data_nascimento, rg, endereco, telefone, email, profissao, spiritual, terreiro_id)
VALUES (
  'user-admin-001',
  'ADMIN',
  true,
  'master',
  '30542020',
  'Guaraci Rubira',
  'Oxala Master',
  '1980-01-01',
  '0000000',
  '',
  '',
  '',
  '',
  '{"tempoUmbanda":"","religiaoAnterior":"","orixaFrente":"","orixaAdjunto":"","tipoMedium":"","chefeCoroa":"","orixas":[],"entidades":[],"paiDeSantoAnterior":"","dataEntrada":"","historicoObrigacoes":""}'::jsonb,
  'terreiro-001'
)
ON CONFLICT (id) DO NOTHING;
