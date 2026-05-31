import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { businessName, label, title, body, notes } = await req.json();

    if (!businessName || !title) {
      return NextResponse.json({ error: "businessName and title are required." }, { status: 400 });
    }

    const prompt = `Rewrite this Business Pulse observation for ${businessName}, incorporating the analyst's notes. The output is for a small printed 4x6 card.

Current: Label: ${label} | Title: ${title} | Body: ${body}
Analyst notes: ${notes || "(no additional notes — sharpen and improve the existing content)"}

Requirements:
- Label: 2-3 words maximum
- Title: One punchy sentence, 10 words maximum
- Body: 2 sentences maximum, tight and specific

Do not use em dashes. Use commas, periods, or conjunctions instead.
Return JSON only, no other text: { "label": "", "title": "", "body": "" }`;

    const message = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 512,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { label: string; title: string; body: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Claude non-JSON response:", cleaned.slice(0, 300));
      return NextResponse.json({ error: "Unexpected response format. Try again." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("regenerate-observation error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
