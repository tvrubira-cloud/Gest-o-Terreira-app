const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CredentialsPayload {
  email: string;
  nomeCompleto: string;
  nomeTerreiro: string;
  cpf: string;
  senha: string;
  loginUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY nao configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const from = Deno.env.get('EMAIL_FROM') || 'ORUNAPP <onboarding@resend.dev>';
    const appLoginUrl = Deno.env.get('APP_LOGIN_URL');
    const payload: CredentialsPayload = await req.json();
    const loginUrl = payload.loginUrl || appLoginUrl || 'https://app.orunapp.com.br/login';

    if (!payload.email || !payload.cpf || !payload.senha) {
      return new Response(JSON.stringify({ error: 'email, cpf e senha sao obrigatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = 'Suas credenciais de acesso ao ORUNAPP';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;line-height:1.6">
        <h1 style="color:#0A4A4D">Seu acesso ao ORUNAPP foi criado</h1>
        <p>Ola, ${payload.nomeCompleto || 'responsavel'}.</p>
        <p>O cadastro do terreiro <strong>${payload.nomeTerreiro || 'informado'}</strong> foi finalizado.</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Login CPF:</strong> ${payload.cpf}</p>
          <p style="margin:0"><strong>Senha:</strong> ${payload.senha}</p>
        </div>
        <p>
          <a href="${loginUrl}" style="display:inline-block;background:#0A4A4D;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">
            Acessar o aplicativo
          </a>
        </p>
        <p style="font-size:13px;color:#6b7280">Por seguranca, guarde estes dados em local protegido.</p>
      </div>
    `;

    const text = [
      'Seu acesso ao ORUNAPP foi criado.',
      `Terreiro: ${payload.nomeTerreiro || 'informado'}`,
      `Login CPF: ${payload.cpf}`,
      `Senha: ${payload.senha}`,
      `Acesse: ${loginUrl}`,
    ].join('\n');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.email,
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
