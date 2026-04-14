import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function audit() {
  try {
    const { data: terreiros } = await supabase.from('terreiros').select('id, name, created_at');
    const { data: users } = await supabase.from('users').select('id, nome_completo, cpf, terreiro_id, is_master');

    console.log('=== TERREIROS ===');
    console.table(terreiros);
    console.log('\n=== USERS ===');
    console.table(users);
    
    // Check for "Ilé de Bará Lodê"
    const ile = terreiros.filter(t => t.name.includes('Bará Lodê'));
    console.log('\n=== "Ilé de Bará Lodê" Matches ===');
    console.table(ile);

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

audit();
