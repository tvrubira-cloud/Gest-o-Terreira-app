/**
 * Evolution API - utilitário para envio de mensagens via WhatsApp
 * Usa Edge Function do Supabase como proxy para evitar CORS
 */

export interface EvolutionConfig {
  url: string;       // ex: https://api.suaevolution.com
  apiKey: string;    // API Key global
  instance: string;  // nome da instância conectada
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-proxy`;

function proxyHeaders(config: EvolutionConfig) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'x-evolution-url': config.url,
    'x-evolution-key': config.apiKey,
  };
}

export async function sendWhatsAppMessage(
  config: EvolutionConfig,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;

  try {
    const res = await fetch(`${PROXY_BASE}/message/sendText/${config.instance}`, {
      method: 'POST',
      headers: proxyHeaders(config),
      body: JSON.stringify({ number, text: message }),
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
  try {
    const res = await fetch(`${PROXY_BASE}/instance/connectionState/${config.instance}`, {
      headers: proxyHeaders(config),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { connected: false, error: `HTTP ${res.status}: ${errorText || res.statusText}` };
    }

    const data = await res.json();
    const state = data?.instance?.state || data?.state || '';
    return { connected: state === 'open', state };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}
