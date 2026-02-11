// backend/api/quest-help.js
export default async function handler(req, res) {
  // CORS (schadet nicht)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });

    const { action, quest, profile } = req.body || {};
    const a = String(action || "").trim();

    const allowed = new Set(["explain", "steps", "easier", "harder"]);
    if (!allowed.has(a)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const title = String(quest?.title || "")
      .trim()
      .slice(0, 120);
    const area = String(quest?.area || "")
      .trim()
      .slice(0, 40);

    if (!title) return res.status(400).json({ error: "Missing quest.title" });

    const p = profile || {};
    const ctx = {
      name: p?.name || null,
      age: typeof p?.age === "number" ? p.age : (p?.age ?? null),
      goals: Array.isArray(p?.goals) ? p.goals.slice(0, 12) : [],
      interests: Array.isArray(p?.interests) ? p.interests.slice(0, 12) : [],
      personality: Array.isArray(p?.personality)
        ? p.personality.slice(0, 12)
        : [],
      others: Array.isArray(p?.others) ? p.others.slice(0, 12) : [],
    };

    const system = `
You are "LifeXP Quest Helper".
Language: German (Du-Form). Be short, clear, practical.
No therapy/medical advice. No illegal/dangerous guidance.

You help the user understand and execute ONE quest.

Return ONLY valid JSON. No markdown. No extra text.

JSON schema:
{
  "action": "explain|steps|easier|harder",
  "title": "...",
  "area": "...",
  "text": "short helpful answer",
  "steps": ["..."] // only if action === "steps"
}
`.trim();

    const user = {
      action: a,
      quest: { title, area },
      user: ctx,
      rules: {
        explain:
          "Explain in 2-4 sentences, include 1 concrete example tailored to the quest.",
        steps:
          "Return exactly 4-7 steps. Each step is one short sentence, actionable.",
        easier:
          "Rewrite the quest into a clearly easier version. Keep it meaningful but simpler. One sentence + 1 micro-step.",
        harder:
          "Rewrite the quest into a clearly harder version. Keep it realistic. One sentence + 1 micro-step.",
      },
    };

    // Map action -> slight instruction emphasis
    const actionHint =
      a === "explain"
        ? "User wants explanation."
        : a === "steps"
          ? "User wants step-by-step plan."
          : a === "easier"
            ? "User wants an easier variant."
            : "User wants a harder variant.";

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 450,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `${actionHint}\n\n${JSON.stringify(user)}` },
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
      return res
        .status(502)
        .json({ error: "OpenAI error", detail: raw.slice(0, 2000) });
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
      return res
        .status(502)
        .json({
          error: "Model did not return valid JSON",
          detail: content.slice(0, 2000),
        });
    }

    // Minimal validation / cleanup
    const text = String(out?.text || "")
      .trim()
      .slice(0, 900);
    const steps =
      a === "steps" && Array.isArray(out?.steps)
        ? out.steps
            .map((s) => String(s || "").trim())
            .filter(Boolean)
            .slice(0, 8)
        : undefined;

    if (!text) {
      return res.status(502).json({ error: "Empty text from model" });
    }
    if (a === "steps" && (!steps || steps.length < 3)) {
      return res.status(502).json({ error: "Invalid steps from model" });
    }

    return res.status(200).json({
      action: a,
      title,
      area,
      text,
      steps,
      updatedAt: Date.now(),
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Server error", detail: String(e?.message || e) });
  }
}
