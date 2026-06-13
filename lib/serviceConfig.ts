// ── Service type definitions ───────────────────────────────────────────────────

export type ServiceType =
  | "market_intelligence_report"
  | "social_media_audit"
  | "secret_shopping"
  | "deep_dive_report"
  | "synthetic_survey_report"
  | "voice_of_customer_survey"
  | "ai_starter_kit"
  | "starter_intelligence_bundle"
  | "field_report_bundle"
  | "market_mind_bundle"
  | "complete_shopper_experience_bundle";

export const SERVICE_DISPLAY_NAMES: Record<ServiceType, string> = {
  market_intelligence_report:        "Market Intelligence Report",
  social_media_audit:                "Social Media Audit",
  secret_shopping:                   "Secret Shopping",
  deep_dive_report:                  "Deep Dive Report",
  synthetic_survey_report:           "Synthetic Survey Report",
  voice_of_customer_survey:          "Voice of Customer Survey",
  ai_starter_kit:                    "AI Starter Kit",
  starter_intelligence_bundle:       "Starter Intelligence Bundle",
  field_report_bundle:               "Field Report Bundle",
  market_mind_bundle:                "Market & Mind Bundle",
  complete_shopper_experience_bundle:"Complete Shopper Experience Bundle",
};

export const SERVICE_TAG_COLORS: Record<ServiceType, string> = {
  market_intelligence_report:        "bg-blue-100 text-blue-700",
  social_media_audit:                "bg-purple-100 text-purple-700",
  secret_shopping:                   "bg-orange-100 text-orange-700",
  deep_dive_report:                  "bg-indigo-100 text-indigo-700",
  synthetic_survey_report:           "bg-violet-100 text-violet-700",
  voice_of_customer_survey:          "bg-teal-100 text-teal-700",
  ai_starter_kit:                    "bg-green-100 text-green-700",
  starter_intelligence_bundle:       "bg-amber-100 text-amber-700",
  field_report_bundle:               "bg-amber-100 text-amber-700",
  market_mind_bundle:                "bg-amber-100 text-amber-700",
  complete_shopper_experience_bundle:"bg-amber-100 text-amber-700",
};

// ── Section definitions ────────────────────────────────────────────────────────

export interface ServiceSection {
  key:          string;
  label:        string;
  aiGenerated:  boolean;   // false = human entry only, no AI generate/regen
  humanOnly?:   boolean;   // synonym for !aiGenerated (for clarity at use site)
  description?: string;
}

export const SMA_SECTIONS: ServiceSection[] = [
  { key: "profile_setup_review",          label: "Profile & Setup Review",               aiGenerated: true },
  { key: "content_quality_scoring",       label: "Content Quality Scoring",              aiGenerated: true },
  { key: "posting_consistency_analysis",  label: "Posting Consistency Analysis",         aiGenerated: true },
  { key: "engagement_assessment",         label: "Engagement Assessment",                aiGenerated: true },
  { key: "brand_consistency_evaluation",  label: "Brand Consistency Evaluation",         aiGenerated: true },
  { key: "platform_utilization_review",   label: "Platform Utilization Review",              aiGenerated: true },
  { key: "overall_presence_score",        label: "Overall Presence Score & Recommendations", aiGenerated: true },
];

export const DEEP_DIVE_SECTIONS: ServiceSection[] = [
  { key: "executive_summary",              label: "Executive Summary",                     aiGenerated: true },
  { key: "business_snapshot",             label: "Business Snapshot",                     aiGenerated: true },
  { key: "customer_segments",             label: "Customer Segments",                     aiGenerated: true },
  { key: "competitive_intelligence",      label: "Competitive Intelligence",              aiGenerated: true },
  { key: "market_context",               label: "Market Context & Trend Analysis",       aiGenerated: true },
  { key: "decision_specific_analysis",    label: "Decision-Specific Analysis",            aiGenerated: true },
  { key: "extended_recommendations",      label: "Extended Recommendations",              aiGenerated: true },
  { key: "priority_action_framework",     label: "Priority Action Framework",             aiGenerated: true },
  { key: "expanded_analyst_interpretation",label: "Expanded Analyst Interpretation",     aiGenerated: true },
];

