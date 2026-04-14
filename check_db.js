import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: terreiros } = await supabase.from('terreiros').select('*');
    const { data: masters } = await supabase.from('users').select('*').eq('is_master', true);
    const { data: panelAdmins } = await supabase.from('users').select('*').eq('is_panel_admin', true);

    console.log('--- TODOS OS TERREIROS ---');
    console.log(JSON.stringify(terreiros, null, 2));
    
    console.log('\n--- USUÁRIOS MASTER ---');
    masters?.forEach(m => console.log(`- ${m.nomeCompleto} (${m.role}) | Casa ID: ${m.terreiro_id}`));
    
    console.log('\n--- USUÁRIOS PANEL ADMIN ---');
    panelAdmins?.forEach(p => console.log(`- ${p.nomeCompleto} (${p.role}) | Casa ID: ${p.terreiro_id}`));

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

check();
