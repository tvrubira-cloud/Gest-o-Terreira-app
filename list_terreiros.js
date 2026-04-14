import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: terreiros, error } = await supabase.from('terreiros').select('id, name');
    if (error) throw error;

    console.log('--- LISTA DE TERREIROS ---');
    terreiros.forEach(t => console.log(`- ID: ${t.id} | Nome: ${t.name}`));

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

check();
