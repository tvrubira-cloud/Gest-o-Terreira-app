import { createClient } from '@supabase/supabase-js';

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL    || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Read replica: quando configurado, leituras (SELECT) são roteadas
// para a réplica regional mais próxima; escritas vão para o primário.
// Configure VITE_SUPABASE_READ_REPLICA_URL no .env com a URL da réplica
// (ex: Supabase → Settings → Database → Read Replicas).
const readReplicaUrl = import.meta.env.VITE_SUPABASE_READ_REPLICA_URL || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase URL ou Anon Key não configuradas. Verifique as variáveis de ambiente.');
}

// ── Cliente primário (leitura + escrita) ──────────────────────
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    realtime: { params: { eventsPerSecond: 10 } },
    db: { schema: 'public' },
  }
);

// ── Cliente de leitura (read replica ou fallback para primário) ─
// Use `supabaseRead` para queries SELECT em componentes e no store.
// Em produção, aponta para a réplica; em dev, reutiliza o primário.
export const supabaseRead = readReplicaUrl
  ? createClient(readReplicaUrl, supabaseAnonKey || 'placeholder', {
      realtime: { params: { eventsPerSecond: 0 } }, // sem realtime na réplica
      db: { schema: 'public' },
    })
  : supabase;

export const isSupabaseConfigured   = !!supabaseUrl && !!supabaseAnonKey;
export const hasReadReplica         = !!readReplicaUrl;
