/**
 * AI generation for non-MIR service types.
 * Each service produces a flat Record<string, string> stored in ai_draft.
 * Existing MIR generation remains in lib/claude.ts, untouched.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Order } from "@/lib/supabase";
import type { ServiceType } from "@/lib/serviceConfig";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Shared helpers ─────────────────────────────────────────────────────────────

function buildIntake(order: Order): string {
  return [
    order.q1, order.q2, order.q3, order.q4, order.q5,
    order.q6, order.q7, order.q8, order.q9, order.q10,
  ]
    .map((a, i) => `Q${i + 1}: ${a ?? "(not provided)"}`)
    .join("\n");
}

async function callClaude(system: string, user: string, maxTokens = 4096): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

function parseJsonSections(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>;
  } catch { /* fall through */ }
  throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 300)}`);
}

// ── Social Media Audit (web-search enabled) ────────────────────────────────────
//
// Uses Anthropic's built-in web_search_20250305 tool to look up the client's
// actual social profiles and competitor accounts before writing the report.
// The API executes searches server-side; no multi-turn loop is required.
// In addition to the 8 narrative sections the function returns a 9th key
// "sma_comparison" with the structured data for the dashboard comparison table.

async function generateSMADraft(order: Order): Promise<Record<string, unknown>> {
  const intake = buildIntake(order);

  const system = `You are a senior social media analyst at Sea Glass Insights.
Your job is to produce a professional Social Media Audit grounded in REAL, OBSERVED data — not just intake answers.

STEP 1 — WEB RESEARCH (use web_search for each handle/URL in the intake):
• Look up the client's social media profiles on every platform they listed.
• Look up each competitor by name or handle.
• For each profile collect: approximate follower/fan count, recent posting frequency (posts per week or month), dominant content types (photos, Reels, carousels, videos, Stories), visible engagement patterns (typical likes and comments on recent posts), and profile completeness (bio filled in, link in bio, story highlights, contact info).
• If a profile is private, note that. If it cannot be found, note "not found".

STEP 2 — POPULATE THE COMPARISON TABLE:
Using the data you collected, fill in every cell of the sma_comparison object below. Use plain-English descriptive values (e.g. "1,243 followers", "3x per week", "2.1% — Above Average", "Primarily promotional"). Never fabricate specific numbers; use "Not publicly available" if you could not determine a value.

STEP 3 — WRITE ALL 8 REPORT SECTIONS:
Ground every sentence in what you actually observed online. Name specific posts, content series, follower counts, engagement rates, or profile gaps that you found.

Return ONLY a valid JSON object with exactly these 9 keys. No markdown. No code fences. Raw JSON only.

{
  "profile_setup_review": "2-4 paragraphs on actual profile setup based on research",
  "content_quality_scoring": "2-4 paragraphs on actual observed content quality",
  "posting_consistency_analysis": "2-4 paragraphs on actual posting frequency and consistency",
  "engagement_assessment": "2-4 paragraphs on actual engagement rates and community interaction",
  "brand_consistency_evaluation": "2-4 paragraphs on visual identity and voice based on observed content",
  "platform_utilization_review": "2-4 paragraphs on effective use of each platform observed",
  "competitive_social_comparison": "2-3 paragraphs narrative summary comparing client to competitors",
  "overall_presence_score": "2-4 paragraphs with qualitative rating (Strong / Developing / Needs Attention) and top 3-4 recommendations",
  "sma_comparison": {
    "competitor_1_name": "Name of Competitor 1 from intake, or empty string if none provided",
    "competitor_2_name": "Name of Competitor 2 from intake, or empty string if none provided",
    "rows": {
      "platforms": { "your_business": "e.g. Instagram, Facebook", "competitor_1": "...", "competitor_2": "..." },
      "follower_count": { "your_business": "e.g. 1,243 followers", "competitor_1": "...", "competitor_2": "..." },
      "posting_frequency": { "your_business": "e.g. 3x per week", "competitor_1": "...", "competitor_2": "..." },
      "avg_engagement_rate": { "your_business": "e.g. 2.1% — Above Average", "competitor_1": "...", "competitor_2": "..." },
      "content_mix": { "your_business": "e.g. Varied — product, lifestyle, community", "competitor_1": "...", "competitor_2": "..." },
      "profile_completeness": { "your_business": "e.g. 85% complete — missing story highlights", "competitor_1": "...", "competitor_2": "..." },
      "response_to_comments": { "your_business": "e.g. Active — responds within 24 hours", "competitor_1": "...", "competitor_2": "..." },
      "overall_presence": { "your_business": "Strong / Developing / Needs Attention", "competitor_1": "...", "competitor_2": "..." }
    }
  }
}

