import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: terreiros } = await supabase.from('terreiros').select('id, name');
    console.log('--- RELATÓRIO DE MEMBROS ---');
    
    for (const t of terreiros || []) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('terreiro_id', t.id);
      
      console.log(`- Casa: "${t.name}" | ID: ${t.id} | Membros: ${count}`);
    }

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

check();
