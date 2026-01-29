// backend/api/chat.js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

let ratelimit = null;

// Lazy init (wichtig: nicht beim Import crashen)
function getRatelimit() {
  if (ratelimit) return ratelimit;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    // Kein Redis konfiguriert -> kein RateLimit (aber KEIN crash)
    return null;
  }

  const redis = new Redis({ url, token });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 Requests / Minute / IP
    analytics: true,
    prefix: "lifexp:ratelimit",
  });

  return ratelimit;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-APP-KEY",
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Optional: einfacher App-Key Schutz
    const requiredAppKey = process.env.APP_API_KEY;
    if (requiredAppKey) {
      const got = req.headers["x-app-key"];
      if (got !== requiredAppKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    // Rate limit (falls Upstash env vorhanden)
    const rl = getRatelimit();
    if (rl) {
      const ip = getClientIp(req);
      const { success, reset, remaining } = await rl.limit(`ip:${ip}`);

      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("X-RateLimit-Reset", String(reset));

      if (!success) {
        return res.status(429).json({ error: "Too many requests" });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing OPENAI_API_KEY" });
    }

    const { message, history } = req.body || {};
    const userMessage = String(message || "").trim();
    const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    const messages = [
      {
        role: "system",
        content:
          "Du bist LifeXP, ein persönlicher Coach für Jugendliche und junge Erwachsene. " +
          "Du hilfst bei Schule, Sport, Produktivität, Beziehungen und mentaler Gesundheit. " +
          "Antworte kurz, klar, direkt und in Du-Form. Kein Geschwafel, keine Floskeln.",
      },
      ...safeHistory
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string",
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
      { role: "user", content: userMessage.slice(0, 4000) },
    ];

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => "");
      return res
        .status(500)
        .json({ error: "OpenAI error", detail: txt.slice(0, 2000) });
    }

    const json = await upstream.json();
    const reply =
      json?.choices?.[0]?.message?.content?.trim() || "Keine Antwort erhalten.";

    return res.status(200).json({ reply });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Server error", detail: String(e?.message || e) });
  }
}
