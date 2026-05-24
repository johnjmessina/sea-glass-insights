import Anthropic from "@anthropic-ai/sdk";
import type { Order, AIDraft } from "@/lib/supabase";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY environment variable");
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateReportDraft(order: Order): Promise<AIDraft> {
  const intake = `
1. What is your business name and what do you sell or offer?
${order.q1 ?? "Not provided"}

2. How long have you been in business, and where are you located?
${order.q2 ?? "Not provided"}

3. Who is your ideal customer? (age, income, lifestyle, problem they have)
${order.q3 ?? "Not provided"}

4. Who are your top 2–3 competitors? (names, or describe them)
${order.q4 ?? "Not provided"}

5. What makes you different from those competitors?
${order.q5 ?? "Not provided"}

6. What is the biggest challenge you are facing right now?
${order.q6 ?? "Not provided"}

7. What does success look like for you in the next 12 months?
${order.q7 ?? "Not provided"}

8. What marketing are you currently doing, if any?
${order.q8 ?? "Not provided"}

9. What do you wish you knew about your market or customers that you don't know today?
${order.q9 ?? "Not provided"}

10. Is there anything else you want the report to focus on or address?
${order.q10 ?? "Not provided"}
`.trim();

  const systemPrompt = `You are a senior market research analyst at Sea Glass Insights, a boutique market research firm serving small businesses. Your job is to produce a professional, insightful market intelligence report based on the intake information provided.

Return ONLY a valid JSON object with EXACTLY this structure. No markdown. No code fences. No explanation. Raw JSON only.

{
  "snapshot": "2-3 paragraphs summarizing who the business is, what they offer, and their market context.",

  "customer_profile": [
    {
      "name": "Segment name (3-5 words)",
      "desc": "One sentence describing this customer type and why they buy.",
      "motivation": "The primary thing that motivates them to choose this business.",
      "key_need": "The single most important thing they need from this business."
    }
  ],

  "competitive_landscape": [
    {
      "name": "Competitor name or descriptor",
      "strength": "Their main competitive advantage in one clear sentence.",
      "edge": "How this business has a genuine, specific edge over them."
    }
  ],

  "positioning": {
    "strengths": [
      "Specific strength statement.",
      "Specific strength statement.",
      "Specific strength statement.",
      "Specific strength statement."
    ],
    "vulnerabilities": [
      "Specific vulnerability statement.",
      "Specific vulnerability statement.",
      "Specific vulnerability statement."
    ]
  },

  "insights": [
    {
      "title": "Short insight title (5-8 words)",
      "body": "2-3 sentences unpacking this insight and what it means for the business."
    }
  ],

  "recommendations": [
    {
      "title": "Short action-oriented title (5-8 words)",
      "body": "2-3 sentences explaining this recommendation and why it matters now."
    }
  ]
}

Requirements:
- customer_profile: 3-4 segments
- competitive_landscape: cover every competitor mentioned (min 2, max 5)
- positioning.strengths: exactly 4-5 items
- positioning.vulnerabilities: exactly 3-4 items
- insights: exactly 4-5 items
- recommendations: exactly 4 items

Tone: warm, credible, direct. No corporate jargon. No em-dashes. Write like a smart person, not a consulting firm.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Business intake data:\n\n${intake}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }

  // ── Validate structure ────────────────────────────────────────────────────
  if (typeof parsed.snapshot !== "string" || !parsed.snapshot)
    throw new Error("Missing or invalid: snapshot");

  if (!Array.isArray(parsed.customer_profile) || parsed.customer_profile.length < 2)
    throw new Error("Missing or invalid: customer_profile");

  if (!Array.isArray(parsed.competitive_landscape) || parsed.competitive_landscape.length < 1)
    throw new Error("Missing or invalid: competitive_landscape");

  if (
    !parsed.positioning ||
    typeof parsed.positioning !== "object" ||
    !Array.isArray((parsed.positioning as Record<string, unknown>).strengths) ||
    !Array.isArray((parsed.positioning as Record<string, unknown>).vulnerabilities)
  ) throw new Error("Missing or invalid: positioning");

  if (!Array.isArray(parsed.insights) || parsed.insights.length < 2)
    throw new Error("Missing or invalid: insights");

  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length < 1)
    throw new Error("Missing or invalid: recommendations");

  return parsed as unknown as AIDraft;
}
