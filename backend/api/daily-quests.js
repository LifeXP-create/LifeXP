// backend/api/daily-quests.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const { profile, prefs, historySummary, dateISO, context } = req.body || {};

    const safeDate =
      typeof dateISO === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)
        ? dateISO
        : new Date().toISOString().slice(0, 10);

    const bannedTitles =
      prefs?.bannedTitles && typeof prefs.bannedTitles === "object"
        ? Object.keys(prefs.bannedTitles).slice(0, 300)
        : [];

    const allowedAreas = [
      "Body",
      "Mind",
      "Social",
      "Productivity",
      "Wellbeing",
    ];

    // Hard blocklist: verhindert immer gleiche "Standard-Quests"
    const forbiddenGeneric = [
      "10 min. aufräumen",
      "15 min. bewegung",
      "10 min. lernen/lesen",
      "10 min. lesen",
      "jemandem kurz schreiben",
      "jemandem schreiben",
      "atemübung",
      "meditation",
      "spaziergang",
      "wasser trinken",
      "schlafroutine planen",
      "digital detox",
    ];

    const system = `
You generate personalized daily quests for a self-improvement app called LifeXP.

Return ONLY valid JSON. No markdown. No extra text.

ABSOLUTE RULES:
- Create exactly 5 quests (4 normal + 1 bonus).
- Each quest has: title, area
- area must be one of: Body, Mind, Social, Productivity, Wellbeing
- Language: German (du-Form). Titles must be short, concrete, actionable.
- Avoid medical/therapy advice. Avoid dangerous or illegal tasks.
- Avoid duplicates and near-duplicates.
- Avoid any banned titles.
- Avoid generic "default tasks" that could fit anyone.

VARIATION RULES:
- Use dateISO as a creativity seed. Today must NOT feel like yesterday.
- Use the user's goals/interests/personality/others when available.
- If user data is empty, still avoid generic defaults and vary tasks.

FORBIDDEN DEFAULT TITLES:
${forbiddenGeneric.map((x) => `- ${x}`).join("\n")}

Output JSON schema:
{
  "dateISO": "YYYY-MM-DD",
  "quests": [
    { "title": "...", "area": "Body|Mind|Social|Productivity|Wellbeing" }
  ]
}
`.trim();

    const userPayload = {
      seed: safeDate,
      instruction: `Erstelle Quests für ${safeDate}. Sie müssen sich klar von anderen Tagen unterscheiden.`,
      dateISO: safeDate,
      profile: {
        name: profile?.name || null,
        age: profile?.age ?? null,
        gender: profile?.gender || null,
        goals: Array.isArray(profile?.goals) ? profile.goals.slice(0, 20) : [],
        interests: Array.isArray(profile?.interests)
          ? profile.interests.slice(0, 20)
          : [],
        personality: Array.isArray(profile?.personality)
          ? profile.personality.slice(0, 20)
          : [],
        others: Array.isArray(profile?.others)
          ? profile.others.slice(0, 20)
          : [],
      },
      prefs: {
        bannedTitles,
        forbiddenGeneric,
      },
      historySummary: Array.isArray(historySummary)
        ? historySummary.slice(0, 14)
        : [],
      context: context
        ? {
            weekday: context.weekday ?? null,
            hasManyEventsToday: !!context.hasManyEventsToday,
            timeBudgetHint: context.timeBudgetHint ?? null, // "low|medium|high" optional
          }
        : null,
      rules: { allowedAreas },
    };

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 650,
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
    if (!r.ok) {
      return res.status(502).json({ error: "OpenAI error", detail: raw });
    }

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
      return res.status(502).json({
        error: "Model did not return valid JSON",
        detail: content,
      });
    }

    const quests = Array.isArray(out?.quests) ? out.quests : [];
    const areaSet = new Set(allowedAreas);

    const cleaned = quests
      .filter((q) => q && typeof q.title === "string" && areaSet.has(q.area))
      .slice(0, 5)
      .map((q, idx) => ({
        id: `ai_${safeDate}_${idx + 1}`,
        title: q.title.trim().slice(0, 80),
        area: q.area,
        done: false,
      }));

    if (cleaned.length !== 5) {
      return res.status(502).json({
        error: "Invalid quest count from model",
        got: cleaned.length,
      });
    }

    const norm = (t) => t.toLowerCase().replace(/\s+/g, " ").trim();
    const seen = new Set();

    for (const q of cleaned) {
      const k = norm(q.title);

      if (seen.has(k)) {
        return res.status(502).json({ error: "Duplicate titles from model" });
      }
      if (bannedTitles.some((b) => norm(b) === k)) {
        return res.status(502).json({ error: "Banned title returned" });
      }
      if (forbiddenGeneric.some((g) => norm(g) === k)) {
        return res
          .status(502)
          .json({ error: "Generic default title returned" });
      }

      seen.add(k);
    }

    return res.status(200).json({ dateISO: safeDate, quests: cleaned });
  } catch (e) {
    return res.status(500).json({
      error: "Server error",
      detail: String(e?.message || e),
    });
  }
}
