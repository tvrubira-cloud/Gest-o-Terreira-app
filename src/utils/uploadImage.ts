import { supabase } from '../lib/supabase';

const BUCKET = 'imagens';

// Comprime o arquivo de imagem usando canvas e retorna um Blob JPEG
function compressToBlob(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Formato de imagem não suportado. Use JPEG, PNG ou WebP.'));
    };

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
      } else {
        if (height > maxHeight) { width = Math.round(width * maxHeight / height); height = maxHeight; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Falha ao comprimir a imagem.')),
        'image/jpeg',
        quality
      );
    };

    img.src = objectUrl;
  });
}

// Faz upload de uma imagem para o Supabase Storage e retorna a URL pública
export async function uploadImage(
  file: File,
  path: string,           // ex: 'logos/terreiro-abc123.jpg'
  maxWidth = 400,
  maxHeight = 400
): Promise<string> {
  const blob = await compressToBlob(file, maxWidth, maxHeight);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      upsert: true,           // substitui se já existir
      contentType: 'image/jpeg',
    });

  if (error) throw new Error(`Erro ao fazer upload: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
