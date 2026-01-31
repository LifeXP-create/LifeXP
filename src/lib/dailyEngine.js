import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateDailyQuests } from "./ai";
import { personalizeQuests } from "./coachAI";

const DAILY_META_KEY = "daily_meta_v1";

const todayISO = () => new Date().toISOString().slice(0, 10);

function normalizeProfile(p) {
  if (!p) return {};
  return {
    name: p.name || "",
    age: p.age || null,
    gender: p.gender || null,
    goals: Array.isArray(p.goals) ? p.goals : [],
    interests: Array.isArray(p.interests) ? p.interests : [],
    personality: Array.isArray(p.personality) ? p.personality : [],
    others: Array.isArray(p.others) ? p.others : [],
  };
}

export async function ensureDailyQuests({
  currentQuests = [],
  setQuests,
  areas,
  profileV2,
  prefs = {},
}) {
  const today = todayISO();

  // meta laden
  let meta = null;
  try {
    meta = JSON.parse((await AsyncStorage.getItem(DAILY_META_KEY)) || "null");
  } catch {}

  // wenn heute schon generiert: nichts tun
  if (meta?.date === today) return false;

  // Neue Daily Quests erzeugen (roh)
  const raw = generateDailyQuests(prefs);

  // Personalisieren/Sortieren (dein coachAI)
  const ctx = {
    profile: normalizeProfile(profileV2),
    areas: areas || {},
  };

  const personalized = personalizeQuests(raw, ctx);

  // WICHTIG: Alte Daily Quests rauswerfen, aber Custom Quests behalten
  // Annahme: daily quests haben id prefix "q_" und custom "q_custom_..." oder "fromCoach"
  const kept = (Array.isArray(currentQuests) ? currentQuests : []).filter(
    (q) => q?.fromCoach,
  );

  const next = [...personalized, ...kept];

  setQuests(next);

  await AsyncStorage.setItem(
    DAILY_META_KEY,
    JSON.stringify({ date: today, count: personalized.length }),
  );

  return true;
}
