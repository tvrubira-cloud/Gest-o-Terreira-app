import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Usando Green API conforme configurado nos secrets do Supabase
const GREEN_API_INSTANCE_ID = Deno.env.get('GREEN_API_INSTANCE_ID');
const GREEN_API_TOKEN = Deno.env.get('GREEN_API_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWhatsAppMessage(phone: string, text: string) {
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.warn('Variáveis de ambiente da Green API não configuradas.');
    return;
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) return;

  const endpoint = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `55${cleanPhone}@c.us`,
        message: text
      }),
    });
    
    if (!res.ok) {
      console.error(`Erro ao enviar mensagem para ${cleanPhone} via Green API:`, await res.text());
    } else {
      console.log(`Mensagem enviada para ${cleanPhone} com sucesso via Green API.`);
    }
  } catch (err) {
    console.error(`Exceção ao enviar mensagem para ${cleanPhone}:`, err);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Buscar todos os terreiros no plano trial
    const { data: terreiros, error: terreirosError } = await supabase
      .from('terreiros')
      .select('id, name, created_at, admin_id')
      .eq('plan', 'trial');
      
    if (terreirosError) throw terreirosError;
    
    if (!terreiros || terreiros.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum terreiro em trial.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calcular datas de hoje
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let sentCount = 0;

    for (const terreiro of terreiros) {
      if (!terreiro.admin_id) continue;

      const createdDate = new Date(terreiro.created_at);
      createdDate.setUTCHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Buscar telefone e último login do admin
      const { data: adminData } = await supabase
        .from('users')
        .select('nome_completo, telefone, last_login_at, last_inactivity_message_at, spiritual')
        .eq('id', terreiro.admin_id)
        .single();

      if (!adminData) continue;
      
      const phone = adminData.spiritual?.whatsapp || adminData.telefone;
      if (!phone) continue;

      const adminName = adminData.nome_completo ? adminData.nome_completo.split(' ')[0] : 'Administrador';

      let messageToSend = null;

      // Sequência de onboarding e trial
      if (diffDays === 1) {
        messageToSend = `Olá ${adminName}, boas-vindas ao OrunApp! Esperamos que você aproveite muito o sistema para o ${terreiro.name}.`;
      } else if (diffDays === 3) {
        messageToSend = `Oi ${adminName}, como está sendo a experiência com o OrunApp no ${terreiro.name}? Qualquer dúvida estamos à disposição!`;
      } else if (diffDays === 7) {
        messageToSend = `Já faz 1 semana, ${adminName}! Já explorou tudo que o OrunApp tem a oferecer para o ${terreiro.name}?`;
      } else if (diffDays === 14) {
        messageToSend = `⚠️ Atenção ${adminName}: Faltam apenas 7 dias para o fim do seu período de teste no OrunApp.`;
      } else if (diffDays === 18) {
        messageToSend = `⚠️ Faltam apenas 3 dias para o fim do teste do ${terreiro.name}!`;
      } else if (diffDays === 21) {
        messageToSend = `🔔 Seu período de Trial termina hoje, ${adminName}. Acesse a plataforma para manter o seu plano ativo!`;
      }

      // Verificação de Inatividade (A cada 3 dias sem acesso)
      if (!messageToSend && adminData.last_login_at) {
        const lastLoginDate = new Date(adminData.last_login_at);
        lastLoginDate.setUTCHours(0, 0, 0, 0);
        
        const diffLoginTime = Math.abs(today.getTime() - lastLoginDate.getTime());
        const diffLoginDays = Math.floor(diffLoginTime / (1000 * 60 * 60 * 24));
        
        if (diffLoginDays >= 3 && diffLoginDays % 3 === 0) {
          // Verifica se já enviamos mensagem de inatividade hoje
          let alreadySentToday = false;
          if (adminData.last_inactivity_message_at) {
            const lastMsgDate = new Date(adminData.last_inactivity_message_at);
            lastMsgDate.setUTCHours(0, 0, 0, 0);
            if (lastMsgDate.getTime() === today.getTime()) {
              alreadySentToday = true;
            }
          }
          
          if (!alreadySentToday) {
            messageToSend = `Notamos que você não acessou o OrunApp ultimamente, ${adminName}. Tem algo em que possamos ajudar?`;
            
            // Atualiza o registro de última mensagem de inatividade enviada
            await supabase.from('users').update({
              last_inactivity_message_at: new Date().toISOString()
            }).eq('id', terreiro.admin_id);
          }
        }
      }

      if (messageToSend) {
        await sendWhatsAppMessage(phone, messageToSend);
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, messagesSent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Erro na função whatsapp-engagement:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
