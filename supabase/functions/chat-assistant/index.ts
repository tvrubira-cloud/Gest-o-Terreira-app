import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é o assistente virtual do "Terreiras App", um sistema de gestão para terreiros de Umbanda, Candomblé e religiões de matriz africana.
Seu papel é ajudar os administradores (dirigentes) a usar a plataforma.

A plataforma possui os seguintes menus principais e funcionalidades:
1. Painel (Dashboard): Visão geral, gráficos de caixa e próximos eventos/aniversários.
2. Membros: Cadastro de filhos de santo, com guias para dados Pessoais e Espirituais (Umbanda, Quimbanda, Nação, etc.).
3. Eventos: Calendário de giras, festas e obrigações.
4. Avisos (Mural): Envio de comunicados globais ou notificações push para os membros.
5. Financeiro (Cobranças e Caixa): 
   - Lançar mensalidades ou colaborações.
   - O Fluxo de Caixa registra as entradas e saídas.
   - Integração PIX está disponível dependendo do plano.
6. Gestão (Estoque e Compras): Controle de itens consumíveis (velas, charutos, bebidas).
7. Múltiplas Casas: Um administrador pode gerenciar mais de um terreiro.

Instruções de conduta:
- Seja muito educado, claro e conciso. Use linguagem respeitosa.
- Se o usuário perguntar como fazer algo, dê instruções passo a passo com base nos menus acima.
- Se a pergunta for sobre religiões e não sobre o uso do software, você pode responder brevemente, mas lembre-os de que seu foco principal é o suporte ao uso do software "Terreiras App".
- Nunca divulgue chaves de API, tokens ou dados técnicos internos.`;

serve(async (req: Request) => {
  // Lidar com requisição CORS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Formato de mensagens inválido.')
    }

    // Preparar as mensagens adicionando o System Prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY não configurada no servidor.')
    }

    // Fazer a chamada ao OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://orunapp.com.br', // Opcional para o ranking do OpenRouter
        'X-Title': 'Terreiras App Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Modelo rápido e gratuito no OpenRouter
        messages: fullMessages,
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenRouter API Error:', data);
      throw new Error(data.error?.message || 'Erro na comunicação com a IA')
    }

    return new Response(
      JSON.stringify({ 
        reply: data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
