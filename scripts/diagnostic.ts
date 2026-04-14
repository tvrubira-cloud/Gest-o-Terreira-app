import { supabase } from '../src/lib/supabase';

async function checkTerreiroData() {
  console.log('--- RELATÓRIO DE DIAGNÓSTICO DE DADOS ---');
  
  // 1. Listar Terreiros
  const { data: terreiros } = await supabase.from('terreiros').select('id, name');
  console.log('\nTerreiros encontrados:', terreiros?.length);
  terreiros?.forEach(t => console.log(`- ID: ${t.id} | Nome: ${t.name}`));

  // 2. Contar Usuários por Terreiro
  for (const t of terreiros || []) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('terreiro_id', t.id);
    console.log(`\nCasa: ${t.name}`);
    console.log(`- Total de Membros: ${count}`);

    // 3. Contar Cobranças por Terreiro
    const { count: countCharges } = await supabase
      .from('charges')
      .select('*', { count: 'exact', head: true })
      .eq('terreiro_id', t.id);
    console.log(`- Total de Cobranças: ${countCharges}`);
  }
}

// To run this, we would need a proper environment, but I can use this logic to explain.