Tone: warm, credible, direct. No corporate jargon. No em-dashes.`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 8000,
    tools:      [{ type: "web_search_20250305", name: "web_search" }],
    system,
    messages: [
      {
        role: "user",
        content: `Business intake:\n\n${intake}\n\nSearch for the social media profiles and competitor accounts mentioned above, collect real data, then produce the complete audit report including the comparison table.`,
      },
    ],
  });

  // Extract text blocks (web_search results come back as WebSearchToolResultBlocks
  // alongside the text; we only need the final text answer)
  const raw = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("")
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`SMA generation returned invalid JSON: ${raw.slice(0, 400)}`);
  }
  return parsed;
}

// ── Deep Dive Report ───────────────────────────────────────────────────────────

async function generateDeepDiveDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You are a senior market research analyst at Sea Glass Insights. Produce a professional Deep Dive Report for a small business. This is an expanded, more rigorous version of the standard Market Intelligence Report — deeper competitive intelligence, 4-5 customer segments, decision-specific analysis, and a priority action framework. Return ONLY a valid JSON object with exactly these 9 keys. Each value is 3-5 paragraphs of plain text. No markdown within values. Tone: warm, credible, direct. No em-dashes. No corporate jargon.

Keys required:
- "executive_summary" (2-3 paragraphs — where they stand, biggest opportunity, most urgent action)
- "business_snapshot" (3-4 paragraphs — who they are, market context, what makes them tick)
- "customer_segments" (4-5 distinct segments, each with name, description, motivation, key need — formatted as readable prose)
- "competitive_intelligence" (deep per-competitor analysis — strengths, vulnerabilities, positioning gaps)
- "market_context" (industry trends, seasonal/local factors, macro conditions affecting this business)
- "decision_specific_analysis" (address the specific decision or problem they're trying to solve — reference Q11 if available)
- "extended_recommendations" (5-6 specific recommendations with implementation guidance)
- "priority_action_framework" (3-tier: do now, do soon, do eventually — with rationale)
- "expanded_analyst_interpretation" (synthesis — the thread connecting all findings, what it means)`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`, 6000);
  return parseJsonSections(raw);
}

// ── Synthetic Survey Report ────────────────────────────────────────────────────

async function generateSyntheticDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You are a senior research analyst at Sea Glass Insights. Produce a Synthetic Survey Report for a small business. This report uses AI-generated customer personas to pressure-test the business's assumptions and surface directional insight. Be transparent about methodology. Return ONLY a valid JSON object with exactly these 7 keys. Each value is 2-4 paragraphs of plain text. No markdown. Tone: warm, clear, honest about limitations.

Keys required:
- "research_question_framework" (what we're testing and why — restate the business's assumptions as research questions)
- "customer_personas" (3-5 distinct persona profiles — name, demographics, motivations, relationship to this business)
- "persona_response_simulation" (how each persona would respond to the key research questions — organized by persona)
- "thematic_analysis" (patterns across personas — agreements, contradictions, surprises)
- "directional_recommendations" (5-6 directional insights based on persona responses — labeled as directional, not statistically validated)
- "methodology_disclosure" (plain-language explanation of what AI persona simulation is, how it works, and its appropriate uses)
- "honest_limitations_statement" (what this research can and cannot tell you — be genuinely direct)`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`);
  return parseJsonSections(raw);
}

// ── Voice of Customer — Phase 1 (Survey Design) ────────────────────────────────

async function generateVoCSurveyDesign(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You are a senior research analyst at Sea Glass Insights. Based on the business intake provided, design a customer survey of up to 10 questions. The survey should directly address what the business owner wants to learn from their customers. Output the survey as clean, copy-paste-ready text formatted for Google Forms — question text only, no numbering prose, organized with clear question labels. Return ONLY a valid JSON object with exactly 1 key: "survey_design". The value should be the formatted survey text ready to copy into Google Forms. Use question types like Short Answer, Paragraph, Multiple Choice, or Linear Scale where appropriate — note the type in brackets after each question.`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`);
  return parseJsonSections(raw);
}

// ── Voice of Customer — Phase 2 (Analysis) ────────────────────────────────────

async function generateVoCAnalysis(
  order: Order,
  responses: string
): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You are a senior research analyst at Sea Glass Insights. Analyze the following customer survey responses and produce a Voice of Customer report. Return ONLY a valid JSON object with exactly these 3 keys. Each value is 2-4 paragraphs of plain text. No markdown within values. Tone: clear, insightful, practical.

Keys required:
- "thematic_analysis" (identify 4-6 major themes from the responses — what customers care about, what comes up repeatedly)
- "visual_findings_summary" (a structured summary of key data points — percentages, top answers, notable splits — formatted as readable prose that describes what charts would show)
- "analyst_interpretation" (what these findings mean for the business — specific, actionable, grounded in the actual data)`;

  const user = `Business intake:\n\n${intake}\n\nSurvey responses:\n\n${responses}`;
  const raw = await callClaude(system, user);
  return parseJsonSections(raw);
}

