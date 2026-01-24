export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { messages, temperature = 0.4, max_tokens = 450 } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing messages" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Server misconfigured: missing OPENAI_API_KEY" });
      return;
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature,
        max_tokens,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).send(text);
      return;
    }

    const json = JSON.parse(text);
    const answer = json?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ answer });
  } catch (e) {
    res.status(500).json({ error: "Internal error", details: String(e?.message || e) });
  }
}
