-- Comando para corrigir erro de RLS no upload de fotos
-- Execute este script no SQL Editor do seu painel Supabase

-- 1. Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Garantir que o bucket é público
UPDATE storage.buckets SET public = true WHERE id = 'imagens';

-- 3. Habilitar RLS em storage.objects (normalmente já vem habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Limpar políticas antigas (opcional, para evitar duplicatas se você já tentou antes)
DROP POLICY IF EXISTS "Allow public upload to imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from imagens" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from imagens" ON storage.objects;

-- 5. Criar políticas para permitir acesso público ao bucket 'imagens'
CREATE POLICY "Allow public upload to imagens"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'imagens');

CREATE POLICY "Allow public update to imagens"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'imagens');

CREATE POLICY "Allow public select from imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imagens');

CREATE POLICY "Allow public delete from imagens"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'imagens');
