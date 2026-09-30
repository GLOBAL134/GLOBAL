import { validateApplication, makeApplicationId, formatTelegramMessage } from "./lib.js";

const json = (body, status, origin) => new Response(JSON.stringify(body), { status, headers: { "content-type":"application/json; charset=utf-8", "access-control-allow-origin":origin, "access-control-allow-methods":"POST,OPTIONS", "access-control-allow-headers":"content-type", "vary":"Origin" } });

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = origin === env.ALLOWED_ORIGIN || origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000";
    const corsOrigin = allowed ? origin : env.ALLOWED_ORIGIN;
    if (request.method === "OPTIONS") return allowed ? json({}, 204, corsOrigin) : json({ error:"Origin not allowed" }, 403, corsOrigin);
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok:true }, 200, corsOrigin);
    if (url.pathname !== "/applications" || request.method !== "POST") return json({ error:"Not found" }, 404, corsOrigin);
    if (!allowed) return json({ error:"Origin not allowed" }, 403, corsOrigin);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 12000) return json({ error:"Payload too large" }, 413, corsOrigin);
    let input;
    try { input = await request.json(); } catch { return json({ error:"Invalid JSON" }, 400, corsOrigin); }
    const checked = validateApplication(input);
    if (!checked.ok) return json({ error:"Validation failed", fields:checked.errors }, 422, corsOrigin);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const fingerprint = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}:${checked.value.phone}`));
    const key = Array.from(new Uint8Array(fingerprint)).slice(0,12).map(x=>x.toString(16).padStart(2,"0")).join("");
    if (env.RATE_LIMIT) {
      const prior = await env.RATE_LIMIT.get(key);
      if (prior) return json({ error:"Слишком много заявок. Повторите позже." }, 429, corsOrigin);
      await env.RATE_LIMIT.put(key, "1", { expirationTtl: 300 });
    }

    const application = { id:makeApplicationId(), created_at:new Date().toISOString(), ...checked.value, status:"NEW" };
    const supabase = await env.fetch(`${env.SUPABASE_URL}/rest/v1/applications`, { method:"POST", headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type":"application/json", prefer:"return=minimal" }, body:JSON.stringify(application) });
    if (!supabase.ok) return json({ error:"Не удалось сохранить заявку" }, 502, corsOrigin);

    const telegram = await env.fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ chat_id:env.TELEGRAM_CHAT_ID, text:formatTelegramMessage(application), disable_web_page_preview:true }) });
    if (!telegram.ok) {
      await env.fetch(`${env.SUPABASE_URL}/rest/v1/applications?id=eq.${encodeURIComponent(application.id)}`, { method:"DELETE", headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } });
      return json({ error:"Не удалось уведомить менеджера" }, 502, corsOrigin);
    }
    return json({ ok:true, id:application.id }, 201, corsOrigin);
  }
};
