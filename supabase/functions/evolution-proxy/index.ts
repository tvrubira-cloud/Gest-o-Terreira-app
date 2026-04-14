// supabase/functions/evolution-proxy/index.ts
// Proxy para Evolution API — resolve CORS do navegador
// JWT verification desabilitada pois o app usa auth próprio

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
    // Remove qualquer prefixo até evolution-proxy inclusive
    const path = url.pathname.replace(/^.*\/evolution-proxy/, '');
    const targetUrl = `${evolutionUrl.replace(/\/$/, '')}${path}${url.search}`;
    console.log('PATH:', url.pathname, '→', path, '→', targetUrl);

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
