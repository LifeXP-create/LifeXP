// src/lib/chatClient.js
// Client redet nur mit deinem Backend. Kein OpenAI Key im Handy.

const API_BASE = process.env.EXPO_PUBLIC_API_BASE; 
// Beispiel später: https://dein-projekt.vercel.app

if (!API_BASE) {
  console.warn("[chatClient] EXPO_PUBLIC_API_BASE fehlt. Setze es in deiner .env");
}

export async function sendChatMessage(history, userMessage) {
  const base = String(API_BASE || "").replace(/\/$/, "");
  if (!base) {
    return "Backend-URL fehlt. Setze EXPO_PUBLIC_API_BASE in der .env (z.B. https://xyz.vercel.app).";
  }

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: userMessage,
      history: Array.isArray(history) ? history : [],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Backend-Fehler: ${res.status} ${txt}`);
  }

  const json = await res.json();
  return String(json?.reply || "").trim() || "Keine Antwort.";
}
