// =============================================================
//  /api/webhook-pagseguro.js
//  Vercel Serverless Function — Webhook PagSeguro / PagBank
//
//  Fluxo:
//   1. PagSeguro envia POST com o evento de pagamento
//   2. Validamos a assinatura HMAC-SHA256 (header pagseguro-signature)
//   3. Buscamos a cobrança (charge) pelo referenceId no Supabase
//   4. Se status = PAID, marcamos o membro como pagador na cobrança
//
//  Variáveis de ambiente necessárias (Vercel → Settings → Env):
//   PAGSEGURO_TOKEN      — Token da sua conta PagBank
//   PAGSEGURO_WEBHOOK_SECRET — Chave secreta gerada ao cadastrar o webhook
//   SUPABASE_URL         — URL do Supabase (sem o VITE_ prefix)
//   SUPABASE_SERVICE_KEY — Service Role Key (chave secreta do Supabase)
// =============================================================

import crypto from "crypto";

// ── Helpers ────────────────────────────────────────────────────

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo PagBank no header
 * pagseguro-signature.
 * Formato esperado: "hashedalgo=<sha256-hmac>"
 */
function validarAssinatura(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  // O PagBank pode enviar "hashedalgo=<hash>" ou apenas "<hash>"
  const hash = signatureHeader.includes("=")
    ? signatureHeader.split("=")[1]
    : signatureHeader;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Faz uma requisição autenticada ao Supabase REST API.
 */
async function supabaseRequest(path, options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

/**
 * Busca uma cobrança pelo referenceId (que gravamos no campo `id` da charge).
 * O referenceId é o ID da cobrança no seu Supabase que você passa ao criar
 * o link/cobrança no PagBank (campo reference_id da API PagBank).
 */
async function buscarCharge(referenceId) {
  const { data, status } = await supabaseRequest(
    `/charges?id=eq.${encodeURIComponent(referenceId)}&limit=1`
  );
  if (status !== 200 || !data || data.length === 0) return null;
  return data[0];
}

/**
 * Marca um usuário como pagador numa cobrança (campo paid_by é JSONB array).
 * Só adiciona se ainda não estiver na lista.
 */
async function marcarComoPago(chargeId, userId) {
  // 1. Busca a cobrança atual para obter paid_by
  const { data: rows } = await supabaseRequest(
    `/charges?id=eq.${encodeURIComponent(chargeId)}&limit=1`
  );
  if (!rows || rows.length === 0) return false;

  const charge = rows[0];
  const paidBy = Array.isArray(charge.paid_by) ? charge.paid_by : [];

  if (paidBy.includes(userId)) return true; // já estava pago

  const novoPaidBy = [...paidBy, userId];

  // 2. Atualiza o campo paid_by
  const { status } = await supabaseRequest(
    `/charges?id=eq.${encodeURIComponent(chargeId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ paid_by: novoPaidBy }),
    }
  );

  return status === 200 || status === 204;
}

/**
 * Registra o log do webhook numa tabela opcional `webhook_logs`.
 * Se a tabela não existir, ignora silenciosamente.
 */
async function registrarLog(payload, status, erro = null) {
  try {
    await supabaseRequest("/webhook_logs", {
      method: "POST",
      body: JSON.stringify({
        gateway: "pagseguro",
        event_type: payload?.type || "unknown",
        reference_id:
          payload?.charges?.[0]?.reference_id ||
          payload?.order?.reference_id ||
          null,
        status_pagamento: status,
        erro: erro ? String(erro) : null,
        payload_raw: JSON.stringify(payload),
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Log é opcional — não interrompe o fluxo principal
  }
}

// ── Handler principal ──────────────────────────────────────────

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ── 1. Ler o body como texto bruto (necessário para validar HMAC) ──
  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (rawBody += chunk.toString()));
    req.on("end", resolve);
    req.on("error", reject);
  });

  // ── 2. Validar assinatura ──────────────────────────────────────
  const signatureHeader =
    req.headers["pagseguro-signature"] ||
    req.headers["x-pagseguro-signature"] ||
    "";

  const secret = process.env.PAGSEGURO_WEBHOOK_SECRET || "";

  if (secret && !validarAssinatura(rawBody, signatureHeader, secret)) {
    console.warn("[webhook-pagseguro] Assinatura inválida rejeitada.");
    return res.status(401).json({ error: "Assinatura inválida" });
  }

  // ── 3. Parsear o payload ───────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Body inválido" });
  }

  console.log("[webhook-pagseguro] Evento recebido:", payload?.type);

  // ── 4. Processar eventos de pagamento ─────────────────────────
  //
  //  O PagBank envia eventos do tipo:
  //    "CHARGE_PAID"        → cobrança avulsa paga
  //    "ORDER.PAID"         → pedido pago (inclui charges dentro)
  //    "SUBSCRIPTION.PAID"  → assinatura paga
  //
  //  Cada charge tem:
  //    charge.reference_id  — o ID da cobrança no seu Supabase
  //    charge.metadata      — metadados extras (ex: user_id do membro)

  const eventType = payload?.type || "";
  const isPagoEvent =
    eventType === "CHARGE_PAID" ||
    eventType === "CHARGE.PAID" ||
    eventType === "ORDER.PAID" ||
    eventType === "ORDER_PAID" ||
    (payload?.charges && payload.charges.some((c) => c.status === "PAID"));

  if (!isPagoEvent) {
    // Evento ignorado (cancelamento, estorno, etc.)
    await registrarLog(payload, "ignorado");
    console.log("[webhook-pagseguro] Evento ignorado:", eventType);
    return res.status(200).json({ received: true, processed: false });
  }

  // ── 5. Extrair as charges do payload ──────────────────────────
  let chargesDoEvento = [];

  if (Array.isArray(payload.charges)) {
    // Evento direto de charge
    chargesDoEvento = payload.charges.filter((c) => c.status === "PAID");
  } else if (payload.order?.charges) {
    // Evento de pedido (order)
    chargesDoEvento = payload.order.charges.filter((c) => c.status === "PAID");
  }

  if (chargesDoEvento.length === 0) {
    await registrarLog(payload, "sem_charges_pagas");
    return res.status(200).json({ received: true, processed: false });
  }

  // ── 6. Processar cada charge ───────────────────────────────────
  const resultados = [];

  for (const charge of chargesDoEvento) {
    const referenceId = charge.reference_id || charge.referenceId;
    // O metadata.user_id é opcional — só disponível se você passar ao criar a charge no PagBank
    const userId =
      charge.metadata?.user_id ||
      charge.metadata?.userId ||
      payload.metadata?.user_id ||
      null;

    if (!referenceId) {
      resultados.push({ referenceId: null, status: "sem_reference_id" });
      continue;
    }

    try {
      const chargeDb = await buscarCharge(referenceId);

      if (!chargeDb) {
        console.warn(
          `[webhook-pagseguro] Cobrança não encontrada: ${referenceId}`
        );
        resultados.push({ referenceId, status: "nao_encontrada" });
        continue;
      }

      // Se temos o userId, marcamos especificamente aquele membro
      // Caso contrário, marcamos todos os assignedTo como pagos
      const membrosParaMarcar = userId
        ? [userId]
        : Array.isArray(chargeDb.assigned_to)
        ? chargeDb.assigned_to
        : [];

      for (const membroId of membrosParaMarcar) {
        const ok = await marcarComoPago(chargeDb.id, membroId);
        resultados.push({
          referenceId,
          userId: membroId,
          status: ok ? "marcado_pago" : "erro_ao_marcar",
        });
      }
    } catch (err) {
      console.error("[webhook-pagseguro] Erro ao processar charge:", err);
      await registrarLog(payload, "erro", err);
      resultados.push({ referenceId, status: "erro", erro: String(err) });
    }
  }

  await registrarLog(payload, "processado");
  console.log("[webhook-pagseguro] Resultado:", resultados);

  return res.status(200).json({ received: true, processed: true, resultados });
}

// ── Configuração Vercel: necessário para ler raw body ──────────
export const config = {
  api: {
    bodyParser: false,
  },
};
