import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase.from('terreiros').select('*').limit(1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('--- COLUNAS DA TABELA TERREIROS ---');
      console.log(Object.keys(data[0]).join(', '));
      console.log('--- DADOS DA MASTER TERREIRA ---');
      const { data: m } = await supabase.from('terreiros').select('*').eq('id', 'terreiro-001');
      console.log(JSON.stringify(m, null, 2));
    } else {
      console.log('Nenhum terreiro encontrado.');
    }

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

check();
