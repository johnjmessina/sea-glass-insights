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

  const systemPrompt = `You are a senior market research analyst at Sea Glass Insights, a boutique market research firm serving small businesses. Your job is to produce a professional, insightful market intelligence report based on the following business intake information.

The report must have exactly these six sections:
1. Business Snapshot — summarize who the business is and what they do
2. Customer Profile — identify 3-4 distinct customer segments with motivations, spend patterns, and key needs
3. Competitive Landscape — analyze the competitors mentioned and identify the business's edges
4. Market Positioning — assess strengths and vulnerabilities
5. Key Insights — 4-5 numbered analyst insights, the "so what" behind the data
6. Recommendations — exactly 4 recommendations, ordered by impact and feasibility

Tone: warm, credible, direct. No corporate jargon. No em-dashes. Write like a smart person, not a consulting firm.

Return ONLY a valid JSON object with exactly these keys: snapshot, customer_profile, competitive_landscape, positioning, insights, recommendations. No markdown, no code fences, no explanation — just the raw JSON object.`;

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
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  // Normalize: Claude sometimes returns arrays for list-heavy sections.
  // Join them into numbered strings so the rest of the app always sees strings.
  const normalize = (v: unknown): string => {
    if (Array.isArray(v)) {
      return v.map((item, i) => `${i + 1}. ${item}`).join("\n\n");
    }
    return String(v ?? "");
  };

  const draft: AIDraft = {
    snapshot:              normalize(parsed.snapshot),
    customer_profile:      normalize(parsed.customer_profile),
    competitive_landscape: normalize(parsed.competitive_landscape),
    positioning:           normalize(parsed.positioning),
    insights:              normalize(parsed.insights),
    recommendations:       normalize(parsed.recommendations),
  };

  // Validate all six keys are present and non-empty
  const required: (keyof AIDraft)[] = [
    "snapshot", "customer_profile", "competitive_landscape",
    "positioning", "insights", "recommendations",
  ];
  for (const key of required) {
    if (!draft[key]) throw new Error(`Missing section: ${key}`);
  }

  return draft;
}
