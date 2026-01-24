// src/lib/chatClient.js
// Einfacher Client für OpenAI-Chat.
// WICHTIG: Lege in deiner .env-Datei z. B. fest:
// EXPO_PUBLIC_OPENAI_API_KEY=dein_key_hier

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[chatClient] Kein API-Key gesetzt. Setze EXPO_PUBLIC_OPENAI_API_KEY in deiner .env-Datei."
  );
}

/**
 * history: Array<{ role: "user" | "assistant", content: string }>
 * userMessage: string
 * -> gibt Antwort-Text der KI zurück
 */
export async function sendChatMessage(history, userMessage) {
  if (!API_KEY) {
    // Fallback ohne Netzwerk (z. B. in Simulator ohne .env)
    return "Ich bin in diesem Build noch nicht mit dem Internet verbunden. " +
      "Trage bitte deinen API-Key in der .env ein (EXPO_PUBLIC_OPENAI_API_KEY).";
  }

  const messages = [
    {
      role: "system",
      content:
        "Du bist LifeXP, ein persönlicher Coach für Jugendliche und junge Erwachsene. " +
        "Du hilfst bei Schule, Sport, Eishockey, Produktivität, Beziehungen und mentaler Gesundheit. " +
        "Antworte kurz, klar, direkt und in Du-Form. Kein Geschwafel, keine Floskeln.",
    },
    ...history,
    { role: "user", content: userMessage },
  ];

  const body = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.6,
    max_tokens: 400,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("OpenAI-Fehler:", res.status, txt);
    throw new Error("Fehler beim Kontakt mit der KI.");
  }

  const json = await res.json();
  const answer =
    json.choices?.[0]?.message?.content?.trim() ||
    "Ich konnte gerade keine sinnvolle Antwort erzeugen.";

  return answer;
}
