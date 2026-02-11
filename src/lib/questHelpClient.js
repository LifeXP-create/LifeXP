// src/lib/questHelpClient.js
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

function baseUrl() {
  return String(API_BASE || "").replace(/\/$/, "");
}

export async function fetchQuestHelp({ action, quest, profile }) {
  const base = baseUrl();
  if (!base) throw new Error("EXPO_PUBLIC_API_BASE fehlt");

  const res = await fetch(`${base}/api/quest-help`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      quest,
      profile,
    }),
  });

  const txt = await res.text().catch(() => "");
  if (!res.ok)
    throw new Error(`quest-help backend error ${res.status}: ${txt}`);

  return JSON.parse(txt);
}
