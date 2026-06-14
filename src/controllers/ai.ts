import { Request, Response } from "express";

// ═══════════════════════════════════════════════════════
// POST /api/ai/mnemonic — DeepSeek AI 助记
// ═══════════════════════════════════════════════════════
export async function getMnemonic(req: Request, res: Response): Promise<void> {
  try {
    const { word, kana, meaning } = req.body;
    if (!word) { res.status(400).json({ error: "VALIDATION" }); return; }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) { res.status(503).json({ error: "AI not configured", hint: "Set DEEPSEEK_API_KEY env var" }); return; }

    const prompt = `你是一个幽默的日语记忆大师。请根据下面的日语单词，用中文创造一个搞笑、荒诞或有画面感的谐音记忆法。\n\n单词：${word}\n假名：${kana || "无"}\n释义：${meaning || "无"}\n\n要求：\n1. 用中文谐音联想记忆（如「食べる/taberu」→ "太白了，吃多点"）\n2. 简短有趣，50字以内\n3. 不要解释，直接给出记忆法`;

    const resp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    const data: any = await resp.json();
    const mnemonic = data?.choices?.[0]?.message?.content?.trim();

    res.json(mnemonic ? { mnemonic } : { mnemonic: "AI 暂时无法生成，请稍后重试" });
  } catch (err) {
    console.error("[mnemonic]", err);
    res.status(500).json({ error: "INTERNAL" });
  }
}
