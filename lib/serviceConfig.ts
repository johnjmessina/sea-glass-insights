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
  { key: "platform_utilization_review",   label: "Platform Utilization Review",          aiGenerated: true },
  { key: "competitive_social_comparison", label: "Competitive Social Comparison",        aiGenerated: true },
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

export const VOC_PHASE1_SECTIONS: ServiceSection[] = [
  { key: "survey_design", label: "Survey Design", aiGenerated: true,
    description: "AI drafts up to 10 survey questions from intake answers. Output is clean copy-paste text ready for Google Forms." },
];

export const VOC_PHASE2_SECTIONS: ServiceSection[] = [
  { key: "response_summary",        label: "Response Summary",                    aiGenerated: false, humanOnly: true,
    description: "Paste the collected survey responses here." },
  { key: "thematic_analysis",       label: "Thematic Analysis",                   aiGenerated: true },
  { key: "visual_findings_summary", label: "Visual Findings Summary",             aiGenerated: true },
  { key: "analyst_interpretation",  label: "Analyst Interpretation & Recommendations", aiGenerated: true },
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

export function getQuestionLabels(type: ServiceType): string[] {
  switch (type) {
    case "secret_shopping":         return SS_QUESTIONS;
    case "voice_of_customer_survey":return VOC_QUESTIONS;
    default:                        return MIR_QUESTIONS;
  }
}
