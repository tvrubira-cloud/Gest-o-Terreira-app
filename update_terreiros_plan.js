import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseAnonKey = 'sb_publishable_k-Idrm23pw0TYPtE-J79jg_n7ko8Nvx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAndFix() {
  try {
    const { data: terreiros, error } = await supabase.from('terreiros').select('id, name, plan, plan_status, plan_updated_at');
    if (error) throw error;

    console.log('=== SITUAÇÃO ATUAL DOS TERREIROS ===');
    console.table(terreiros);

    // Check if any terreiro still has old plan values
    const invalid = terreiros.filter(t => !['trial', 'ile', 'axe', 'orun'].includes(t.plan));
    if (invalid.length > 0) {
      console.log(`\n⚠️  ${invalid.length} terreiro(s) com planos inválidos. Corrigindo...`);
      for (const t of invalid) {
        const newPlan = t.plan === 'free' ? 'trial' : t.plan === 'pro' ? 'axe' : 'trial';
        await supabase.from('terreiros').update({ plan: newPlan, plan_status: 'active', plan_updated_at: new Date().toISOString() }).eq('id', t.id);
        console.log(`  ✅ ${t.name}: ${t.plan} -> ${newPlan}`);
      }
    } else {
      console.log('\n✅ Todos os planos estão válidos!');
    }

    // Fix null plan_status or plan_updated_at
    const missing = terreiros.filter(t => !t.plan_status || !t.plan_updated_at);
    if (missing.length > 0) {
      console.log(`\n⚠️  ${missing.length} terreiro(s) com dados incompletos. Corrigindo...`);
      for (const t of missing) {
        await supabase.from('terreiros').update({
          plan_status: t.plan_status || 'active',
          plan_updated_at: t.plan_updated_at || new Date().toISOString(),
        }).eq('id', t.id);
        console.log(`  ✅ ${t.name} corrigido`);
      }
    }

    console.log('\n=== VERIFICAÇÃO FINAL ===');
    const { data: final } = await supabase.from('terreiros').select('id, name, plan, plan_status, plan_updated_at');
    console.table(final);

  } catch (err) {
    console.error('Fatal:', err);
  }
}

verifyAndFix();
