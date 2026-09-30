import Anthropic from "@anthropic-ai/sdk";
import type { Order } from "@/lib/supabase";
import { MIR_GENERATION_ORDER, MIR_SECTION_LABELS, type MirSectionKey } from "@/lib/mirSections";

// ── MIR generation — one API call per section ─────────────────────────────────
// The report used to be generated in one large call whose JSON regularly got
// truncated. Each section is now its own small call (driven from the dashboard
// through /api/generate-mir-section), so no single response comes near the
// output limit, and a failed section can be retried on its own.

const MODEL = "claude-sonnet-4-6";

// Generous for a single section; the largest (insights, recommendations) runs
// well under 2k tokens. Streaming keeps the connection active, so the ceiling
// costs nothing unless it is used.
const SECTION_MAX_TOKENS = 8000;

const ANALYST = "You are a senior market research analyst at Sea Glass Insights.";

const TONE = "Tone: warm, credible, direct. No corporate jargon. No em-dashes. Write like a smart person, not a consulting firm.";

const JSON_ONLY = "Return ONLY valid JSON in exactly the format below. No markdown. No code fences. No explanation. Raw JSON only.";

type SectionSpec = {
  format: string;                                   // JSON shape + requirements
  validate: (v: unknown) => string | null;          // error message, or null if valid
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const arrayOf = (v: unknown, min: number, item: (x: unknown) => boolean) =>
  Array.isArray(v) && v.length >= min && v.every(item);

const SECTION_SPECS: Record<MirSectionKey, SectionSpec> = {
  executive_summary: {
    format: `{
  "intro": "One warm, specific sentence placing this business in its market. No generic openers.",
  "bullets": [
    "Key finding: their most important market position insight.",
    "Main opportunity: the clearest growth opportunity available now.",
    "Biggest vulnerability: the most pressing risk or gap.",
    "Top priority action: the one thing to do first."
  ],
  "your_edge": "1-2 sentences on their key differentiator that competitors cannot easily replicate.",
  "priority_action": "1-2 sentences on the single most urgent action and why it matters."
}
The executive summary must agree with the report sections provided: draw the finding, opportunity, vulnerability and priority action from them.`,
    validate: v =>
      isObj(v) && isStr(v.intro) && arrayOf(v.bullets, 3, isStr) && isStr(v.your_edge) && isStr(v.priority_action)
        ? null : "expected { intro, bullets[3+], your_edge, priority_action }",
  },

  business_snapshot: {
    format: `{
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
}`,
    validate: v =>
      isObj(v) && isStr(v.business_name) && Array.isArray(v.top_competitors) && Array.isArray(v.marketing_channels)
        ? null : "expected a snapshot object with business_name, top_competitors[] and marketing_channels[]",
  },

  customer_profile: {
    format: `[
  {
    "name": "Segment name (3-5 words)",
    "desc": "One sentence: who they are and why they buy.",
    "motivation": "Their primary reason for choosing this business.",
    "key_need": "The one thing they most need from this business."
  }
]
Requirements: 3-4 segments.`,
    validate: v =>
      arrayOf(v, 2, s => isObj(s) && isStr(s.name) && isStr(s.desc))
        ? null : "expected an array of 2+ segments with name and desc",
  },

  competitive_landscape: {
    format: `[
  {
    "name": "Competitor name or descriptor",
    "strength": "Their main competitive advantage in one sentence.",
    "edge": "This business's genuine, specific advantage over them."
  }
]
Requirements: cover every competitor mentioned (min 2, max 5).`,
    validate: v =>
      arrayOf(v, 1, c => isObj(c) && isStr(c.name))
        ? null : "expected an array of 1+ competitors with name",
  },

  positioning: {
    format: `{
  "strengths": ["Strength statement.", "Strength statement.", "Strength statement.", "Strength statement."],
  "vulnerabilities": ["Vulnerability statement.", "Vulnerability statement.", "Vulnerability statement."]
}
Requirements: 4-5 strengths, 3-4 vulnerabilities.`,
    validate: v =>
      isObj(v) && arrayOf(v.strengths, 1, isStr) && arrayOf(v.vulnerabilities, 1, isStr)
        ? null : "expected { strengths[], vulnerabilities[] } of strings",
  },

  insights: {
    format: `[
  {
    "title": "Insight title (5-8 words)",
    "body": "2-3 sentences on what this means and why it matters."
  }
]
Requirements: 4-5 insights.`,
    validate: v =>
      arrayOf(v, 2, i => isObj(i) && isStr(i.title) && isStr(i.body))
        ? null : "expected an array of 2+ insights with title and body",
  },

  recommendations: {
    format: `[
  {
    "title": "Action title (5-8 words)",
    "body": "2-3 sentences on the action and why it matters now.",
    "priority": 1
  }
]
Requirements: 4 recommendations, ordered by impact. Each has a priority of 1 (do first: highest impact for the effort), 2 (do next) or 3 (longer-term). Use at least one priority 1 and no more than two.`,
    validate: v =>
      arrayOf(v, 1, r => isObj(r) && isStr(r.title) && isStr(r.body))
        ? null : "expected an array of 1+ recommendations with title and body",
  },
};

function mirIntake(order: Order): string {
  return `
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
}

// Sections that come before `key` in generation order and already exist in
// the draft — passed to the model so the report stays consistent.
function priorSectionsContext(key: MirSectionKey, draft: Record<string, unknown>): string {
  const prior = MIR_GENERATION_ORDER
    .slice(0, MIR_GENERATION_ORDER.indexOf(key))
    .filter(k => draft[k] !== undefined && draft[k] !== null);
  if (prior.length === 0) return "";
  const body = prior
    .map(k => `### ${MIR_SECTION_LABELS[k]} (${k})\n${JSON.stringify(draft[k], null, 2)}`)
    .join("\n\n");
  return `\n\nREPORT SECTIONS ALREADY WRITTEN (stay consistent with these; do not repeat them verbatim):\n\n${body}`;
}

// One streamed call returning the response text. Streaming keeps the outbound
// connection active, which Vercel's network layer otherwise kills on long idle
// requests (TypeError: fetch failed). `label` names the section in errors.
async function callModel(label: string, system: string, user: string): Promise<string> {
  // Checked here so a missing key returns a clean JSON error instead of
  // crashing the module at load time.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.stream({
    model: MODEL,
    max_tokens: SECTION_MAX_TOKENS,
    system,
    messages: [{ role: "user", content: user }],
  }).finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error(`${label}: the response hit the token limit before finishing. Retry this section.`);
  }
  if (message.stop_reason === "refusal") {
    throw new Error(`${label}: the model declined to write this section. Retry, or adjust the analyst notes.`);
  }

  return message.content
    .map(b => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

// One call that must return a valid JSON value for `key`
async function callForSection(key: MirSectionKey, system: string, user: string): Promise<unknown> {
  const label = MIR_SECTION_LABELS[key];
  const raw   = await callModel(label, system, user);

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`${label}: Claude returned invalid JSON. Retry this section. Received: ${cleaned.slice(0, 200)}`);
  }

  const problem = SECTION_SPECS[key].validate(parsed);
  if (problem) {
    throw new Error(`${label}: unexpected format (${problem}). Retry this section.`);
  }
  return parsed;
}

