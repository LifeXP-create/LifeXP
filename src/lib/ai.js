// src/lib/ai.js
// Fallback-Quests, falls Backend/KI nicht erreichbar ist.

export const AREAS = ["Body", "Mind", "Social", "Productivity", "Wellbeing"];
const todayISO = () => new Date().toISOString().slice(0, 10);

export function generateDailyQuestsFallback() {
  const P = {
    Body: [
      "15 Min. Spazieren",
      "10 Min. Dehnen",
      "20 Kniebeugen",
      "2L Wasser heute",
    ],
    Mind: [
      "15 Min. Lernen",
      "10 Seiten lesen",
      "5 Min. Notizen ordnen",
      "1 Übungsaufgabe lösen",
    ],
    Social: [
      "Schreibe einer Person",
      "Kurzer Call",
      "Jemandem danken",
      "Familie kurz fragen wie’s geht",
    ],
    Productivity: [
      "Top-3 To-Dos",
      "10 Min. Aufräumen",
      "15 Min. Fokus",
      "Kalender für morgen checken",
    ],
    Wellbeing: [
      "5 Min. Atemübung",
      "10 Min. Offline",
      "Kurz Tagebuch",
      "Schlafroutine heute planen",
    ],
  };

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

  const areas = shuffle(AREAS);
  const out = [];

  for (let i = 0; i < 4; i++) {
    const area = areas[i % areas.length];
    out.push({
      id: `q_fallback_${todayISO()}_${i}_${Math.random().toString(16).slice(2, 8)}`,
      title: pick(P[area]),
      area,
      done: false,
    });
  }

  const bonusArea = pick(AREAS);
  out.push({
    id: `q_fallback_${todayISO()}_bonus_${Math.random().toString(16).slice(2, 8)}`,
    title: pick(P[bonusArea]),
    area: bonusArea,
    done: false,
  });

  return out;
}
