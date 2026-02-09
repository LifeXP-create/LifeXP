// src/context/AppState.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { generateDailyQuests } from "../lib/ai";
import { fetchDailyQuests } from "../lib/dailyQuestClient";
import { getStorage } from "../storage/typesafeStorage";

export const AREAS = ["Body", "Mind", "Social", "Productivity", "Wellbeing"];

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEFAULT_WEEKLY_GOALS = {
  Body: 3,
  Mind: 3,
  Social: 1,
  Productivity: 3,
  Wellbeing: 4,
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// XP curve (GERADE)
export function requiredXPForLevel(level) {
  const L = Math.max(1, Number(level) || 1);
  return 10 * L;
}

// ---------- Date helpers ----------
function getDow(dateISO) {
  return new Date(`${dateISO}T00:00:00`).getDay(); // 0..6 So..Sa
}
function monthKey(dateISO) {
  return `MONTH:${dateISO.slice(0, 7)}`;
}
function yearKey(dateISO) {
  return `YEAR:${dateISO.slice(0, 4)}`;
}
function isoWeekKey(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - day + 3); // Thu
  const isoYear = d.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  const ww = String(week).padStart(2, "0");
  return `WEEK:${isoYear}-W${ww}`;
}

function isISODate(dateISO) {
  return typeof dateISO === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateISO);
}

