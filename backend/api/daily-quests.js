export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { dateISO } = req.body || {};
    if (!dateISO) return res.status(400).json({ error: "dateISO missing" });

    // TODO: später OpenAI call hier rein
    const quests = [
      { id: `ai_${dateISO}_1`, title: "10 Min. aufräumen", area: "Productivity", done: false },
      { id: `ai_${dateISO}_2`, title: "15 Min. Bewegung", area: "Body", done: false },
      { id: `ai_${dateISO}_3`, title: "10 Min. lernen/lesen", area: "Mind", done: false },
      { id: `ai_${dateISO}_4`, title: "Jemandem kurz schreiben", area: "Social", done: false },
      { id: `ai_${dateISO}_5`, title: "5 Min. Atemübung", area: "Wellbeing", done: false },
    ];

    return res.status(200).json({ quests });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