export const SYNTHETIC_SECTIONS: ServiceSection[] = [
  { key: "research_question_framework",   label: "Research Question Framework",          aiGenerated: true },
  { key: "customer_personas",             label: "Customer Personas",                    aiGenerated: true },
  { key: "persona_response_simulation",   label: "Persona Response Simulation",          aiGenerated: true },
  { key: "thematic_analysis",             label: "Thematic Analysis",                    aiGenerated: true },
  { key: "directional_recommendations",   label: "Directional Recommendations",          aiGenerated: true },
  { key: "methodology_disclosure",        label: "Methodology Disclosure",               aiGenerated: true },
  { key: "honest_limitations_statement",  label: "Honest Limitations Statement",         aiGenerated: true },
];

// Phase 1: question map editor (no AI text sections — the question map IS the output)
export const VOC_PHASE1_SECTIONS: ServiceSection[] = [];

// Phase 2: all four are AI-generated narrative sections
export const VOC_PHASE2_SECTIONS: ServiceSection[] = [
  { key: "quant_summary",          label: "Quantitative Summary",                   aiGenerated: true,
    description: "AI narrative of T2B/B2B scores, frequency breakdowns, and banner cut highlights." },
  { key: "thematic_analysis",      label: "Thematic Analysis",                      aiGenerated: true,
    description: "AI analysis of open-ended responses — themes, quotes, sentiment." },
  { key: "visual_findings_summary",label: "Visual Findings Summary",                aiGenerated: true },
  { key: "analyst_interpretation", label: "Analyst Interpretation & Recommendations", aiGenerated: true },
];

export const AI_STARTER_KIT_SECTIONS: ServiceSection[] = [
  { key: "business_type_analysis",        label: "Business Type Analysis",         aiGenerated: true },
  { key: "ai_best_practices_introduction",label: "AI Best Practices Introduction", aiGenerated: true },
  { key: "custom_prompt_1",               label: "Custom Prompt 1",                aiGenerated: true },
  { key: "custom_prompt_2",               label: "Custom Prompt 2",                aiGenerated: true },
  { key: "custom_prompt_3",               label: "Custom Prompt 3",                aiGenerated: true },
  { key: "custom_prompt_4",               label: "Custom Prompt 4",                aiGenerated: true },
  { key: "custom_prompt_5",               label: "Custom Prompt 5",                aiGenerated: true },
  { key: "custom_prompt_6",               label: "Custom Prompt 6",                aiGenerated: true },
  { key: "real_use_case_examples",        label: "Real Use Case Examples",         aiGenerated: true },
  { key: "revision_notes",                label: "Revision Notes",                 aiGenerated: false, humanOnly: true },
];

// Secret Shopping: narrative sections stored in ai_draft
export const SS_NARRATIVE_SECTIONS: ServiceSection[] = [
  { key: "narrative_first_impression",    label: "First Impression — Narrative",          aiGenerated: true },
  { key: "narrative_physical_environment",label: "Physical Environment — Narrative",      aiGenerated: true },
  { key: "narrative_staff_engagement",    label: "Staff Engagement — Narrative",          aiGenerated: true },
  { key: "narrative_core_experience",     label: "Core Experience — Narrative",           aiGenerated: true },
  { key: "narrative_purchase_process",    label: "Purchase Process — Narrative",          aiGenerated: true },
  { key: "narrative_digital_touchpoints", label: "Digital Touchpoints — Narrative",       aiGenerated: true },
  { key: "narrative_lasting_impression",  label: "Lasting Impression — Narrative",        aiGenerated: true },
  { key: "summary_and_recommendations",   label: "Summary & Recommendations",            aiGenerated: true },
];

export function getSectionsForService(type: ServiceType): ServiceSection[] {
  switch (type) {
    case "social_media_audit":                return SMA_SECTIONS;
    case "deep_dive_report":                  return DEEP_DIVE_SECTIONS;
    case "synthetic_survey_report":           return SYNTHETIC_SECTIONS;
    case "voice_of_customer_survey":          return [...VOC_PHASE1_SECTIONS, ...VOC_PHASE2_SECTIONS];
    case "ai_starter_kit":                    return AI_STARTER_KIT_SECTIONS;
    case "secret_shopping":                   return SS_NARRATIVE_SECTIONS;
    case "market_intelligence_report":
    default:                                  return [];  // MIR uses its own existing SECTIONS
  }
}

// ── Bundle helpers ─────────────────────────────────────────────────────────────

export const BUNDLE_COMPOSITION: Partial<Record<ServiceType, [ServiceType, ServiceType]>> = {
  starter_intelligence_bundle:        ["market_intelligence_report", "social_media_audit"],
  field_report_bundle:                ["market_intelligence_report", "secret_shopping"],
  market_mind_bundle:                 ["market_intelligence_report", "synthetic_survey_report"],
  complete_shopper_experience_bundle: ["secret_shopping",            "voice_of_customer_survey"],
};

