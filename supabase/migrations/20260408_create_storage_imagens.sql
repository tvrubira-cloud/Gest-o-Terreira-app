-- Cria o bucket público para armazenar logos e fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagens',
  'imagens',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (qualquer um pode ver as imagens)
CREATE POLICY IF NOT EXISTS "imagens_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imagens');

-- Upload permitido (anon key do app)
CREATE POLICY IF NOT EXISTS "imagens_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'imagens');

-- Substituição permitida (upsert)
CREATE POLICY IF NOT EXISTS "imagens_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'imagens');

-- Remoção permitida (limpeza futura)
CREATE POLICY IF NOT EXISTS "imagens_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'imagens');
