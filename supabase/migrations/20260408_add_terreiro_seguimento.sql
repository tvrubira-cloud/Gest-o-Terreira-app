-- Adiciona coluna de seguimento ao terreiro
-- Armazena qual(is) tradição(ões) a casa pratica
ALTER TABLE terreiros
  ADD COLUMN IF NOT EXISTS seguimento JSONB
    DEFAULT '{"umbanda": true, "kimbanda": false, "nacao": false}'::jsonb;
