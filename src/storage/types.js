export const AREAS = ["Body", "Mind", "Social", "Productivity", "Wellbeing"];

export function now() {
  return Date.now();
}

export function makeProfile({ userId }) {
  return {
    userId,
    email: "",
    name: "",
    age: null,
    gender: "männlich",
    goals: [],
    interests: [],
    personality: [],
    others: [],
    createdAt: now(),
    updatedAt: now(),
  };
}

export function makeQuest({ userId, id, title, area, difficulty = 2 }) {
  return {
    userId,
    id,
    title,
    area,
    difficulty,
    done: false,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function makeCompletion({ userId, questId, dateISO }) {
  return {
    userId,
    id: `c_${questId}_${dateISO}`,
    questId,
    dateISO,
    createdAt: now(),
  };
}

export function makeXPEvent({ userId, amount, reason, refId = "" }) {
  return {
    userId,
    id: `xp_${now()}_${Math.random().toString(16).slice(2)}`,
    amount,
    reason,
    refId,
    createdAt: now(),
  };
}
