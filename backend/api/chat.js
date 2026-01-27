// backend/api/chat.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Simple IP rate limit: max 20 requests / 10 minutes
const WINDOW_SECONDS = 10 * 60;
const MAX_REQUESTS = 20;

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  if (Array.isArray(xf) && xf.length) return String(xf[0]).trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

async function rateLimitOrThrow(req) {
  const ip = String(getClientIp(req));
  const key = `rl:chat:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  if (count > MAX_REQUESTS) {
    // optional: how long until reset
    const ttl = await redis.ttl(key);
    const retryAfter = Math.max(1, Number(ttl) || 60);
    const err = new Error("rate_limited");
    err.status = 429;
    err.retryAfter = retryAfter;
    throw err;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Rate limit before doing anything expensive
    await rateLimitOrThrow(req);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing OPENAI_API_KEY" });

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
    if (e?.message === "rate_limited" || e?.status === 429) {
      const retryAfter = Number(e?.retryAfter) || 60;
      res.setHeader("Retry-After", String(retryAfter));
      return res
        .status(429)
        .json({ error: "Rate limit exceeded", retryAfterSeconds: retryAfter });
    }
    return res
      .status(500)
      .json({ error: "Server error", detail: String(e?.message || e) });
  }
}
