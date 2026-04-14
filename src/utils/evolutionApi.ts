/**
 * Evolution API - utilitário para envio de mensagens via WhatsApp
 * Usa Edge Function do Supabase como proxy para evitar CORS
 */

export interface EvolutionConfig {
  url: string;
  apiKey: string;
  instance: string;
}

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-proxy`;

function proxyHeaders(config: EvolutionConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
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
      body: JSON.stringify({ number, textMessage: { text: message } }),
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

export async function createEvolutionInstance(
  config: EvolutionConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetch(`${PROXY_BASE}/instance/logout/${config.instance}`, {
      method: 'DELETE',
      headers: proxyHeaders(config),
    });
    await fetch(`${PROXY_BASE}/instance/delete/${config.instance}`, {
      method: 'DELETE',
      headers: proxyHeaders(config),
    });
    return { success: true };
  } catch (err: any) {
    return { success: true }; // ignora erros de delete
  }
}

export async function getEvolutionQrCode(
  config: EvolutionConfig
): Promise<{ qrcode?: string; error?: string }> {
  try {
    // Cria instância com token único (sem token, a API usa instanceName que pode conflitar)
    const token = `tok-${config.instance}`;
    const createRes = await fetch(`${PROXY_BASE}/instance/create`, {
      method: 'POST',
      headers: proxyHeaders(config),
      body: JSON.stringify({ instanceName: config.instance, token, qrcode: true }),
    });

    const createText = await createRes.text();
    let createData: any = {};
    try { createData = JSON.parse(createText); } catch {}

    const alreadyExists = !createRes.ok && createText.includes('already exists');
    if (!createRes.ok && !alreadyExists) {
      return { error: `Erro ao criar instância: HTTP ${createRes.status}: ${createText}` };
    }

    // QR pode vir direto no create
    const qrFromCreate = createData?.qrcode?.base64 || createData?.hash?.qrcode?.base64;
    if (qrFromCreate) return { qrcode: qrFromCreate };

    // Aguarda instância ficar pronta e busca QR via connect
    await new Promise(r => setTimeout(r, 1500));

    const connectRes = await fetch(`${PROXY_BASE}/instance/connect/${config.instance}`, {
      headers: proxyHeaders(config),
    });

    if (!connectRes.ok) {
      const body = await connectRes.text();
      return { error: `HTTP ${connectRes.status}: ${body}` };
    }

    const connectData = await connectRes.json();
    const qrcode = connectData.base64 || connectData.qrcode?.base64 || connectData.qrcode;
    if (!qrcode) return { error: `Resposta create: ${createText} | Resposta connect: ${JSON.stringify(connectData)}` };
    return { qrcode };
  } catch (err: any) {
    return { error: err.message };
  }
}
