// backend/api/daily-quests.js
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });

    const { profile, prefs, historySummary, dateISO } = req.body || {};

    const safeDate =
      typeof dateISO === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)
        ? dateISO
        : new Date().toISOString().slice(0, 10);

    const allowedAreas = [
      "Body",
      "Mind",
      "Social",
      "Productivity",
      "Wellbeing",
    ];
    const areaSet = new Set(allowedAreas);

    const bannedTitles =
      prefs?.bannedTitles && typeof prefs.bannedTitles === "object"
        ? Object.keys(prefs.bannedTitles).slice(0, 400)
        : [];

    // Basic stuff ist erlaubt (und 1/Tag sinnvoll).
    const BASIC_KEYWORDS = [
      "wasser",
      "spazier",
      "gehen",
      "meditation",
      "atem",
      "dehnen",
      "mobility",
      "stretch",
      "schlaf",
      "routine",
      "offline",
      "tagebuch",
      "journal",
    ];

    // Outcome/Resultat-Quests ohne Mini-Step sind Müll ("verdiene 5€", "mach 1000 Follower", etc.)
    const OUTCOME_PATTERNS = [
      /\b(\d+)\s*(€|eur|chf)\b/i,
      /\bverdien(e|en|st|t)?\b/i,
      /\bverkauf(e|en|st|t)?\b/i,
      /\b(kund(en)?|client(s)?)\b/i,
      /\b(follower|abonnenten|subscriber)\b/i,
      /\b(viral|reich|million)\b/i,
    ];

    // "Lernen" ist ok, aber nur wenn gleichzeitig klar ist WIE (Mini-Step)
    const LEARN_PATTERN =
      /\b(l[eä]rn(e|en|st|t)?|übe|trainier(e|en|st|t)?|verbesser(e|n)?)\b/i;

    // Wenn diese Marker drin sind, ist es fast sicher "heute machbar"
    const MICROSTEP_MARKERS = [
      "10 min",
      "15 min",
      "20 min",
      "25 min",
      "30 min",
      "min.",
      "minute",
      "timer",
      "liste",
      "checkliste",
      "notizen",
      "skizze",
      "plan",
      "outline",
      "konzept",
      "entwurf",
      "1 seite",
      "3 punkte",
      "5 punkte",
      "video",
      "tutorial",
      "anleitung",
      "übungen",
      "wiederhol",
      "fragen",
      "feedback",
    ];

    function norm(t) {
      return String(t || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }
    function hasMicroStep(title) {
      const t = norm(title);
      return MICROSTEP_MARKERS.some((m) => t.includes(m));
    }
    function isBasic(title) {
      const t = norm(title);
      return BASIC_KEYWORDS.some((k) => t.includes(k));
    }
    function looksLikeOutcomeOnly(title) {
      const hit = OUTCOME_PATTERNS.some((re) => re.test(String(title || "")));
      if (!hit) return false;
      return !hasMicroStep(title);
    }
    function learnWithoutMethod(title) {
      const t = String(title || "");
      if (!LEARN_PATTERN.test(t)) return false;
      // Lernen/Üben ist ok, wenn es als Micro-Step beschrieben ist
      return !hasMicroStep(t);
    }
    function tooVague(title) {
      const t = norm(title);
      if (t.length < 10) return true;
      if (hasMicroStep(t)) return false;

      // Ohne Zeitangabe muss zumindest ein Output drin sein
      const outputWords = [
        "plan",
        "liste",
        "notiz",
        "skizze",
        "outline",
        "konzept",
        "entwurf",
        "check",
      ];
      const hasOutput = outputWords.some((w) => t.includes(w));
      return !hasOutput;
    }

    function makeBasicQuest(seedIdx = 0) {
      const pool = [
        {
          area: "Body",
          title: "2L Wasser über den Tag verteilt (3 Check-ins)",
        },
        {
          area: "Wellbeing",
          title: "10 Min. Atemübung oder Meditation (Timer)",
        },
        { area: "Body", title: "15 Min. Spaziergang (ohne Handy)" },
        { area: "Wellbeing", title: "10 Min. Dehnen/Mobility" },
        {
          area: "Productivity",
          title: "5 Min. Tagesplan: 3 wichtigste Aufgaben notieren",
        },
      ];
      return pool[Math.abs(seedIdx) % pool.length];
    }

    // KI: weniger kreativ, härter eingeschränkt, generisch.
    const system = `
You generate daily quests for a general self-improvement app.
Return ONLY valid JSON. No markdown.

HARD RULES:
- Exactly 5 quests.
- Each quest: { "title": "...", "area": "Body|Mind|Social|Productivity|Wellbeing" }
- Language: German (du-Form).
- Titles must be short, concrete, and actionable.

REALISM (VERY IMPORTANT):
- Every quest must be doable TODAY in 5–30 minutes.
- Avoid outcome-based goals that depend on external results (money earned, followers gained, customers acquired, courses "started" as a vague goal).
- If a quest involves learning/improving a skill, it MUST include a clear mini-step (e.g., 10–20 min tutorial + 5 min practice + quick notes).
- Projects/business are allowed ONLY as a today mini-step (plan/outline/draft/checklist), never as "make money today".

BASICS:
- Basic habits are allowed and valuable (water, short walk, stretching, meditation/breathing, sleep routine, journaling).
- Include at least ONE basic habit quest among the 5.

BANNED:
- Never output titles listed in bannedTitles.
- Avoid medical/therapy advice. No dangerous or illegal tasks.

OUTPUT:
{ "dateISO": "YYYY-MM-DD", "quests": [ { "title": "...", "area": "..." } ] }
`.trim();

    const userPayload = {
      seed: safeDate,
      dateISO: safeDate,
      bannedTitles,
      profile: {
        name: profile?.name || null,
        age: profile?.age ?? null,
        goals: Array.isArray(profile?.goals) ? profile.goals.slice(0, 25) : [],
        interests: Array.isArray(profile?.interests)
          ? profile.interests.slice(0, 25)
          : [],
      },
      historySummary: Array.isArray(historySummary)
        ? historySummary.slice(0, 14)
        : [],
      allowedAreas,
    };

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.35, // <-- weniger kreativ
      max_tokens: 520,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await r.text();
    if (!r.ok)
      return res.status(502).json({ error: "OpenAI error", detail: raw });

    let content = "";
    try {
      const j = JSON.parse(raw);
      content = j?.choices?.[0]?.message?.content || "";
    } catch {
      return res.status(502).json({ error: "Bad OpenAI response" });
    }

    content = String(content)
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    let out;
    try {
      out = JSON.parse(content);
    } catch {
      return res
        .status(502)
        .json({ error: "Model did not return valid JSON", detail: content });
    }

    const quests = Array.isArray(out?.quests) ? out.quests : [];
    const bannedNorm = new Set(bannedTitles.map((t) => norm(t)));
    const seen = new Set();

    let cleaned = quests
      .filter((q) => q && typeof q.title === "string" && areaSet.has(q.area))
      .slice(0, 10)
      .map((q) => ({
        title: String(q.title || "")
          .trim()
          .slice(0, 96),
        area: q.area,
      }))
      .filter((q) => {
        const k = norm(q.title);
        if (!k) return false;
        if (seen.has(k)) return false;
        if (bannedNorm.has(k)) return false;

        if (looksLikeOutcomeOnly(q.title)) return false;
        if (learnWithoutMethod(q.title)) return false;
        if (tooVague(q.title)) return false;

        seen.add(k);
        return true;
      });

    // 1 Basic pro Tag erzwingen
    const hasBasic = cleaned.some((q) => isBasic(q.title));
    if (!hasBasic) {
      const b = makeBasicQuest(Number(String(safeDate).slice(-2)) || 0);
      cleaned.unshift(b);
    }

    cleaned = cleaned.slice(0, 5);

    if (cleaned.length !== 5) {
      return res.status(502).json({
        error: "Invalid quest count after filtering",
        got: cleaned.length,
      });
    }

    const finalQuests = cleaned.map((q, idx) => ({
      id: `ai_${safeDate}_${idx + 1}`,
      title: q.title,
      area: q.area,
      done: false,
    }));

    return res.status(200).json({ dateISO: safeDate, quests: finalQuests });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Server error", detail: String(e?.message || e) });
  }
}
