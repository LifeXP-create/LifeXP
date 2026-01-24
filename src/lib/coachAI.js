// src/lib/coachAI.js
// Sehr einfache "KI"-Logik: bewertet Quests nach Relevanz
// und sortiert sie. Später können wir das durch echte KI ersetzen.

const AREA_WEIGHT = {
  Body: 1.0,
  Mind: 1.0,
  Social: 1.0,
  Productivity: 1.0,
  Wellbeing: 1.0,
};

export function personalizeQuests(quests = [], ctx = {}) {
  const { profile = {}, areas = {} } = ctx;
  const now = new Date();
  const hour = now.getHours();

  return quests
    .map((q) => {
      const score = scoreQuest(q, { profile, areas, hour });
      return { ...q, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...rest }) => rest); // Score wieder entfernen
}

function scoreQuest(q, { profile, areas, hour }) {
  let s = 1;

  // 1) Grundgewichtung nach Bereich
  const base = AREA_WEIGHT[q.area] ?? 1;
  s += base * 0.2;

  // 2) Tageszeit-Logik
  if (hour < 11) {
    // Morgen: Kopf frisch → Mind / Productivity leicht bevorzugen
    if (q.area === "Mind" || q.area === "Productivity") s += 0.6;
  } else if (hour >= 18 && hour <= 22) {
    // Abend: Social / Wellbeing eher passend
    if (q.area === "Social" || q.area === "Wellbeing") s += 0.6;
  } else if (hour >= 22 || hour < 6) {
    // Spät nachts: keine Body-Hardcore-Sachen pushen
    if (q.area === "Body" && /Laufen|Workout|Training/i.test(q.title)) {
      s -= 0.5;
    }
  }

  // 3) Balance: Bereiche mit niedrigerem Level leicht pushen
  const areaState = areas[q.area];
  if (areaState && typeof areaState.level === "number" && typeof profile.level === "number") {
    if (areaState.level < profile.level) {
      s += 0.4; // dieser Bereich "hinkt hinterher"
    }
  }

  // 4) Titel-basierte Heuristik (nur lokale Logik)
  const t = q.title.toLowerCase();

  // Body
  if (q.area === "Body") {
    if (includesSome(t, ["stretch", "dehnen", "mobility"])) s += 0.4;
    if (includesSome(t, ["laufen", "joggen", "cardio"])) s += 0.3;
  }

  // Mind
  if (q.area === "Mind") {
    if (includesSome(t, ["mathe", "lernen", "vokabel", "prüfung", "test"])) s += 0.5;
    if (includesSome(t, ["lesen", "buch", "read"])) s += 0.3;
  }

  // Social
  if (q.area === "Social") {
    if (includesSome(t, ["freund", "freundin", "call", "treffen"])) s += 0.4;
    if (includesSome(t, ["familie", "mami", "papi", "bruder", "schwester"])) s += 0.3;
  }

  // Productivity
  if (q.area === "Productivity") {
    if (includesSome(t, ["deep work", "fokus", "focus", "to-dos", "lernen"])) s += 0.5;
    if (includesSome(t, ["zimmer", "arbeitsplatz", "desk"])) s += 0.2;
  }

  // Wellbeing
  if (q.area === "Wellbeing") {
    if (includesSome(t, ["meditation", "atmen", "breath", "spaziergang"])) s += 0.5;
    if (includesSome(t, ["schlaf", "sleep", "routine"])) s += 0.3;
  }

  // 5) Mini-Boost für nicht erledigte wiederkehrende Habits
  if (q.fromHabit) s += 0.4;

  return s;
}

function includesSome(text, keywords) {
  return keywords.some((k) => text.includes(k));
}