/**
 * Generate one MIR section from the intake answers. `draft` is the order's
 * current ai_draft; the sections before `key` in MIR_GENERATION_ORDER are
 * given to the model as context.
 */
export async function generateMIRSection(
  order: Order,
  key: MirSectionKey,
  draft: Record<string, unknown>,
): Promise<unknown> {
  const system = `${ANALYST} You are writing one section of a professional market intelligence report from the intake data provided: the ${MIR_SECTION_LABELS[key]} section.

${JSON_ONLY}

${SECTION_SPECS[key].format}

${TONE}`;

  const user = `Business intake data:\n\n${mirIntake(order)}${priorSectionsContext(key, draft)}`;

  return callForSection(key, system, user);
}

/**
 * Revise one existing MIR section using the analyst's notes. Uses the same
 * format and validation as generation, so a regenerated section always has
 * the shape the report generator expects.
 */
export async function regenerateMIRSection(
  order: Order,
  key: MirSectionKey,
  draft: Record<string, unknown>,
  analystNotes: string | undefined,
): Promise<unknown> {
  const system = `${ANALYST} The ${MIR_SECTION_LABELS[key]} section below was generated from a business intake form. The analyst has reviewed it and provided notes. Revise the section to incorporate the analyst's guidance while keeping the professional tone and the exact format.

${JSON_ONLY}

${SECTION_SPECS[key].format}

${TONE}`;

  const user = `Business intake data:\n\n${mirIntake(order)}${priorSectionsContext(key, draft)}

CURRENT SECTION (${key}):
${JSON.stringify(draft[key] ?? null, null, 2)}

ANALYST NOTES:
${analystNotes?.trim() || "(no notes — improve and sharpen the existing content)"}`;

  return callForSection(key, system, user);
}

// ── Analyst Note ──────────────────────────────────────────────────────────────
// A personal note from the analyst that opens the conversation with the
// client, like a cover letter inside the report. Drafted from the intake and
// the finished report; the analyst edits it in the dashboard before sending.
// The PDF adds the signature, so the note has no sign-off.

const ANALYST_NOTE_SYSTEM = `You are John Messina, founder and lead analyst at Sea Glass Insights, a small market research firm. You have just finished a market intelligence report for a client, and you are writing the personal note that closes it. Think of it as the cover letter inside the report.

Write 2 to 3 short paragraphs, in the first person, as John:
- Refer to the business by name, and you may open by addressing the client by first name.
- Say what stands out to you about their situation: something specific to this business, not a general observation about small businesses.
- Share what you found most interesting or surprising while working through their answers and the research. Draw only on the intake answers and the report sections provided; do not invent facts, numbers or conversations.
- End with a brief, genuine personal closing, such as what you are rooting for or an invitation to reach out with questions.

It should read like something a thoughtful person actually wrote: warm, specific, plain-spoken. Not templated, not salesy, no consulting jargon, no flattery for its own sake. Vary sentence length. No em-dashes. No bullet points, headings or markdown.

Do not sign off with a name, title or "Best regards"; the signature is added below the note automatically. Return only the note text, with paragraphs separated by a blank line.`;

export async function generateAnalystNote(
  order: Order,
  draft: Record<string, unknown>,
): Promise<string> {
  const sections = MIR_GENERATION_ORDER
    .filter(k => draft[k] !== undefined && draft[k] !== null)
    .map(k => `### ${MIR_SECTION_LABELS[k]}\n${JSON.stringify(draft[k], null, 2)}`)
    .join("\n\n");

  const user = `Client name: ${order.customer_name ?? "(not provided)"}
Business: ${order.business_name}

Business intake data:

${mirIntake(order)}

THE FINISHED REPORT:

${sections || "(no report sections yet)"}`;

  const note = (await callModel("Analyst Note", ANALYST_NOTE_SYSTEM, user))
    .replace(/^```\w*\s*|\s*```$/g, "")
    .trim();

  if (note.length < 200 || note.startsWith("{") || note.startsWith("[")) {
    throw new Error("Analyst Note: the response was not a usable note. Try again.");
  }
  return note;
}