// ---------- Seeded helpers (Anti-Gewohnheiten) ----------
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleStable(arr, seedStr) {
  const a = [...arr];
  const rnd = mulberry32(hashStr(seedStr));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function clampInt(n, a, b) {
  const x = Math.floor(Number(n) || 0);
  return Math.max(a, Math.min(b, x));
}

// NORMALIZE: Falls alte Saves nach XP-Kurve-Change "zu viel" XP haben
function normalizeProfile(p) {
  let lvl = Math.max(1, Number(p?.level) || 1);
  let xp = Math.max(0, Number(p?.xp) || 0);

  while (xp >= requiredXPForLevel(lvl)) {
    xp -= requiredXPForLevel(lvl);
    lvl += 1;
  }
  return { ...(p || {}), level: lvl, xp };
}

// ---------- History summary helper (für KI) ----------
function buildHistorySummary(history, days = 7) {
  const out = [];
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(d0);
    d.setDate(d0.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const h = history?.[iso];
    if (!h) continue;

    out.push({
      dateISO: iso,
      completed: Number(h.completed || 0),
      xp: Number(h.xp || 0),
      perArea: h.perArea || {},
    });
  }
  return out;
}

// ---------- Event -> Reminder helpers ----------
function eventReminderId(evId) {
  return `evq_${evId}`;
}
function buildEventReminder(ev, dateISO) {
  const time = (ev?.start || "").trim();
  const baseTitle = String(ev?.title || "").trim();
  const title = `${time ? `${time} ` : ""}${baseTitle}`.trim();

  return {
    id: eventReminderId(ev.id),
    title,
    area: "Erinnerung",
    createdAt: new Date().toISOString(),
    dueDateISO: isISODate(dateISO) ? dateISO : null,
    origin: "calendar",
    fromEvent: true,
    eventId: ev.id,
    time: time || undefined,
    start: ev.start,
    end: ev.end,
    location: ev.location,
    note: ev.note,
  };
}

// ---------- AI daily quests fetcher ----------
async function fetchDailyQuestsOrFallback({
  dateISO,
  profile,
  prefs,
  history,
}) {
  try {
    const historySummary = buildHistorySummary(history, 7);

    const payloadProfile = {
      name: profile?.name || "Player",
      email: profile?.email || "",
      age: profile?.age ?? null,
      gender: profile?.gender || "",
      goals: Array.isArray(profile?.goals) ? profile.goals : [],
      interests: Array.isArray(profile?.interests) ? profile.interests : [],
      personality: Array.isArray(profile?.personality)
        ? profile.personality
        : [],
      others: Array.isArray(profile?.others) ? profile.others : [],
    };

    const remote = await fetchDailyQuests({
      profile: payloadProfile,
      prefs,
      historySummary,
      dateISO,
    });

    if (Array.isArray(remote?.quests) && remote.quests.length === 5) {
      return remote.quests.map((q) => ({
        id: String(
          q.id || `q_${dateISO}_${Math.random().toString(16).slice(2)}`,
        ),
        title: String(q.title || "").trim(),
        area: AREAS.includes(q.area) ? q.area : "Productivity",
        done: false,
      }));
    }
  } catch {}

  return typeof generateDailyQuests === "function"
    ? generateDailyQuests(prefs)
    : [];
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState({
    name: "Player",
    level: 1,
    xp: 0,
    email: "",
  });

  const [areas, setAreas] = useState(
    AREAS.reduce((a, k) => ({ ...a, [k]: { xp: 0, level: 1 } }), {}),
  );

  const [quests, setQuests] = useState([]);
  const [quickQuests, setQuickQuests] = useState([]);
  const [todos, setTodos] = useState([]);

  const [prefs, setPrefs] = useState({
    areaDifficulty: AREAS.reduce((a, k) => ({ ...a, [k]: 2 }), {}),
    bannedTitles: {},
  });

  const [streak, setStreak] = useState(0);
  const [lastReset, setLastReset] = useState(null);
  const [history, setHistory] = useState({});
  const [events, setEvents] = useState({});
  const [recurring, setRecurring] = useState([]);
  const [badHabits, setBadHabits] = useState([]);

  const [reminder, setReminder] = useState({
    enabled: false,
    hour: 19,
    minute: 30,
    id: null,
  });

  const [weeklyGoals, setWeeklyGoals] = useState(DEFAULT_WEEKLY_GOALS);
  const [loading, setLoading] = useState(true);

  // ---------- Load ----------
  useEffect(() => {
    (async () => {
      try {
        const store = await getStorage();
        const s = await store.getAppState();

        if (s) {
          setProfile(normalizeProfile(s.profile ?? profile));
          setAreas(s.areas ?? areas);
          setQuests(s.quests ?? []);
          setQuickQuests(s.quickQuests ?? []);
          setTodos(s.todos ?? []);
          setPrefs(
            s.prefs ?? {
              areaDifficulty: AREAS.reduce((a, k) => ({ ...a, [k]: 2 }), {}),
              bannedTitles: {},
            },
          );
          setStreak(s.streak ?? 0);
          setLastReset(s.lastReset ?? null);
          setHistory(s.history ?? {});
          setEvents(s.events ?? {});
          setRecurring(s.recurring ?? []);
          setBadHabits(s.badHabits ?? []);
          setReminder(
            s.reminder ?? { enabled: false, hour: 19, minute: 30, id: null },
          );
          setWeeklyGoals(s.weeklyGoals ?? DEFAULT_WEEKLY_GOALS);
        } else {
          const t = todayISO();
          const initial = await fetchDailyQuestsOrFallback({
            dateISO: t,
            profile,
            prefs,
            history: {},
          });
          setQuests(initial);
          setLastReset(t);
          setQuickQuests([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Save ----------
  useEffect(() => {
    if (loading) return;

    (async () => {
      const store = await getStorage();
      await store.upsertAppState({
        profile,
        areas,
        quests,
        quickQuests,
        todos,
        prefs,
        streak,
        lastReset,
        history,
        events,
        recurring,
        badHabits,
        reminder,
        weeklyGoals,
      });
    })();
  }, [
    profile,
    areas,
    quests,
    quickQuests,
    todos,
    prefs,
    streak,
    lastReset,
    history,
    events,
    recurring,
    badHabits,
    reminder,
    weeklyGoals,
    loading,
  ]);

  // ---------- Daily reset (holt KI daily quests) ----------
  useEffect(() => {
    if (loading) return;

    const t = todayISO();
    if (!lastReset) {
      setLastReset(t);
      return;
    }

    if (lastReset !== t) {
      const prevDay = lastReset;
      const hadDone =
        (history?.[prevDay]?.completed ?? 0) > 0 || quests.some((q) => q.done);
      setStreak((s) => (hadDone ? s + 1 : 0));

      (async () => {
        const next = await fetchDailyQuestsOrFallback({
          dateISO: t,
          profile,
          prefs,
          history,
        });
        setQuests(next);
        setLastReset(t);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, lastReset]);

  // ---------- XP/History ----------
  function addXP(amount) {
    const gain = Math.max(0, Number(amount) || 0);
    if (!gain) return;

    setProfile((p) => {
      let lvl = Math.max(1, p.level || 1);
      let xp2 = Math.max(0, p.xp || 0) + gain;

      while (xp2 >= requiredXPForLevel(lvl)) {
        xp2 -= requiredXPForLevel(lvl);
        lvl += 1;
      }
      return { ...p, level: lvl, xp: xp2 };
    });
  }

  function recordHistoryCompletion(areaKey, gain) {
    const d = todayISO();
    setHistory((h) => {
      const cur = h[d] ?? { completed: 0, xp: 0, perArea: {} };
      const perArea = {
        ...cur.perArea,
        [areaKey]: (cur.perArea?.[areaKey] ?? 0) + 1,
      };
      return {
        ...h,
        [d]: { completed: cur.completed + 1, xp: cur.xp + gain, perArea },
      };
    });
  }

  // ---------- Daily quests ----------
  function completeQuest(id) {
    const q = quests.find((x) => x.id === id);
    if (!q || q.done) return;

    setQuests((prev) =>
      prev.map((x) => (x.id === id ? { ...x, done: true } : x)),
    );

    const gain = 1;
    addXP(gain);
    recordHistoryCompletion(q.area || "Productivity", gain);
  }

  function rateQuest(id, action) {
    const q = quests.find((x) => x.id === id);
    if (!q) return;

    if (action === "irrelevant") {
      setPrefs((p) => ({
        ...p,
        bannedTitles: { ...p.bannedTitles, [q.title]: true },
      }));
      return;
    }
    if (action === "delete") {
      setQuests((prev) => prev.filter((x) => x.id !== id));
      return;
    }

    // Optionales Lernsignal fürs Modell, auch wenn du keine difficulty im UI hast
    if (action === "like") {
      setPrefs((p) => ({
        ...p,
        areaDifficulty: {
          ...p.areaDifficulty,
          [q.area]: (p.areaDifficulty[q.area] ?? 2) + 0.2,
        },
      }));
      return;
    }
    if (action === "hard") {
      setPrefs((p) => ({
        ...p,
        areaDifficulty: {
          ...p.areaDifficulty,
          [q.area]: (p.areaDifficulty[q.area] ?? 2) - 0.4,
        },
      }));
      return;
    }
  }

  // ---------- Erinnerungen (Quick Quests) ----------
  function addQuickQuest(
    title,
    area = "Erinnerung",
    dueDateISO = null,
    origin = "manual",
  ) {
    const t = (title ?? "").trim();
    if (!t) return;

    const due = isISODate(dueDateISO) ? dueDateISO : null;
    const org = origin === "calendar" ? "calendar" : "manual";

    setQuickQuests((p) => [
      {
        id: `qq${Date.now()}`,
        title: t,
        area: area || "Erinnerung",
        createdAt: new Date().toISOString(),
        dueDateISO: due,
        origin: org,
        fromEvent: false,
        eventId: null,
      },
      ...p,
    ]);
  }

  function updateQuickQuest(id, patch) {
    setQuickQuests((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        const next = { ...x, ...patch };
        if ("dueDateISO" in patch)
          next.dueDateISO = isISODate(patch.dueDateISO)
            ? patch.dueDateISO
            : null;
        if ("title" in patch) next.title = String(next.title ?? "").trim();
        if ("origin" in patch)
          next.origin = patch.origin === "calendar" ? "calendar" : "manual";
        if (!next.title) return x;
        return next;
      }),
    );
  }

  function completeQuickQuest(id) {
    const q = quickQuests.find((x) => x.id === id);
    if (!q) return;

    setQuickQuests((p) => p.filter((x) => x.id !== id));

    const gain = 1;
    addXP(gain);
    recordHistoryCompletion(q.area || "Erinnerung", gain);
  }

  function removeQuickQuest(id) {
    setQuickQuests((p) => p.filter((x) => x.id !== id));
  }
  function deleteQuickQuest(id) {
    removeQuickQuest(id);
  }

  // ---------- Routinen (recurring) + Anti-Gewohnheiten (badHabits) ----------
  function getDueRecurringForDate(dateISO) {
    const wk = isoWeekKey(dateISO);
    const mk = monthKey(dateISO);
    const yk = yearKey(dateISO);
    const dow = getDow(dateISO);

    const out = [];

    for (const r of recurring) {
      if (!r || !r.id) continue;
      const kind = r.kind || "weekly";
      const times = Math.max(1, Math.min(14, Number(r.times || 1)));
      const doneLog = r.doneLog || {};

      if (kind === "daily") {
        if (!doneLog[dateISO])
          out.push({ ...r, _dueKind: "daily", _type: "recurring" });
        continue;
      }

      if (kind === "weekly") {
        const hasFixedDays = Array.isArray(r.weekDays) && r.weekDays.length > 0;
        if (hasFixedDays) {
          const isToday = r.weekDays.includes(dow);
          const doneToday = !!doneLog[dateISO];
          if (isToday && !doneToday)
            out.push({ ...r, _dueKind: "weekly_fixed", _type: "recurring" });
        } else {
          const doneCount = Number(doneLog[wk] || 0);
          if (doneCount < times)
            out.push({
              ...r,
              _dueKind: "weekly_quota",
              _type: "recurring",
              _remaining: times - doneCount,
            });
        }
        continue;
      }

      if (kind === "monthly") {
        const hasFixedDays =
          Array.isArray(r.monthDays) && r.monthDays.length > 0;
        const dayOfMonth = Number(dateISO.slice(8, 10));
        if (hasFixedDays) {
          const isToday = r.monthDays.includes(dayOfMonth);
          const doneToday = !!doneLog[dateISO];
          if (isToday && !doneToday)
            out.push({ ...r, _dueKind: "monthly_fixed", _type: "recurring" });
        } else {
          const doneCount = Number(doneLog[mk] || 0);
          if (doneCount < times)
            out.push({
              ...r,
              _dueKind: "monthly_quota",
              _type: "recurring",
              _remaining: times - doneCount,
            });
        }
        continue;
      }

      if (kind === "yearly") {
        const hasFixedDates =
          Array.isArray(r.yearDates) && r.yearDates.length > 0;
        const md = dateISO.slice(5, 10);
        if (hasFixedDates) {
          const isToday = r.yearDates.includes(md);
          const doneToday = !!doneLog[dateISO];
          if (isToday && !doneToday)
            out.push({ ...r, _dueKind: "yearly_fixed", _type: "recurring" });
        } else {
          const doneCount = Number(doneLog[yk] || 0);
          if (doneCount < times)
            out.push({
              ...r,
              _dueKind: "yearly_quota",
              _type: "recurring",
              _remaining: times - doneCount,
            });
        }
        continue;
      }
    }

    for (const b of badHabits) {
      if (!b || !b.id) continue;
      const doneLog = b.doneLog || {};
      if (doneLog[dateISO]) continue;

      const k = clampInt(b.intensity ?? 2, 1, 7);
      const seed = `${wk}::${b.id}`;
      const days = shuffleStable([0, 1, 2, 3, 4, 5, 6], seed)
        .slice(0, k)
        .sort((a, c) => a - c);

      if (days.includes(dow)) {
        out.push({
          id: b.id,
          title: `Don't do: ${b.title}`,
          area: b.area || "Wellbeing",
          intensity: k,
          _dueKind: "badhabit",
          _type: "badhabit",
        });
      }
    }

    return out;
  }

  function completeRecurringForToday(recurringId) {
    const dateISO = todayISO();
    const wk = isoWeekKey(dateISO);
    const mk = monthKey(dateISO);
    const yk = yearKey(dateISO);

    const r = recurring.find((x) => x.id === recurringId);
    if (!r) return;

    setRecurring((list) =>
      list.map((x) => {
        if (x.id !== recurringId) return x;
        const doneLog = { ...(x.doneLog || {}) };

        const kind = x.kind || "weekly";
        const times = Math.max(1, Math.min(14, Number(x.times || 1)));

        if (kind === "daily") doneLog[dateISO] = true;
        else if (kind === "weekly") {
          const hasFixedDays =
            Array.isArray(x.weekDays) && x.weekDays.length > 0;
          if (hasFixedDays) doneLog[dateISO] = true;
          else doneLog[wk] = Math.min(times, Number(doneLog[wk] || 0) + 1);
        } else if (kind === "monthly") {
          const hasFixedDays =
            Array.isArray(x.monthDays) && x.monthDays.length > 0;
          if (hasFixedDays) doneLog[dateISO] = true;
          else doneLog[mk] = Math.min(times, Number(doneLog[mk] || 0) + 1);
        } else if (kind === "yearly") {
          const hasFixedDates =
            Array.isArray(x.yearDates) && x.yearDates.length > 0;
          if (hasFixedDates) doneLog[dateISO] = true;
          else doneLog[yk] = Math.min(times, Number(doneLog[yk] || 0) + 1);
        } else doneLog[dateISO] = true;

        return { ...x, doneLog };
      }),
    );

    const gain = 1;
    addXP(gain);
    recordHistoryCompletion(r.area || "Productivity", gain);
  }

  function completeBadHabitForToday(badHabitId) {
    const dateISO = todayISO();
    const b = badHabits.find((x) => x.id === badHabitId);
    if (!b) return;

    setBadHabits((list) =>
      list.map((x) => {
        if (x.id !== badHabitId) return x;
        const doneLog = { ...(x.doneLog || {}) };
        doneLog[dateISO] = true;
        return { ...x, doneLog };
      }),
    );

    const gain = 1;
    addXP(gain);
    recordHistoryCompletion(b.area || "Wellbeing", gain);
  }

  function completeRoutineItemForToday(item) {
    if (!item) return;
    if (item._type === "badhabit") return completeBadHabitForToday(item.id);
    return completeRecurringForToday(item.id);
  }

  // ---------- Todos ----------
  function addTodo(title) {
    const t = (title ?? "").trim();
    if (!t) return;
    setTodos((p) => [...p, { id: `t${Date.now()}`, title: t, done: false }]);
  }
  function toggleTodo(id) {
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function removeTodo(id) {
    setTodos((p) => p.filter((t) => t.id !== id));
  }

  // ---------- Recurring CRUD ----------
  function addRecurring({
    title,
    kind,
    times = 1,
    area = "Productivity",
    weekDays,
    monthDays,
    yearDates,
    note,
  }) {
    setRecurring((p) => [
      ...p,
      {
        id: `r${Date.now()}`,
        title,
        kind,
        times,
        area,
        weekDays,
        monthDays,
        yearDates,
        note,
        doneLog: {},
      },
    ]);
  }

  function updateRecurring(id, patch) {
    setRecurring((list) =>
      list.map((x) =>
        x.id === id ? sanitizeRecurring({ ...x, ...patch }) : x,
      ),
    );
  }

  function removeRecurring(id) {
    setRecurring((p) => p.filter((x) => x.id !== id));
  }

  function sanitizeRecurring(r) {
    const t = Math.max(1, Math.min(14, Number(r.times || 1)));
    const k = ["daily", "weekly", "monthly", "yearly"].includes(r.kind)
      ? r.kind
      : "weekly";
    const a = AREAS.includes(r.area) ? r.area : "Productivity";

    const weekDays2 = Array.isArray(r.weekDays)
      ? [
          ...new Set(
            r.weekDays.map((n) => Number(n)).filter((n) => n >= 0 && n <= 6),
          ),
        ]
      : undefined;

    const monthDays2 = Array.isArray(r.monthDays)
      ? [
          ...new Set(
            r.monthDays.map((n) => Number(n)).filter((n) => n >= 1 && n <= 31),
          ),
        ]
      : undefined;

    const yearDates2 = Array.isArray(r.yearDates)
      ? [
          ...new Set(
            r.yearDates.map(String).filter((v) => /^\d{2}-\d{2}$/.test(v)),
          ),
        ]
      : undefined;

    const note2 =
      typeof r.note === "string" && r.note.trim()
        ? r.note.trim().slice(0, 1000)
        : undefined;

    return {
      ...r,
      times: t,
      kind: k,
      area: a,
      weekDays: weekDays2,
      monthDays: monthDays2,
      yearDates: yearDates2,
      note: note2,
      doneLog: r.doneLog || {},
    };
  }

  // ---------- BadHabits CRUD ----------
  function addBadHabit({ title, area = "Wellbeing", intensity = 2, note }) {
    const t = (title ?? "").trim();
    if (!t) return;
    const k = clampInt(intensity, 1, 7);
    const note2 =
      typeof note === "string" && note.trim()
        ? note.trim().slice(0, 1000)
        : undefined;

    setBadHabits((p) => [
      ...p,
      {
        id: `b${Date.now()}`,
        title: t,
        area,
        intensity: k,
        note: note2,
        doneLog: {},
      },
    ]);
  }

  function updateBadHabit(id, patch) {
    setBadHabits((list) =>
      list.map((x) => (x.id === id ? sanitizeBadHabit({ ...x, ...patch }) : x)),
    );
  }

  function removeBadHabit(id) {
    setBadHabits((p) => p.filter((x) => x.id !== id));
  }

  function sanitizeBadHabit(b) {
    const t = String(b.title ?? "").trim();
    if (!t) return b;
    const a = AREAS.includes(b.area) ? b.area : "Wellbeing";
    const k = clampInt(b.intensity ?? 2, 1, 7);
    const note2 =
      typeof b.note === "string" && b.note.trim()
        ? b.note.trim().slice(0, 1000)
        : undefined;
    return {
      ...b,
      title: t,
      area: a,
      intensity: k,
      note: note2,
      doneLog: b.doneLog || {},
    };
  }

  // ---------- Events -> Erinnerungen ----------
  function upsertEventReminder(ev, dateISO) {
    const reminderObj = buildEventReminder(ev, dateISO);
    setQuickQuests((list) => {
      const idx = list.findIndex((x) => x.id === reminderObj.id);
      if (idx === -1) return [reminderObj, ...list];
      const next = [...list];
      next[idx] = { ...next[idx], ...reminderObj };
      return next;
    });
  }

  function removeEventReminderByEventId(evId) {
    setQuickQuests((list) =>
      list.filter((x) => !(x.fromEvent && x.eventId === evId)),
    );
  }

  function addEvent({ title, dateISO, start, end, location, note }) {
    const dISO = isISODate(dateISO) ? dateISO : todayISO();
    const ev = { id: `e${Date.now()}`, title, start, end, location, note };

    setEvents((prev) => {
      const list = [...(prev[dISO] || []), ev];
      list.sort((a, b) =>
        String(a.start || "").localeCompare(String(b.start || "")),
      );
      return { ...prev, [dISO]: list };
    });

    upsertEventReminder(ev, dISO);
  }

  function updateEvent(dateISO, id, patch) {
    const dISO = isISODate(dateISO) ? dateISO : todayISO();
    let updatedEv = null;

    setEvents((prev) => {
      const list0 = prev[dISO] || [];
      const list = list0.map((ev) => {
        if (ev.id !== id) return ev;
        updatedEv = { ...ev, ...patch, id };
        return updatedEv;
      });
      list.sort((a, b) =>
        String(a.start || "").localeCompare(String(b.start || "")),
      );
      return { ...prev, [dISO]: list };
    });

    if (updatedEv) upsertEventReminder(updatedEv, dISO);
  }

  function moveEvent(oldDateISO, newDateISO, id, patch) {
    const oldD = isISODate(oldDateISO) ? oldDateISO : todayISO();
    const newD = isISODate(newDateISO) ? newDateISO : todayISO();
    let movedEv = null;

    setEvents((prev) => {
      const oldList = prev[oldD] || [];
      const ev = oldList.find((e) => e.id === id);
      if (!ev) return prev;

      const restOld = oldList.filter((e) => e.id !== id);
      movedEv = { ...ev, ...patch, id };

      const newList = [...(prev[newD] || []), movedEv];
      newList.sort((a, b) =>
        String(a.start || "").localeCompare(String(b.start || "")),
      );

      return { ...prev, [oldD]: restOld, [newD]: newList };
    });

    if (movedEv) upsertEventReminder(movedEv, newD);
  }

  function removeEvent(dateISO, id) {
    const dISO = isISODate(dateISO) ? dateISO : todayISO();

    setEvents((prev) => {
      const list = (prev[dISO] || []).filter((e) => e.id !== id);
      return { ...prev, [dISO]: list };
    });

    removeEventReminderByEventId(id);
  }

  // ---------- Manual reset (Test) ----------
  async function resetDay() {
    const t = todayISO();
    const prevDay = lastReset || t;
    const hadDone =
      (history?.[prevDay]?.completed ?? 0) > 0 || quests.some((q) => q.done);
    setStreak((s) => (prevDay !== t ? (hadDone ? s + 1 : 0) : s));

    const next = await fetchDailyQuestsOrFallback({
      dateISO: t,
      profile,
      prefs,
      history,
    });

    setQuests(next);
    setLastReset(t);
  }

  const value = useMemo(
    () => ({
      loading,
      profile,
      areas,
      quests,
      quickQuests,
      todos,
      prefs,
      streak,
      lastReset,
      history,
      events,
      recurring,
      badHabits,
      weeklyGoals,
      reminder,
      AREAS,

      setProfile,
      setQuests,
      setQuickQuests,
      setTodos,
      setRecurring,
      setBadHabits,
      setWeeklyGoals,
      setReminder,

      addXP,
      completeQuest,
      rateQuest,

      addQuickQuest,
      updateQuickQuest,
      completeQuickQuest,
      removeQuickQuest,
      deleteQuickQuest,

      getDueRecurringForDate,
      completeRecurringForToday,
      completeBadHabitForToday,
      completeRoutineItemForToday,

      addTodo,
      toggleTodo,
      removeTodo,

      addRecurring,
      updateRecurring,
      removeRecurring,

      addBadHabit,
      updateBadHabit,
      removeBadHabit,

      addEvent,
      updateEvent,
      moveEvent,
      removeEvent,

      resetDay,
    }),
    [
      loading,
      profile,
      areas,
      quests,
      quickQuests,
      todos,
      prefs,
      streak,
      lastReset,
      history,
      events,
      recurring,
      badHabits,
      weeklyGoals,
      reminder,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
