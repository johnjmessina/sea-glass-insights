import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { businessName, location } = await req.json();

    if (!businessName) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    const prompt = `You are a market researcher preparing a Business Pulse teaser card for ${businessName}, located in ${location || "an unspecified location"}. Generate 3 sharp, specific observations about this business that would resonate with the owner. Each observation should have: a short category label (2-3 words), a compelling title (one sentence that names the insight), and a body paragraph (2-3 sentences that explain the insight with specificity). Avoid em dashes. Use commas, periods, or conjunctions instead. Format as JSON only — no other text: { "observations": [{ "label": "", "title": "", "body": "" }, { "label": "", "title": "", "body": "" }, { "label": "", "title": "", "body": "" }] }`;

    const message = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 1024,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { observations: { label: string; title: string; body: string }[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Claude non-JSON response:", cleaned.slice(0, 300));
      return NextResponse.json({ error: "Unexpected response format. Try again." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-pulse error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
