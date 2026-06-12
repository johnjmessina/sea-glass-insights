/**
 * AI generation for non-MIR service types.
 * Each service produces a flat Record<string, string> stored in ai_draft.
 * Existing MIR generation remains in lib/claude.ts, untouched.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Order } from "@/lib/supabase";
import type { ServiceType } from "@/lib/serviceConfig";
import { DEEP_DIVE_SECTIONS } from "@/lib/serviceConfig";

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

function parseJsonSections(raw: string, label = "Generation"): Record<string, string> {
  // Brace extraction: discard any preamble or postamble around the JSON object
  const firstBrace = raw.indexOf("{");
  const lastBrace  = raw.lastIndexOf("}");
  const extracted  = firstBrace !== -1 && lastBrace > firstBrace
    ? raw.slice(firstBrace, lastBrace + 1)
    : raw;

  try {
    const parsed = JSON.parse(extracted);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, string>;
  } catch {
    console.error(`${label} — raw response that failed to parse:\n`, raw);
  }
  throw new Error(`${label} returned invalid JSON: ${extracted.slice(0, 300)}`);
}

// ── Social Media Audit (web-search enabled) ────────────────────────────────────
//
// Uses Anthropic's built-in web_search_20250305 tool to look up the client's
// actual social profiles before writing the report.
// The API executes searches server-side; no multi-turn loop is required.

async function generateSMADraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);

  const system = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.

You are a senior social media analyst at Sea Glass Insights.
Your job is to produce a professional Social Media Audit grounded in REAL, OBSERVED data — not just intake answers.

STEP 1 — WEB RESEARCH (use web_search for each handle/URL in the intake):
• Look up the client's social media profiles on every platform they listed.
• For each profile collect: approximate follower/fan count, recent posting frequency (posts per week or month), dominant content types (photos, Reels, carousels, videos, Stories), visible engagement patterns (typical likes and comments on recent posts), and profile completeness (bio filled in, link in bio, story highlights, contact info).
• If a profile is private, note that. If it cannot be found, note "not found".

STEP 2 — WRITE ALL 7 REPORT SECTIONS:
Ground every sentence in what you actually observed online. Name specific posts, content series, follower counts, engagement rates, or profile gaps that you found.

CRITICAL OUTPUT RULES — read carefully before writing your response:
• Your ENTIRE response must be one valid JSON object and nothing else.
• Do NOT include any citation tags, HTML tags, or markup of any kind inside JSON values — no <cite>, </cite>, <a>, or any other HTML elements.
• Do NOT include web search attribution, reference numbers, bracketed citations like [1], or source annotations anywhere in the JSON values.
• Do NOT include markdown, backticks, code fences, or any text before or after the JSON object.
• Write all facts as plain prose sentences only. If you observed a follower count from a web search result, state it as plain text: "The account has 1,243 followers." — never as "The account has 1,243 followers<cite>source.com</cite>".

Return ONLY a raw JSON object with exactly these 7 keys:

{
  "profile_setup_review": "2-4 paragraphs on actual profile setup based on research",
  "content_quality_scoring": "2-4 paragraphs on actual observed content quality",
  "posting_consistency_analysis": "2-4 paragraphs on actual posting frequency and consistency",
  "engagement_assessment": "2-4 paragraphs on actual engagement rates and community interaction",
  "brand_consistency_evaluation": "2-4 paragraphs on visual identity and voice based on observed content",
  "platform_utilization_review": "2-4 paragraphs on effective use of each platform observed",
  "overall_presence_score": "2-4 paragraphs with qualitative rating (Strong / Developing / Needs Attention) and top 3-4 recommendations"
}

Tone: warm, credible, direct. No corporate jargon. No em-dashes.`;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 6000,
    tools:      [{ type: "web_search_20250305", name: "web_search" }],
    system,
    messages: [
      {
        role: "user",
        content: `Business intake:\n\n${intake}\n\nSearch for the social media profiles mentioned in the intake, collect real observed data, then produce the complete audit report.`,
      },
    ],
  });

  // Extract text blocks only (web_search tool result blocks are ignored)
  const fullText = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  // Strip citation markup that web_search can inject into output
  const stripped = fullText
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, "")
    .replace(/<[a-z][^>]*>[\s\S]*?<\/[a-z][^>]*>/gi, "")
    .replace(/<[a-z][^>]*\/?>/gi, "")
    .replace(/\[\d+\]/g, "")
    // Strip markdown fences
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  // Safety net: discard any preamble/postamble text by extracting only the
  // outermost JSON object — everything from the first { to the last }
  const firstBrace = stripped.indexOf("{");
  const lastBrace  = stripped.lastIndexOf("}");
  const raw = firstBrace !== -1 && lastBrace > firstBrace
    ? stripped.slice(firstBrace, lastBrace + 1)
    : stripped;

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch {
    console.error("SMA generation — raw response that failed to parse:\n", fullText);
    throw new Error(`SMA generation returned invalid JSON: ${raw.slice(0, 400)}`);
  }
  return parsed;
}

// ── Shared web-search response cleaner ───────────────────────────────────────
// Strips citation markup injected by the web_search tool and extracts plain text.
function cleanWebSearchResponse(resp: { content: Array<{ type: string }> }): string {
  return resp.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("")
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, "")
    .replace(/<[a-z][^>]*>[\s\S]*?<\/[a-z][^>]*>/gi, "")
    .replace(/<[a-z][^>]*\/?>/gi, "")
    .replace(/\[\d+\]/g, "")
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

// ── Deep Dive Report (web-search enabled) ─────────────────────────────────────
//
// Legacy monolithic generation — superseded by the section-by-section approach
// (generate-ddr-research + generate-ddr-section routes). Kept for reference.

async function generateDeepDiveDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);

  const sd    = (order.service_data as Record<string, unknown>) ?? {};
  const extra = (sd.deep_dive_extra as Record<string, string>) ?? {};
  const q11   = extra.q11 ?? "";
  const q12   = extra.q12 ?? "";
  const extraContext = [
    q11 ? `Q11 (Specific Decision or Problem): ${q11}` : "",
    q12 ? `Q12 (Prior Research): ${q12}` : "",
  ].filter(Boolean).join("\n");

  const mandate = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.`;

  // ── Call 1: Sections 1–5 ────────────────────────────────────────────────────
  // Research: business overview, competitors, market context
  let response1: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response1 = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 4000,
      tools:      [{ type: "web_search_20250305", name: "web_search" }],
      system: `${mandate}

You are a senior market research analyst at Sea Glass Insights. Research this business and write the first 5 sections of a Deep Dive Report.

STEP 1 — WEB RESEARCH:
• Search for the client's business: positioning, online presence, reputation.
• Look up each competitor mentioned in the intake: strengths, weaknesses, pricing, recent changes.
• Research industry trends and local market conditions relevant to this business.

STEP 2 — WRITE SECTIONS 1–5. Ground every sentence in what you actually researched.
Tone: warm, credible, direct. No em-dashes. No corporate jargon.
No citation tags, HTML elements, [1] markers, or source annotations inside JSON values. Plain prose only.

Return ONLY this JSON object with exactly these 5 keys:
{
  "executive_summary": "2-3 paragraphs: where they stand today based on research, biggest opportunity, most urgent action",
  "business_snapshot": "3-4 paragraphs: who they are, what makes them distinctive, their market context from research",
  "customer_segments": "4-5 distinct customer segments as readable prose — name, description, motivation, key need for each",
  "competitive_intelligence": "deep per-competitor analysis grounded in research — actual strengths, vulnerabilities, positioning gaps",
  "market_context": "industry trends, seasonal and local factors, macro conditions based on current research"
}`,
      messages: [{
        role:    "user",
        content: `Business intake:\n\n${intake}${extraContext ? "\n\n" + extraContext : ""}\n\nSearch for this business, its competitors, and market conditions, then write sections 1–5.`,
      }],
    });
  } catch (err) {
    console.error("[generateDeepDiveDraft] API call 1 (sections 1–5) failed:", err);
    throw new Error(
      `Deep Dive Report generation failed on sections 1–5: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // ── Call 2: Sections 6–9 ────────────────────────────────────────────────────
  // Research: focused on Q11 decision — benchmarks, data, examples
  let response2: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response2 = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 4000,
      tools:      [{ type: "web_search_20250305", name: "web_search" }],
      system: `${mandate}

You are a senior market research analyst at Sea Glass Insights. Write the final 4 sections of a Deep Dive Report, focused on the specific decision stated in the intake.${q11 ? `\n\nSpecific decision being analyzed: ${q11}` : ""}

STEP 1 — FOCUSED RESEARCH:
• Search for data, benchmarks, and real-world examples directly relevant to the specific decision.
• Look up market conditions, pricing data, or industry examples that inform the recommendation.

STEP 2 — WRITE SECTIONS 6–9. Every section must directly address the specific decision.
Tie every recommendation and framework item back to Q11. Tone: warm, credible, direct.
No em-dashes. No corporate jargon. No citation tags, HTML, [1] markers, or source annotations inside values.

Return ONLY this JSON object with exactly these 4 keys:
{
  "decision_specific_analysis": "focused analysis on the specific decision — analysis, risks, considerations, recommendation",
  "extended_recommendations": "5-6 specific recommendations with implementation guidance, informed by all research",
  "priority_action_framework": "3-tier: Do Now / Do Soon / Do Eventually — 2-3 items per tier with rationale tied to the decision",
  "expanded_analyst_interpretation": "synthesis — the thread connecting all findings, what it means for this business and decision"
}`,
      messages: [{
        role:    "user",
        content: `Business intake:\n\n${intake}${extraContext ? "\n\n" + extraContext : ""}\n\nSearch for data relevant to the specific decision, then write sections 6–9.`,
      }],
    });
  } catch (err) {
    console.error("[generateDeepDiveDraft] API call 2 (sections 6–9) failed:", err);
    throw new Error(
      `Deep Dive Report generation failed on sections 6–9: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const parts1 = parseJsonSections(cleanWebSearchResponse(response1), "DDR sections 1–5");
  const parts2 = parseJsonSections(cleanWebSearchResponse(response2), "DDR sections 6–9");

  return { ...parts1, ...parts2 };
}

// ── Synthetic Survey Report ────────────────────────────────────────────────────

async function generateSyntheticDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.

You are a senior research analyst at Sea Glass Insights. Produce a Synthetic Survey Report for a small business. This report uses AI-generated customer personas to pressure-test the business's assumptions and surface directional insight. Be transparent about methodology. Return ONLY a valid JSON object with exactly these 7 keys. Each value is 2-4 paragraphs of plain text. No markdown. Tone: warm, clear, honest about limitations.

Keys required:
- "research_question_framework" (what we're testing and why — restate the business's assumptions as research questions)
- "customer_personas" (3-5 distinct persona profiles — name, demographics, motivations, relationship to this business)
- "persona_response_simulation" (how each persona would respond to the key research questions — organized by persona)
- "thematic_analysis" (patterns across personas — agreements, contradictions, surprises)
- "directional_recommendations" (5-6 directional insights based on persona responses — labeled as directional, not statistically validated)
- "methodology_disclosure" (plain-language explanation of what AI persona simulation is, how it works, and its appropriate uses)
- "honest_limitations_statement" (what this research can and cannot tell you — be genuinely direct)`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`);
  return parseJsonSections(raw, "Synthetic Survey");
}

// ── Voice of Customer — Phase 1 (Survey Design) ────────────────────────────────

async function generateVoCSurveyDesign(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.

You are a senior research analyst at Sea Glass Insights. Based on the business intake provided, design a customer survey of up to 10 questions. The survey should directly address what the business owner wants to learn from their customers. Output the survey as clean, copy-paste-ready text formatted for Google Forms — question text only, no numbering prose, organized with clear question labels. Return ONLY a valid JSON object with exactly 1 key: "survey_design". The value should be the formatted survey text ready to copy into Google Forms. Use question types like Short Answer, Paragraph, Multiple Choice, or Linear Scale where appropriate — note the type in brackets after each question.`;

  const raw = await callClaude(system, `Business intake:\n\n${intake}`);
  return parseJsonSections(raw, "VoC Survey Design");
}

// ── Voice of Customer — Phase 2 (Analysis) ────────────────────────────────────

async function generateVoCAnalysis(
  order: Order,
  responses: string
): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.

You are a senior research analyst at Sea Glass Insights. Analyze the following customer survey responses and produce a Voice of Customer report. Return ONLY a valid JSON object with exactly these 3 keys. Each value is 2-4 paragraphs of plain text. No markdown within values. Tone: clear, insightful, practical.

Keys required:
- "thematic_analysis" (identify 4-6 major themes from the responses — what customers care about, what comes up repeatedly)
- "visual_findings_summary" (a structured summary of key data points — percentages, top answers, notable splits — formatted as readable prose that describes what charts would show)
- "analyst_interpretation" (what these findings mean for the business — specific, actionable, grounded in the actual data)`;

  const user = `Business intake:\n\n${intake}\n\nSurvey responses:\n\n${responses}`;
  const raw = await callClaude(system, user);
  return parseJsonSections(raw, "VoC Analysis");
}

// ── AI Starter Kit ─────────────────────────────────────────────────────────────

async function generateAIStarterKitDraft(order: Order): Promise<Record<string, string>> {
  const intake = buildIntake(order);
  const system = `You must respond with valid JSON only. Do not include any text, explanation, research notes, preamble, citations, markdown, or backticks before or after the JSON object. Your entire response must be a single valid JSON object and nothing else. Any text outside the JSON object will cause a critical failure.

You are a senior analyst at Sea Glass Insights. Produce an AI Starter Kit for a small business owner who is new to AI tools. This kit should be practical, warm, and immediately useful — not intimidating. Return ONLY a valid JSON object with exactly these 10 keys. Tone: approachable, specific, encouraging.

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
  const sections = parseJsonSections(raw, "AI Starter Kit");
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

// ── DDR: Standalone section generation with per-section focused search ────────
//
// Each section does its own focused web search for only what it needs.
// Sections that don't benefit from search (analytics, synthesis) skip it.
// All calls target <45 s to stay well under Vercel's 60 s limit.

type DDRSectionConfig = {
  useSearch: boolean;
  searchDirective: string;
  writeInstructions: string;
};

const DDR_SECTION_CONFIG: Record<string, DDRSectionConfig> = {
  executive_summary: {
    useSearch: true,
    searchDirective: "Search for this business — find their website, Google reviews, and any recent coverage.",
    writeInstructions: "Write 2-3 paragraphs: where they stand today, their biggest opportunity, and their most urgent action.",
  },
  business_snapshot: {
    useSearch: true,
    searchDirective: "Search for this business's website and online presence. Find specific details about what they offer and how they position themselves.",
    writeInstructions: "Write 3-4 paragraphs: who they are, what makes them distinctive, their market position. Use specific details from your search.",
  },
  customer_segments: {
    useSearch: false,
    searchDirective: "",
    writeInstructions: "Describe 4-5 distinct customer segments as prose. For each: name the segment, who they are, their motivation for choosing this business, and their key unmet need. No bullet points.",
  },
  competitive_intelligence: {
    useSearch: true,
    searchDirective: "Search for each competitor named in the intake. Find their pricing, strengths, weaknesses, reviews, and recent changes.",
    writeInstructions: "Analyze each competitor. For each: actual strengths from research, specific vulnerabilities, and exactly where the client has a real edge.",
  },
  market_context: {
    useSearch: true,
    searchDirective: "Search for current trends in this industry and relevant local or regional market conditions.",
    writeInstructions: "Write about industry trends, seasonal and local factors, and macro conditions. Focus on what is changing and why it matters to this business.",
  },
  decision_specific_analysis: {
    useSearch: true,
    searchDirective: "Search for data, benchmarks, and real examples directly relevant to the specific decision stated in Q11.",
    writeInstructions: "Analyze the specific decision in Q11. Cover: the core tradeoffs, key risks, what research shows about each option, and a clear directional recommendation. Be specific.",
  },
  extended_recommendations: {
    useSearch: false,
    searchDirective: "",
    writeInstructions: "Write 5-6 specific, actionable recommendations with implementation guidance. For each: what to do, why it matters, how to start.",
  },
  priority_action_framework: {
    useSearch: false,
    searchDirective: "",
    writeInstructions: "Organize as three tiers — Do Now / Do Soon / Do Eventually — with 2-3 items per tier. For each: what it is, why it belongs in that tier, and sequencing rationale.",
  },
  expanded_analyst_interpretation: {
    useSearch: false,
    searchDirective: "",
    writeInstructions: "Write a synthesis: the thread connecting all findings, what this means for this business and the specific decision, and the one insight that reframes everything. Warm, direct analyst voice.",
  },
};

export async function generateDDRSectionWithSearch(
  order: Order,
  sectionKey: string,
): Promise<string> {
  const intake = buildIntake(order);
  const sd     = (order.service_data as Record<string, unknown>) ?? {};
  const extra  = (sd.deep_dive_extra as Record<string, string>) ?? {};
  const q11    = extra.q11 ?? "";
  const q12    = extra.q12 ?? "";
  const extraContext = [
    q11 ? `Specific Decision (Q11): ${q11}` : "",
    q12 ? `Prior Research (Q12): ${q12}` : "",
  ].filter(Boolean).join("\n");

  const sectionLabel = DEEP_DIVE_SECTIONS.find(s => s.key === sectionKey)?.label ?? sectionKey;
  const cfg = DDR_SECTION_CONFIG[sectionKey] ?? {
    useSearch: false, searchDirective: "", writeInstructions: "Write 2-4 paragraphs of clear professional prose.",
  };

  const systemLines = [
    `You are a senior market research analyst at Sea Glass Insights. Write ONLY the "${sectionLabel}" section of a Deep Dive Report.`,
    cfg.useSearch && cfg.searchDirective ? cfg.searchDirective : "",
    `Return plain prose only — no JSON, no headers, no bullet points, no markdown. 2-4 flowing paragraphs. Tone: warm, credible, direct. No em-dashes. No corporate jargon.`,
  ].filter(Boolean).join("\n\n");

  const userPrompt = `BUSINESS INTAKE:\n${intake}${extraContext ? "\n\n" + extraContext : ""}\n\nWrite the "${sectionLabel}" section now. ${cfg.writeInstructions}`;

  try {
    if (cfg.useSearch) {
      const msg = await client.messages.create({
        model:    "claude-sonnet-4-5",
        max_tokens: 1200,
        tools:    [{ type: "web_search_20250305", name: "web_search" }],
        system:   systemLines,
        messages: [{ role: "user", content: userPrompt }],
      });
      return cleanWebSearchResponse(msg);
    } else {
      const msg = await client.messages.create({
        model:    "claude-sonnet-4-5",
        max_tokens: 1200,
        system:   systemLines,
        messages: [{ role: "user", content: userPrompt }],
      });
      return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    }
  } catch (err) {
    console.error(`[generateDDRSectionWithSearch] "${sectionKey}" failed:`, err);
    throw new Error(`Section "${sectionLabel}" failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── DDR: Section-by-section generation (used by generate-ddr-research / generate-ddr-section routes) ──

const DDR_SECTION_INSTRUCTIONS: Record<string, string> = {
  executive_summary:               "Write 2-3 paragraphs: where they stand today based on research, their biggest opportunity, and their most urgent action. This is the first thing the client reads — be direct and specific.",
  business_snapshot:               "Write 3-4 paragraphs: who they are, what makes them distinctive, and their broader market context. Ground every claim in the research.",
  customer_segments:               "Describe 4-5 distinct customer segments as readable prose. For each: name the segment, who they are, their motivation for choosing this business, and their key unmet need. Flowing paragraphs, not bullet lists.",
  competitive_intelligence:        "Analyze each competitor from the intake. For each: actual strengths found in research, specific vulnerabilities, and exactly where the client has a real edge. Ground every claim in what was researched.",
  market_context:                  "Write about industry trends, seasonal and local factors, and macro conditions that directly affect this business. Focus on what is changing and why it matters to the client's future.",
  decision_specific_analysis:      "Write a focused analysis of the specific decision in Q11. Cover the core tradeoffs, key risks, what the research says about each option, and a clear directional recommendation. Be specific — the client needs a decision, not a hedge.",
  extended_recommendations:        "Write 5-6 specific, actionable recommendations with implementation guidance. For each: what to do, why the research supports it, and how to get started. Tie each back to the decision and research.",
  priority_action_framework:       "Organize as three tiers — Do Now / Do Soon / Do Eventually — with 2-3 items per tier. For each item: what it is, why it belongs in that tier, and how it connects to the decision and research.",
  expanded_analyst_interpretation: "Write a synthesis: the thread connecting all findings, what this means for this business and the specific decision, and the one insight that reframes everything. Warm, direct, credible analyst voice.",
};

export async function generateDDRResearch(order: Order): Promise<string> {
  const intake = buildIntake(order);
  const sd    = (order.service_data as Record<string, unknown>) ?? {};
  const extra = (sd.deep_dive_extra as Record<string, string>) ?? {};
  const q11   = extra.q11 ?? "";
  const q12   = extra.q12 ?? "";
  const extraContext = [
    q11 ? `Specific Decision Being Analyzed (Q11): ${q11}` : "",
    q12 ? `Prior Research Done (Q12): ${q12}` : "",
  ].filter(Boolean).join("\n");

  let resp: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    resp = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 4096,
      tools:      [{ type: "web_search_20250305", name: "web_search" }],
      system: `You are a senior market research analyst preparing a research briefing for a Deep Dive Report. Search the web to gather everything a section writer will need.

Search for:
1. The client's business — website, reviews, social presence, positioning, recent news
2. Each competitor mentioned — strengths, weaknesses, pricing, reputation, recent changes
3. Industry and local market trends relevant to this business
4. Data, benchmarks, and real-world examples relevant to the specific decision in Q11

Write a comprehensive research briefing in organized prose. Include specific facts, numbers, and observations.
This briefing will be passed word-for-word to individual section writers — make it thorough and specific.
No JSON. No citation tags, HTML elements, or [1] markers. Plain prose only.`,
      messages: [{
        role:    "user",
        content: `Business intake:\n\n${intake}${extraContext ? "\n\n" + extraContext : ""}\n\nSearch for this business, its competitors, and market conditions. Write a thorough research briefing.`,
      }],
    });
  } catch (err) {
    console.error("[generateDDRResearch] API call failed:", err);
    throw new Error(`Research phase failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return cleanWebSearchResponse(resp);
}

export async function generateDDRSection(
  order: Order,
  sectionKey: string,
  researchContext: string,
): Promise<string> {
  const intake = buildIntake(order);
  const sd    = (order.service_data as Record<string, unknown>) ?? {};
  const extra = (sd.deep_dive_extra as Record<string, string>) ?? {};
  const q11   = extra.q11 ?? "";
  const q12   = extra.q12 ?? "";
  const extraContext = [
    q11 ? `Specific Decision (Q11): ${q11}` : "",
    q12 ? `Prior Research (Q12): ${q12}` : "",
  ].filter(Boolean).join("\n");

  const sectionLabel = DEEP_DIVE_SECTIONS.find(s => s.key === sectionKey)?.label ?? sectionKey;
  const instructions = DDR_SECTION_INSTRUCTIONS[sectionKey]
    ?? "Write 2-4 paragraphs of clear, professional prose grounded in the research.";

  let msg: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    msg = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 1500,
      system:     `You are a senior market research analyst at Sea Glass Insights. Your task is to write ONLY the "${sectionLabel}" section of a Deep Dive Report. Return plain prose text only — no JSON, no section headers, no bullet points, no markdown. Just 2-4 flowing prose paragraphs. Tone: warm, credible, direct. No em-dashes. No corporate jargon.`,
      messages:   [{
        role:    "user",
        content: `RESEARCH BRIEFING:\n${researchContext}\n\nBUSINESS INTAKE:\n${intake}${extraContext ? "\n\n" + extraContext : ""}\n\nWrite the "${sectionLabel}" section now.\n\n${instructions}`,
      }],
    });
  } catch (err) {
    console.error(`[generateDDRSection] "${sectionKey}" API call failed:`, err);
    throw new Error(`Section "${sectionLabel}" generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

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
