-- Adiciona colunas para integração com Evolution API (WhatsApp) na tabela terreiros
ALTER TABLE terreiros
  ADD COLUMN IF NOT EXISTS evolution_api_url   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS evolution_api_key   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS evolution_instance  TEXT DEFAULT '';