// ── AI Starter Kit ─────────────────────────────────────────────────────────────

async function generateAIStarterKitDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You are a senior analyst at Sea Glass Insights. Produce an AI Starter Kit for a small business owner who is new to AI tools. This kit should be practical, warm, and immediately useful — not intimidating. Return ONLY a valid JSON object with exactly these 10 keys. Tone: approachable, specific, encouraging.

Keys required:
- "business_type_analysis" (2 paragraphs — who this business is and what AI can do for their specific situation)
- "ai_best_practices_introduction" (3-4 paragraphs — plain-language guide covering: be specific with AI, have a conversation, ask AI to interview you before it writes. Frame it for a small business owner who has never used AI tools. Include a note that these prompts work in ChatGPT, Claude, or any AI chatbot.)
- "custom_prompt_1" (the prompt itself on line 1, then 1-2 sentences of instructions for how to use it. Focused on: marketing copy)
- "custom_prompt_2" (prompt + instructions. Focused on: responding to Google/Yelp reviews)
- "custom_prompt_3" (prompt + instructions. Focused on: social media captions)
- "custom_prompt_4" (prompt + instructions. Focused on: customer email / newsletter)
- "custom_prompt_5" (prompt + instructions. Focused on: competitive intelligence — researching a competitor)
- "custom_prompt_6" (prompt + instructions. Focused on: brainstorming — generating ideas for promotions or seasonal campaigns)
- "real_use_case_examples" (3-4 paragraphs — show how 3 of the prompts above apply specifically to THIS business, with example output snippets)
- "revision_notes" (leave blank — analyst fills this in manually)`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`);
  const sections = parseJsonSections(raw);
  sections.revision_notes = "";  // always blank
  return sections;
}

// ── Secret Shopping — Narrative Sections ─────────────────────────────────────

async function generateSSNarratives(
  order: Order,
  scorecard: Record<string, boolean | number>,
  analystObs: { best_moment: string; biggest_miss: string; immediate_fix: string; additional_observations: string }
): Promise<Record<string, string>> {
  const intake = buildIntake(order);

  const scorecardText = Object.entries(scorecard)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const obsText = `
Best moment: ${analystObs.best_moment}
Biggest missed opportunity: ${analystObs.biggest_miss}
If you could fix one thing immediately: ${analystObs.immediate_fix}
Additional observations: ${analystObs.additional_observations}`.trim();

  const system = `You are a senior analyst at Sea Glass Insights. Based on a secret shopping visit scorecard and analyst observations, write narrative notes for each of the 7 experience dimensions. Each narrative should be 1-2 paragraphs describing the experience in that dimension, grounded in the scores and observations. Also write a summary and recommendations section. Return ONLY a valid JSON object with exactly these 8 keys. Tone: professional, specific, constructive. Do not repeat raw scores — interpret them as narrative.

Keys required:
- "narrative_first_impression"
- "narrative_physical_environment"
- "narrative_staff_engagement"
- "narrative_core_experience"
- "narrative_purchase_process"
- "narrative_digital_touchpoints"
- "narrative_lasting_impression"
- "summary_and_recommendations" (3-4 paragraphs — synthesize everything, lead with the standout strength, name the most urgent improvement, give 3-4 specific actionable recommendations)`;

  const user = `Business intake:\n\n${intake}\n\nScorecard data:\n${scorecardText}\n\nAnalyst observations:\n${obsText}`;
  const raw = await callClaude(system, user);
  return parseJsonSections(raw);
}

