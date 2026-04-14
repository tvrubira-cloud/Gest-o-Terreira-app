
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const tables = ['broadcasts', 'contatos', 'push_tokens', 'users', 'events', 'charges', 'bank_accounts'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table} error: ${error.message}`);
    } else {
      console.log(`✅ Table ${table} exists.`);
    }
  }
}

check();
