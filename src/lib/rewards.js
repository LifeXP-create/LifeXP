// src/lib/rewards.js
import { v4 as uuidv4 } from "uuid";

export const RARITIES = [
  { key: "common",     chance: 0.65 },
  { key: "uncommon",   chance: 0.20 },
  { key: "rare",       chance: 0.10 },
  { key: "epic",       chance: 0.04 },
  { key: "legendary",  chance: 0.01 },
];

// Streak- und Level-Modifikatoren
function rarityBoosts(streakDays = 0, galaxyLvl = 1) {
  let boosts = { uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  if (streakDays >= 3) boosts.uncommon += 0.05;
  if (streakDays >= 5) boosts.rare     += 0.10;
  if (streakDays >= 7) boosts.epic     += 0.20;
  if (galaxyLvl >= 5)  boosts.rare     += 0.02;
  if (galaxyLvl >= 8)  boosts.epic     += 0.01;
  return boosts;
}

export function rollRarity({ streakDays = 0, galaxyLvl = 1 }) {
  const boosts = rarityBoosts(streakDays, galaxyLvl);
  const pool = RARITIES.map(r => {
    const b = boosts[r.key] || 0;
    return { key: r.key, p: Math.max(0, r.chance + b) };
  });
  // normalisieren
  const sum = pool.reduce((a,b)=>a+b.p,0);
  const norm = pool.map(r => ({ key: r.key, p: r.p / sum }));
  // roll
  let x = Math.random();
  for (const r of norm) {
    if ((x -= r.p) <= 0) return r.key;
  }
  return "common";
}

// Beispiel-Namenspools
const NAME_POOLS = {
  mind:  ["Serava","Cerebra","Mneme","Noema","Axiom","Neura","Syntra"],
  body:  ["Athron","Vires","Kardia","Flexor","Oxon","Myon","Endura"],
  social:["Lumera","Affina","Conviva","Amiro","Cordis","Communa"],
  productivity:["Structa","Kernis","Fabrica","Tessera","Plano","Cadence"],
  wellbeing:["Calma","Somnus","Eunoia","Silens","Aurae","Seren"],
};

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

export function makePlanet({ galaxyKey, rarity }) {
  const base = {
    id: uuidv4(),
    name: pick(NAME_POOLS[galaxyKey] || ["Unnamed"]),
    rarity,
    galaxyKey,
    createdAt: new Date().toISOString(),
    energy: 3,              // für Verteidigungsmechanik
    state: "stable",        // stable|attacked|decay
    visuals: {
      baseColor: {
        mind:"#B992FF", body:"#4CE0D2", social:"#FF8AC3",
        productivity:"#FFB020", wellbeing:"#3AD87A"
      }[galaxyKey] || "#9aa0a6",
      rings: rarity==="rare" || rarity==="epic" || rarity==="legendary",
      glow:  rarity!=="common",
      orbitSpeed: 0.2 + Math.random()*0.6
    }
  };
  return base;
}

// Tageslimit je Galaxy
export function canDropToday(galaxyKey, dropLog, isoDay) {
  const key = `${galaxyKey}:${isoDay}`;
  return !dropLog[key];
}

export function markDrop(galaxyKey, dropLog, isoDay) {
  const key = `${galaxyKey}:${isoDay}`;
  dropLog[key] = true;
}

export function isoDay(d=new Date()){
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}