// ── Section regeneration ───────────────────────────────────────────────────────

const SECTION_REGEN_INSTRUCTIONS: Record<string, string> = {
  // SMA
  profile_setup_review:          "Write 2-4 paragraphs of plain text assessing profile setup and configuration.",
  content_quality_scoring:       "Write 2-4 paragraphs analyzing content quality across platforms.",
  posting_consistency_analysis:  "Write 2-4 paragraphs on posting frequency, consistency, and timing.",
  engagement_assessment:         "Write 2-4 paragraphs on engagement rates and community interaction.",
  brand_consistency_evaluation:  "Write 2-4 paragraphs on visual identity and voice consistency across platforms.",
  platform_utilization_review:   "Write 2-4 paragraphs on how effectively each platform is being used.",
  competitive_social_comparison: "Write 2-3 paragraphs as a narrative competitive summary. If COMPARISON TABLE DATA is included in the analyst notes, base the narrative on those specific values — highlight the client's strengths, note where competitors have an edge, and close with the most important takeaway. Write in second person ('Your business...'). Plain prose only, no tables.",
  overall_presence_score:        "Write 2-4 paragraphs summarizing overall presence with a qualitative score and top recommendations.",
  // Deep Dive
  executive_summary:             "Write 2-3 paragraphs — where they stand, biggest opportunity, most urgent action.",
  business_snapshot:             "Write 3-4 paragraphs describing the business, market context, and competitive position.",
  customer_segments:             "Write 4-5 distinct customer segments as readable prose with name, description, motivation, key need.",
  competitive_intelligence:      "Write deep per-competitor analysis covering strengths, weaknesses, and positioning gaps.",
  market_context:                "Write about industry trends, seasonal factors, and macro conditions affecting this business.",
  decision_specific_analysis:    "Write focused analysis on the specific decision or problem the owner is trying to solve.",
  extended_recommendations:      "Write 5-6 specific recommendations with implementation guidance.",
  priority_action_framework:     "Write a 3-tier priority framework: do now, do soon, do eventually — with rationale.",
  expanded_analyst_interpretation:"Write a synthesis tying all findings together and explaining what it means for this business.",
  // Synthetic
  research_question_framework:   "Write 2-3 paragraphs framing what assumptions we're testing and why.",
  customer_personas:             "Write 3-5 distinct AI-generated customer persona profiles.",
  persona_response_simulation:   "Write how each persona would respond to the key research questions.",
  thematic_analysis:             "Write 3-5 themes identified across persona responses.",
  directional_recommendations:   "Write 5-6 directional insights clearly labeled as directional, not statistically validated.",
  methodology_disclosure:        "Write a plain-language explanation of AI persona simulation methodology.",
  honest_limitations_statement:  "Write an honest, direct statement about what this research can and cannot tell you.",
  // VoC Phase 1
  survey_design:                 "Write the complete survey as clean, copy-paste-ready text for Google Forms. Note question type in brackets after each question.",
  // VoC Phase 2
  thematic_analysis_voc:         "Write 4-6 major themes from the customer survey responses.",
  visual_findings_summary:       "Write a structured summary of key data points as readable prose describing what charts would show.",
  analyst_interpretation:        "Write what the findings mean for the business — specific, actionable, grounded in the data.",
  // AI Starter Kit
  business_type_analysis:        "Write 2 paragraphs summarizing this business type and what AI can do for their specific situation.",
  ai_best_practices_introduction:"Write 3-4 paragraphs: be specific, have a conversation, ask AI to interview you before writing. Approachable for AI beginners.",
  custom_prompt_1:               "Write a marketing copy prompt + 1-2 sentences of instructions for how to use it.",
  custom_prompt_2:               "Write a review response prompt + 1-2 sentences of instructions.",
  custom_prompt_3:               "Write a social media captions prompt + 1-2 sentences of instructions.",
  custom_prompt_4:               "Write a customer email/newsletter prompt + 1-2 sentences of instructions.",
  custom_prompt_5:               "Write a competitive intelligence research prompt + 1-2 sentences of instructions.",
  custom_prompt_6:               "Write a promotions/seasonal campaigns brainstorm prompt + 1-2 sentences of instructions.",
  real_use_case_examples:        "Write 3-4 paragraphs showing how 3 of the prompts apply specifically to this business with example output snippets.",
  // Secret Shopping narratives
  narrative_first_impression:    "Write 1-2 paragraphs narrating the first impression experience based on the scores.",
  narrative_physical_environment:"Write 1-2 paragraphs narrating the physical environment based on the scores.",
  narrative_staff_engagement:    "Write 1-2 paragraphs narrating the staff engagement experience based on the scores.",
  narrative_core_experience:     "Write 1-2 paragraphs narrating the core experience based on the scores.",
  narrative_purchase_process:    "Write 1-2 paragraphs narrating the purchase process based on the scores.",
  narrative_digital_touchpoints: "Write 1-2 paragraphs narrating the digital touchpoints based on the scores.",
  narrative_lasting_impression:  "Write 1-2 paragraphs narrating the lasting impression based on the scores.",
  summary_and_recommendations:   "Write 3-4 paragraphs: standout strength, most urgent improvement, 3-4 specific actionable recommendations.",
};

