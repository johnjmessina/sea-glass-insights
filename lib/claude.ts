import Anthropic from "@anthropic-ai/sdk";
import type { Order, AIDraft } from "@/lib/supabase";

export async function generateReportDraft(order: Order): Promise<AIDraft> {
  // Check inside the function so a missing key returns a clean JSON error
  // rather than crashing the module at load time and dropping the TCP connection.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

  const systemPrompt = `You are a senior market research analyst at Sea Glass Insights. Produce a professional market intelligence report from the intake data provided.

Return ONLY a valid JSON object with EXACTLY this structure. No markdown. No code fences. No explanation. Raw JSON only.

{
  "executive_summary": {
    "intro": "One warm, specific sentence placing this business in its market. No generic openers.",
    "bullets": [
      "Key finding: their most important market position insight.",
      "Main opportunity: the clearest growth opportunity available now.",
      "Biggest vulnerability: the most pressing risk or gap.",
      "Top priority action: the one thing to do first."
    ],
    "your_edge": "1-2 sentences on their key differentiator that competitors cannot easily replicate.",
    "priority_action": "1-2 sentences on the single most urgent action and why it matters."
  },

  "business_snapshot": {
    "business_name": "Business name as provided.",
    "location": "City, state or region.",
    "time_in_business": "How long operating.",
    "business_type": "Single phrase describing the type of business.",
    "primary_offering": "What they sell in one sentence.",
    "target_customer": "Who their ideal customer is in one sentence.",
    "top_competitors": ["Competitor 1", "Competitor 2"],
    "marketing_channels": ["Channel 1", "Channel 2"],
    "key_challenge": "Their biggest challenge in one sentence.",
    "success_goal": "What success looks like in one sentence."
  },

  "customer_profile": [
    {
      "name": "Segment name (3-5 words)",
      "desc": "One sentence: who they are and why they buy.",
      "motivation": "Their primary reason for choosing this business.",
      "key_need": "The one thing they most need from this business."
    }
  ],

  "competitive_landscape": [
    {
      "name": "Competitor name or descriptor",
      "strength": "Their main competitive advantage in one sentence.",
      "edge": "This business's genuine, specific advantage over them."
    }
  ],

  "positioning": {
    "strengths": ["Strength statement.", "Strength statement.", "Strength statement.", "Strength statement."],
    "vulnerabilities": ["Vulnerability statement.", "Vulnerability statement.", "Vulnerability statement."]
  },

  "insights": [
    {
      "title": "Insight title (5-8 words)",
      "body": "2-3 sentences on what this means and why it matters."
    }
  ],

  "recommendations": [
    {
      "title": "Action title (5-8 words)",
      "body": "2-3 sentences on the action and why it matters now.",
      "priority": 1
    }
  ]
}

Requirements:
- customer_profile: 3-4 segments
- competitive_landscape: cover every competitor mentioned (min 2, max 5)
- positioning.strengths: 4-5 items
- positioning.vulnerabilities: 3-4 items
- insights: 4-5 items
- recommendations: 4 items, ordered by impact. Each has a priority of 1 (do first: highest impact for the effort), 2 (do next) or 3 (longer-term). Use at least one priority 1 and no more than two.

Tone: warm, credible, direct. No corporate jargon. No em-dashes. Write like a smart person, not a consulting firm.`;

  // Use streaming so the outbound TCP connection stays active during generation.
  // Non-streaming holds an idle connection for 80+ seconds, which Vercel's network
  // layer kills before the response arrives (TypeError: fetch failed).
  const message = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Business intake data:\n\n${intake}`,
      },
    ],
  }).finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "Report generation hit the token limit before completing. " +
      "The response was truncated — please try generating again."
    );
  }

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
    const looksLikeTruncation = cleaned.length > 200 && !cleaned.trimEnd().endsWith("}");
    const hint = looksLikeTruncation
      ? " (response appears truncated — try generating again)"
      : "";
    throw new Error(`Claude returned invalid JSON${hint}: ${cleaned.slice(0, 400)}`);
  }

  // ── Validate structure ────────────────────────────────────────────────────
  const es = parsed.executive_summary as Record<string, unknown> | undefined;
  if (!es || typeof es !== "object" ||
      typeof es.intro !== "string" || !es.intro ||
      !Array.isArray(es.bullets) || es.bullets.length < 3 ||
      typeof es.your_edge !== "string" || !es.your_edge ||
      typeof es.priority_action !== "string" || !es.priority_action)
    throw new Error("Missing or invalid: executive_summary");

  if (!parsed.business_snapshot || typeof parsed.business_snapshot !== "object")
    throw new Error("Missing or invalid: business_snapshot");

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
