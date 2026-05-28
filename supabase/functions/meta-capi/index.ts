import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PIXEL_ID = Deno.env.get("META_PIXEL_ID")!;
const TOKEN = Deno.env.get("META_CAPI_TOKEN")!;
const ENDPOINT = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event_name, user_data, event_source_url } = await req.json();

    if (!event_name) {
      return new Response(
        JSON.stringify({ error: "event_name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: event_source_url || "https://orunapp.com.br",
          user_data: {
            client_user_agent: user_data?.user_agent || "",
            client_ip_address: req.headers.get("x-forwarded-for") || "",
            fbc: user_data?.fbc || "",
            fbp: user_data?.fbp || "",
            em: user_data?.email_hash || "",  // SHA-256 do e-mail, se houver
            ph: user_data?.phone_hash || "",  // SHA-256 do telefone, se houver
          },
        },
      ],
      access_token: TOKEN,
    };

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.ok ? 200 : 500,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
