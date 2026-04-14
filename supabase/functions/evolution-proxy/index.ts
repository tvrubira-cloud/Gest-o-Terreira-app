// supabase/functions/evolution-proxy/index.ts
// Proxy para Evolution API — resolve CORS do navegador
//
// Deploy:
//   supabase functions deploy evolution-proxy --project-ref xbutdadniizewcwqmvuy

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-evolution-url, x-evolution-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionUrl = req.headers.get('x-evolution-url');
    const evolutionKey = req.headers.get('x-evolution-key');

    if (!evolutionUrl || !evolutionKey) {
      return new Response(JSON.stringify({ error: 'x-evolution-url e x-evolution-key são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/evolution-proxy', '');
    const targetUrl = `${evolutionUrl.replace(/\/$/, '')}${path}${url.search}`;

    const body = req.method !== 'GET' && req.method !== 'DELETE' ? await req.text() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
