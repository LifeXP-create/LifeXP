// src/lib/ai.js
// NUR tägliche Quests (keine Routinen, keine Anti-Gewohnheiten)

const AREAS = ["Body", "Mind", "Social", "Productivity", "Wellbeing"];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const todayISO = () => new Date().toISOString().slice(0, 10);

export function generateDailyQuests(prefs = {}) {
  const diff = (a) => clamp(prefs?.areaDifficulty?.[a] ?? 2, 1, 3);

  const P = {
    Body: ["20 Min. Laufen", "25 Liegestütze", "10 Min. Dehnen", "3L Wasser trinken", "8.000 Schritte"],
    Mind: ["20 Min. Mathe", "10 Seiten lesen", "Vokabeln 15 Min.", "1 Übungsaufgabe", "Notizen zusammenfassen"],
    Social: ["Schreibe einer Person", "Kurzer Call mit Freund", "3 Komplimente", "Neue Person ansprechen", "Familie anrufen"],
    Productivity: ["Arbeitsplatz 10 Min.", "Top-3 To-Dos definieren", "E-Mails 15 Min.", "30 Min. Deep Work", "Kalender für morgen"],
    Wellbeing: ["10 Min. Meditation", "Abendspaziergang", "Digital Detox 30 Min.", "Schlafroutine planen", "5 Min. Atemübung"],
  };

  const out = [];
  const order = [...AREAS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 4; i++) {
    const a = order[i % AREAS.length];
    out.push(q(`base_${i}`, pick(P[a]), a, diff(a)));
  }

  const bA = pick(AREAS);
  out.push(q("bonus", pick(P[bA]), bA, diff(bA)));

  if (new Date().getDay() === 0) {
    out.unshift(q("weeklyplan", "Nächste Woche planen (15–20 Min.)", "Productivity", 2));
  }

  return out;
}

function q(seed, title, area, difficulty) {
  return { id: `q_${seed}_${todayISO()}`, title, area, difficulty, done: false };
}
function pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}