export function isBundle(type: ServiceType): boolean {
  return type in BUNDLE_COMPOSITION;
}

export function getBundleParts(type: ServiceType): [ServiceType, ServiceType] | null {
  return BUNDLE_COMPOSITION[type] ?? null;
}

export function getEffectiveServiceType(type: ServiceType | null | undefined): ServiceType {
  return type ?? "market_intelligence_report";
}

// ── Intake question labels by service ─────────────────────────────────────────
// Returns the question labels shown in the "Intake Answers" panel

const MIR_QUESTIONS = [
  "What is your business name and what do you sell or offer?",
  "How long have you been in business, and where are you located?",
  "Who is your ideal customer? (age, income, lifestyle, problem they have)",
  "Who are your top 2–3 competitors? (names, or describe them)",
  "What makes you different from those competitors?",
  "What is the biggest challenge you are facing right now?",
  "What does success look like for you in the next 12 months?",
  "What marketing are you currently doing, if any?",
  "What do you wish you knew about your market or customers that you don't know today?",
  "Is there anything else you want the report to focus on or address?",
];

const SS_QUESTIONS = [
  "Business name and what you sell or offer",
  "Business address",
  "Industry / business type",
  "Hours of operation",
  "What does a typical customer interaction look like?",
  "Specific experience dimensions to evaluate",
  "Competitor location to shop as well?",
  "What are you most concerned about or want us to focus on?",
  "(not used)",
  "(not used)",
];

const VOC_QUESTIONS = [
  "Business name and location",
  "Industry / business type",
  "How many customer contacts do you have?",
  "How were these contacts collected?",
  "What do you most want to learn from your customers?",
  "Have you surveyed your customers before? If so, what did you find?",
  "What decision will this research inform?",
  "(not used)",
  "(not used)",
  "(not used)",
];

// NOTE: getQuestionLabels is defined at the bottom of this file, after
// MANUAL_INTAKE_QUESTIONS, so it can derive labels from that source of truth.
// The function is exported from there.

// ── Manual Order Form — per-service question configs ──────────────────────────

export interface ManualIntakeQuestion {
  /** Display label */
  label: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Textarea rows (default 3) */
  rows?: number;
}

/** Service-specific intake questions for the Create Manual Order form.
 *  Each array entry corresponds to q1, q2, … q10.
 *  Shorter arrays = fewer questions rendered.
 *  Bundles fall back to their primary service questions.
 */
