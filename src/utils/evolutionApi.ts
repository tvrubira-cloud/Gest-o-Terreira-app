/**
 * Evolution API - utilitário para envio de mensagens via WhatsApp
 * Documentação: https://doc.evolution-api.com
 */

export interface EvolutionConfig {
  url: string;       // ex: https://api.suaevolution.com
  apiKey: string;    // API Key global
  instance: string;  // nome da instância conectada
}

export async function sendWhatsAppMessage(
  config: EvolutionConfig,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // Normaliza o número: remove não-dígitos, garante DDI 55
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;

  const baseUrl = config.url.replace(/\/$/, '');

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${config.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkEvolutionConnection(
  config: EvolutionConfig
): Promise<{ connected: boolean; state?: string; error?: string }> {
  const baseUrl = config.url.replace(/\/$/, '');
  try {
    const res = await fetch(`${baseUrl}/instance/connectionState/${config.instance}`, {
      headers: { 'apikey': config.apiKey },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      return { 
        connected: false, 
        error: `HTTP ${res.status}: ${errorText || res.statusText}` 
      };
    }
    
    const data = await res.json();
    const state = data?.instance?.state || data?.state || '';
    return { connected: state === 'open', state };
  } catch (err: any) {
    return { 
      connected: false, 
      error: err.name === 'TypeError' && err.message === 'Failed to fetch'
        ? 'Erro de rede ou CORS. Verifique se a URL está correta e se o CORS está permitido no servidor.'
        : err.message 
    };
  }
}
