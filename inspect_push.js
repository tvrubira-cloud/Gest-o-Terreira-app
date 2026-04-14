import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbutdadniizewcwqmvuy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data, error } = await supabase.from('push_tokens').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- PUSH TOKENS ---');
  console.log(JSON.stringify(data, null, 2));
}

inspect();