export const MANUAL_INTAKE_QUESTIONS: Record<ServiceType, ManualIntakeQuestion[]> = {
  market_intelligence_report: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop in Bradley Beach NJ" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 3 years, Bradley Beach NJ" },
    { label: "Who is your ideal customer? (age, income, lifestyle, problem they have)",          placeholder: "e.g. 28-45, dual income, values quality over price, wants local authenticity" },
    { label: "Top 2–3 competitors (names, or describe them)",                                    placeholder: "e.g. Starbucks on Main St, The Grind (new indie shop), bagel shop with coffee" },
    { label: "What makes you different from those competitors?",                                 placeholder: "e.g. We roast in-house, staff knows the product deeply, loyal local following" },
    { label: "Biggest challenge right now",                                                      placeholder: "e.g. New competitor opened across town and is pulling our afternoon regulars" },
    { label: "What does success look like in the next 12 months?",                              placeholder: "e.g. Stabilize customer base, grow revenue 20%, clear off-season strategy" },
    { label: "What marketing are you currently doing, if any?",                                  placeholder: "e.g. Instagram 3x/week, no paid ads, email list of 400 people rarely used" },
    { label: "What do you wish you knew about your market or customers?",                        placeholder: "e.g. Why lunch traffic is weaker than morning, whether there's an untapped segment" },
    { label: "Anything else you want the report to focus on or address?",                        placeholder: "e.g. Considering a second location, want context on whether the market can support it" },
  ],

  social_media_audit: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 3 years, Bradley Beach NJ" },
    { label: "Which social media platforms are you currently using?",                            placeholder: "e.g. Instagram, Facebook — we have TikTok but never post on it" },
    { label: "How often do you post on each platform?",                                          placeholder: "e.g. Instagram 3x/week, Facebook once a week or less" },
    { label: "Who is your target audience on social media?",                                     placeholder: "e.g. 28-45 locals and seasonal visitors, coffee enthusiasts, people looking for a community spot" },
    { label: "Biggest challenge with social media right now",                                    placeholder: "e.g. Low engagement, inconsistent posting, not sure what content works" },
    { label: "What are you hoping to improve or learn from this audit?",                         placeholder: "e.g. What content drives the most engagement, whether we're missing any platforms" },
    { label: "Anything specific you want us to evaluate or focus on?",                           placeholder: "e.g. Whether our Stories are performing, how our bio looks, content mix" },
  ],

  secret_shopping: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "Business address",                                                                  placeholder: "e.g. 123 Main Ave, Bradley Beach NJ 07720" },
    { label: "Industry / business type",                                                          placeholder: "e.g. Coffee Shop, Retail Boutique, Restaurant, Fitness Studio" },
    { label: "Hours of operation (when should we visit?)",                                       placeholder: "e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm. Best time: weekday morning 9-11am" },
    { label: "What does a typical customer interaction look like? (from arrival to departure)",   placeholder: "e.g. Customer walks in, browses, orders at the counter, waits for drink, finds a seat", rows: 4 },
    { label: "Are there specific experience dimensions you want evaluated?",                      placeholder: "e.g. Greeting, wait time, product knowledge, restroom cleanliness during peak hours", rows: 3 },
    { label: "Would you like a competitor location shopped as well? If yes, which one?",         placeholder: "e.g. Yes — The Java House, 456 Ocean Ave, Belmar NJ (additional fee applies)" },
    { label: "What are you most concerned about or want us to focus on?",                        placeholder: "e.g. We've had Google reviews mentioning slow service at lunch. Is it staffing or process?", rows: 4 },
  ],

  deep_dive_report: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop and retail roastery" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 4 years, Bradley Beach NJ. Seasonal location with year-round operations" },
    { label: "Who is your ideal customer? (age, income, lifestyle, problem they have)",          placeholder: "e.g. 28-45, dual income, values quality over price, wants a community-feel third place" },
    { label: "Top 2–3 competitors (names, or describe them)",                                    placeholder: "e.g. Starbucks, The Grind (newer indie shop), bagel shop with coffee counter" },
    { label: "What makes you different from those competitors?",                                 placeholder: "e.g. We roast in-house, staff knowledge, local loyalty, event programming" },
    { label: "Biggest challenge right now",                                                      placeholder: "e.g. New competitor opened and is pulling afternoon regulars, off-season revenue drops" },
    { label: "What does success look like in the next 12 months?",                              placeholder: "e.g. Stabilize customer base, grow 20%, build off-season strategy" },
    { label: "What marketing are you currently doing, if any?",                                  placeholder: "e.g. Instagram 3x/week, occasional Facebook, email list of 400 rarely used" },
    { label: "What do you wish you knew about your market or customers?",                        placeholder: "e.g. Why lunch traffic is weak, whether there's an untapped segment we're missing" },
    { label: "Anything else you want the report to focus on or address?",                        placeholder: "e.g. Possible second location, competitive threat response" },
  ],

  synthetic_survey_report: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 2 years, launching a second location in Asbury Park this spring" },
    { label: "Who is your ideal customer? (age, income, lifestyle)",                             placeholder: "e.g. 28-45, values quality and local authenticity, willing to pay a premium" },
    { label: "Top 2–3 competitors (names, or describe them)",                                    placeholder: "e.g. Starbucks on Main St, The Grind, the bagel shop that also sells coffee" },
    { label: "What assumptions about your customers do you want to test?",                       placeholder: "e.g. We assume customers value atmosphere over price. We assume retail buyers are different from cafe customers.", rows: 4 },
    { label: "3–5 most important questions you want answered about your customers",              placeholder: "e.g. Would customers pay $18 for a retail bag? What would make them choose us over the new shop?", rows: 4 },
    { label: "Current pricing and how customers typically find you",                              placeholder: "e.g. Drip $3.50, espresso $5-7, retail $14-16. Most find us word-of-mouth or walking by" },
    { label: "What marketing are you currently doing, if any?",                                  placeholder: "e.g. Instagram 3x/week, no paid ads, occasional email to ~400 people" },
    { label: "A specific product, service, or decision you want customer reactions to?",         placeholder: "e.g. Considering a $35/month coffee subscription — would our core customer type value it?", rows: 3 },
    { label: "Anything else you want the personas to focus on or address?",                      placeholder: "e.g. We'd like personas to react to our brand name and logo description if possible" },
  ],

  voice_of_customer_survey: [
    { label: "Business name and location",                                                        placeholder: "e.g. Anchor Coffee Co., Bradley Beach NJ" },
    { label: "Industry / business type",                                                          placeholder: "e.g. Food & Beverage — independent coffee shop, retail and cafe" },
    { label: "Approximately how many customer contacts do you have?",                            placeholder: "e.g. Around 400 email addresses from loyalty program and online orders" },
    { label: "How were these contacts collected?",                                               placeholder: "e.g. Square loyalty program, website email signup form" },
    { label: "What do you most want to learn from your customers?",                              placeholder: "e.g. Why they choose us over competitors, what would make them come more often", rows: 4 },
    { label: "Have you surveyed your customers before? If so, what did you find?",               placeholder: "e.g. Google Form 2 years ago, ~30 responses — loved the atmosphere, mentioned slow morning rush service", rows: 3 },
    { label: "What decision will this research inform?",                                          placeholder: "e.g. Whether to expand hours, add a subscription model, or open a second location", rows: 3 },
  ],

  ai_starter_kit: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 3 years, Bradley Beach NJ" },
    { label: "Who is your ideal customer?",                                                       placeholder: "e.g. 28-45 locals and visitors, value quality, want a community feel" },
    { label: "What are the top 2–3 marketing or content tasks you spend time on each week?",    placeholder: "e.g. Writing Instagram captions, responding to Google reviews, designing promotions" },
    { label: "Have you used any AI tools (ChatGPT, Claude, etc.) before? What for?",            placeholder: "e.g. Used ChatGPT once to write an email, but found it too generic to be useful" },
    { label: "What tasks do you wish you had more time for or more help with?",                 placeholder: "e.g. Writing emails, brainstorming seasonal promotions, responding to negative reviews" },
    { label: "Biggest challenge with marketing or customer communication right now",             placeholder: "e.g. Keeping up with consistent Instagram content during busy season" },
    { label: "Types of content you want to create more of (social posts, emails, responses…)",  placeholder: "e.g. More Reels, better email newsletters, faster review responses" },
  ],

  // Bundles — use primary service questions as the base
  starter_intelligence_bundle: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 3 years, Bradley Beach NJ" },
    { label: "Who is your ideal customer?",                                                       placeholder: "e.g. 28-45, values quality and local authenticity" },
    { label: "Top 2–3 competitors",                                                               placeholder: "e.g. Starbucks on Main St, The Grind, bagel shop" },
    { label: "What makes you different from those competitors?",                                 placeholder: "e.g. In-house roasting, deep staff knowledge, loyal local following" },
    { label: "Biggest challenge right now",                                                      placeholder: "e.g. New competitor opened and is pulling afternoon regulars" },
    { label: "What does success look like in the next 12 months?",                              placeholder: "e.g. Stabilize customer base, grow revenue 20%" },
    { label: "Which social platforms are you currently using and how often?",                    placeholder: "e.g. Instagram 3x/week, Facebook once a week or less" },
    { label: "Links to your social profiles",                                                     placeholder: "e.g. instagram.com/anchorcoffeebb" },
    { label: "Anything else to focus on or address?",                                             placeholder: "e.g. Want to understand if our Instagram content is working for us" },
  ],

  field_report_bundle: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 3 years, Bradley Beach NJ" },
    { label: "Who is your ideal customer?",                                                       placeholder: "e.g. 28-45, values quality, wants local authenticity" },
    { label: "Top 2–3 competitors",                                                               placeholder: "e.g. Starbucks, The Grind, bagel shop with coffee counter" },
    { label: "What makes you different from those competitors?",                                 placeholder: "e.g. In-house roasting, staff knowledge, loyal following" },
    { label: "Biggest challenge right now",                                                      placeholder: "e.g. Inconsistent service quality, new competitor drawing regulars" },
    { label: "Business address (for the secret shop)",                                           placeholder: "e.g. 123 Main Ave, Bradley Beach NJ 07720" },
    { label: "Hours of operation and best time to visit",                                        placeholder: "e.g. Mon-Fri 7am-6pm. Best visit: weekday morning 9-11am" },
    { label: "What do you most want evaluated during the shop?",                                 placeholder: "e.g. Staff greeting, wait time at peak hours, product knowledge" },
    { label: "Anything else to focus on?",                                                       placeholder: "e.g. We've had reviews mentioning slow service — want to understand if it's staffing or process" },
  ],

  market_mind_bundle: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "How long in business, and where are you located?",                                 placeholder: "e.g. 2 years, Bradley Beach NJ" },
    { label: "Who is your ideal customer?",                                                       placeholder: "e.g. 28-45, values quality over price, wants a community feel" },
    { label: "Top 2–3 competitors",                                                               placeholder: "e.g. Starbucks, The Grind, bagel shop" },
    { label: "What makes you different from those competitors?",                                 placeholder: "e.g. In-house roasting, loyal local following, event programming" },
    { label: "What assumptions about your customers do you want to test?",                       placeholder: "e.g. We assume customers value atmosphere over price", rows: 4 },
    { label: "Most important questions you want answered about your customers",                  placeholder: "e.g. Would they pay $18 for a retail bag? What would make them come more often?", rows: 4 },
    { label: "What marketing are you currently doing, if any?",                                  placeholder: "e.g. Instagram 3x/week, occasional email to ~400 people" },
    { label: "What does success look like in the next 12 months?",                              placeholder: "e.g. Stabilize customer base, grow revenue 20%, build off-season strategy" },
    { label: "Anything else to focus on or address?",                                             placeholder: "e.g. Considering a $35/month coffee subscription — customer reactions helpful" },
  ],

  complete_shopper_experience_bundle: [
    { label: "Business name and what you sell or offer",                                         placeholder: "e.g. Anchor Coffee Co., specialty coffee shop" },
    { label: "Business address",                                                                  placeholder: "e.g. 123 Main Ave, Bradley Beach NJ 07720" },
    { label: "Industry / business type",                                                          placeholder: "e.g. Coffee Shop, Retail Boutique, Restaurant" },
    { label: "Hours of operation and best time to visit",                                        placeholder: "e.g. Mon-Fri 7am-6pm. Best visit: weekday morning 9-11am" },
    { label: "What does a typical customer interaction look like?",                              placeholder: "e.g. Walk in, order at counter, wait for drink, find a seat", rows: 3 },
    { label: "Specific experience dimensions to evaluate during the shop",                       placeholder: "e.g. Greeting, wait time, product knowledge, restroom upkeep" },
    { label: "How many customer contacts do you have for the survey?",                           placeholder: "e.g. ~400 email addresses from our loyalty program" },
    { label: "What do you most want to learn from your customers?",                              placeholder: "e.g. Why they choose us, what would make them come more often", rows: 3 },
    { label: "What are you most concerned about or want us to focus on in the shop?",           placeholder: "e.g. Google reviews mention slow service at lunch — want to understand root cause" },
    { label: "What decision will the customer survey inform?",                                    placeholder: "e.g. Whether to expand hours, add a subscription model" },
  ],
};

