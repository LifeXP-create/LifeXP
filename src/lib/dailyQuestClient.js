// src/lib/dailyQuestClient.js
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

function baseUrl() {
  const b = String(API_BASE || "").replace(/\/$/, "");
  return b;
}

export async function fetchDailyQuests(payload) {
  const base = baseUrl();
  if (!base) throw new Error("EXPO_PUBLIC_API_BASE fehlt");

  const res = await fetch(`${base}/api/daily-quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  const txt = await res.text().catch(() => "");
  if (!res.ok)
    throw new Error(`daily-quests backend error ${res.status}: ${txt}`);

  const json = JSON.parse(txt);
  return json;
}