export async function regenerateServiceSection(
  order: Order,
  sectionKey: string,
  currentContent: string,
  analystNotes: string,
): Promise<string> {
  const intake = buildIntake(order);
  const formatInstructions = SECTION_REGEN_INSTRUCTIONS[sectionKey]
    ?? "Revise this section as plain text, 2-3 paragraphs.";

  const system = `You are a senior analyst at Sea Glass Insights. Revise the following report section based on the analyst's notes. Return ONLY the revised section as plain text — no JSON, no markdown, no preamble. ${formatInstructions}`;

  const user = `BUSINESS INTAKE:\n${intake}\n\nCURRENT SECTION (${sectionKey}):\n${currentContent}\n\nANALYST NOTES:\n${analystNotes?.trim() || "(no notes — improve and sharpen the existing content)"}`;

  return await callClaude(system, user, 2048);
}

// ── Main dispatch ──────────────────────────────────────────────────────────────

export async function generateServiceDraft(
  order: Order,
  serviceType: ServiceType,
  options?: {
    vocResponses?: string;
    ssScorecard?: Record<string, boolean | number>;
    ssAnalystObs?: { best_moment: string; biggest_miss: string; immediate_fix: string; additional_observations: string };
    vocPhase?: 1 | 2;
  }
): Promise<Record<string, unknown>> {
  switch (serviceType) {
    case "social_media_audit":
      // Returns Record<string, unknown> — includes nested sma_comparison object.
      // The generate-draft route extracts sma_comparison and saves it to service_data.
      return generateSMADraft(order);

    case "deep_dive_report":
      return generateDeepDiveDraft(order);

    case "synthetic_survey_report":
      return generateSyntheticDraft(order);

    case "voice_of_customer_survey":
      if ((options?.vocPhase ?? 1) === 2 && options?.vocResponses) {
        return generateVoCAnalysis(order, options.vocResponses);
      }
      return generateVoCSurveyDesign(order);

    case "ai_starter_kit":
      return generateAIStarterKitDraft(order);

    case "secret_shopping":
      return generateSSNarratives(
        order,
        options?.ssScorecard ?? {},
        options?.ssAnalystObs ?? { best_moment: "", biggest_miss: "", immediate_fix: "", additional_observations: "" }
      );

    default:
      throw new Error(`generateServiceDraft: unsupported service type "${serviceType}"`);
  }
}