/** Deep Dive extra questions (Q11 and Q12) — stored in service_data, not q1-q10 */
export const DEEP_DIVE_EXTRA_QUESTIONS: ManualIntakeQuestion[] = [
  {
    label: "11. What specific decision are you trying to make or problem are you trying to solve with this report?",
    placeholder: "e.g. Deciding whether to sign a lease on a second location in Asbury Park by end of Q3. Need to know if the market can support it and whether our brand positioning translates.",
    rows: 4,
  },
  {
    label: "12. Have you done any market research before? If so, what did you learn?",
    placeholder: "e.g. Customer survey two years ago — ~30 responses. People come for atmosphere as much as coffee. Haven't done anything formal since.",
    rows: 3,
  },
];

/** Whether to show the Location helper field (prepends to Q2) */
export function showLocationHelper(type: ServiceType): boolean {
  // Services that do NOT need the Location helper field:
  // SS/bundles-with-SS: Q2 is a full address field
  // VoC: Q1 already includes location
  // SMA: location is not relevant for a social media audit
  const noHelper: ServiceType[] = ["secret_shopping", "voice_of_customer_survey", "complete_shopper_experience_bundle", "field_report_bundle", "social_media_audit"];
  return !noHelper.includes(type);
}

/**
 * Returns the question labels shown in the "Intake Answers" panel for a given
 * service type. Derived from MANUAL_INTAKE_QUESTIONS so the label shown when
 * VIEWING an order always matches the label shown when CREATING it.
 * Shorter question sets are padded to 10 with "(not used)".
 */
export function getQuestionLabels(type: ServiceType): string[] {
  const questions = MANUAL_INTAKE_QUESTIONS[type];
  if (!questions || questions.length === 0) return MIR_QUESTIONS;
  const labels = questions.map(q => q.label);
  while (labels.length < 10) labels.push("(not used)");
  return labels;
}
