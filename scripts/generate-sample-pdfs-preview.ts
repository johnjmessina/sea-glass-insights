#!/usr/bin/env npx tsx
/**
 * generate-sample-pdfs-preview.ts
 *
 * Downloads PDFs using hardcoded sample data — no AI generation, no API credits.
 * Creates a minimal order in Supabase (business name only), then passes rich
 * static fixtures directly to each PDF route.
 *
 * Usage:
 *   npm run sample-pdfs-preview
 *   BASE_URL=https://your-deployment.vercel.app npx tsx scripts/generate-sample-pdfs-preview.ts
 *
 * PDFs land in ./sample-pdfs/
 */

import fs   from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const OUT_DIR  = path.join(process.cwd(), "sample-pdfs");

const SAMPLE_BUSINESS = {
  customerName: "Sea Glass Test",
  businessName: "Coastal Brew Coffee",
  email:        "test@seaglassinsights.com",
  location:     "Asbury Park, NJ",
};

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function post(endpoint: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`${endpoint} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function downloadPdf(endpoint: string, body: unknown, filename: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`PDF ${endpoint} → ${res.status}: ${text}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
}

// ── Static fixtures ──────────────────────────────────────────────────────────

const SS_SCORECARD = {
  fi_exterior_signage: true,  fi_entrance_clear: true,  fi_hours_posted: true,
  fi_acknowledged_60s: true,  fi_greeting_quality: 4,   fi_overall_first: 4,
  pe_clean: true,             pe_organized: true,       pe_interior_signage: true,
  pe_lighting: true,          pe_music: false,          pe_temperature: true,
  pe_overall_env: 4,          pe_visual_merch: 3,
  se_visible: true,           se_natural: true,         se_listened: true,
  se_accurate: true,          se_friendliness: 5,       se_knowledge: 4,
  se_objection: 3,            se_consistency: 4,
  ce_easy_find: true,         ce_upsell_attempted: false, ce_upsell_helpful: false,
  ce_matched_promise: true,   ce_relevance: 4,          ce_personalization: 3,
  ce_valued: 4,
  pp_efficient: true,         pp_accurate: true,        pp_loyalty: false,
  pp_receipt: true,           pp_packaging: true,       pp_checkout_staff: 4,
  pp_farewell: 4,
  dt_findable: true,          dt_website_accurate: true, dt_hours_match: true,
  dt_contact_accurate: true,  dt_reviews_responded: false, dt_overall_digital: 3,
  li_would_return: true,      li_would_recommend: true, li_gut_score: 4,
};

const SS_ANALYST_OBS = {
  best_moment:             "Barista remembered a returning customer's name and order — genuine warmth that feels impossible to replicate at a chain.",
  biggest_miss:            "No loyalty program mentioned at any point during the visit, even at checkout where it would be most natural.",
  immediate_fix:           "Add a simple counter card or verbal script for staff to mention the loyalty program at checkout.",
  additional_observations: "The outdoor seating area was not fully set up on a mild day — missed opportunity for extended dwell time and secondary purchases.",
};

const SS_VISIT_OVERVIEW = {
  business_name:    "Coastal Brew Coffee",
  location:         "Asbury Park, NJ",
  date_of_visit:    "2026-09-28",
  time_of_visit:    "10:15 AM",
  shopper_scenario: "First-time visitor ordering a specialty drink and browsing retail bags",
  template_used:    "Standard Retail / Café",
};

const SS_AI_DRAFT = {
  narrative_notes: {
    first_impression:     "The shop makes a confident and welcoming first impression. Exterior signage is clear and well-maintained, parking is accessible, and the entrance communicates a sense of intentionality that distinguishes an independent roaster from a chain environment. Visitors are greeted warmly upon entry, establishing an immediate sense of belonging — a critical differentiator for a business whose core identity is rooted in community and craft.",
    physical_environment: "The interior environment reflects a well-kept and thoughtfully curated space. Cleanliness was consistent throughout, signaling operational discipline and respect for the guest experience. However, the ambiance fell short in one area: the music atmosphere was not landing as intended. The outdoor seating area remained largely unset on a mild, seasonably appropriate day — that untapped space represents lost dwell time and secondary purchase opportunities.",
    staff_engagement:     "Staff engagement is this shop's clearest competitive advantage. The standout moment — a barista recognizing a returning customer by name and recalling their order without prompting — is the kind of authentic human warmth no regional chain can manufacture. Menu knowledge was strong, the farewell felt genuine. Two gaps emerged: wait times were not proactively acknowledged, and no upsell attempt was made at any point.",
    core_experience:      "The core coffee experience held up well — order accuracy was reliable, packaging was presented with care, and the product quality clearly reflects the in-house roasting commitment. Where the experience leaves room to grow is in storytelling: the roasting identity and sourcing narrative were not actively surfaced during the visit.",
    purchase_process:     "The transactional mechanics were smooth and friction-free. However, the checkout moment — the highest-engagement point of the entire visit — was left underutilized. No loyalty program was mentioned. For a shop actively considering a loyalty app and trying to build return visit frequency, this silence at the register is a structural problem.",
    digital_touchpoints:  "Digital engagement was not a visible part of the in-store experience. With approximately 1,400 Instagram followers and self-described low engagement, the shop's online identity is not yet working proportionally to its in-person strengths. The content opportunity is substantial, particularly given the visual richness of roasting and preparation.",
    lasting_impression:   "Guests leave with a generally positive impression, anchored by product quality and staff warmth. However, nothing structural is in place to convert that warm feeling into a documented relationship — no loyalty card in hand, no prompt to follow on Instagram, no reason given to make the shop a habit rather than a pleasant stop.",
  },
  summary_and_recommendations: `This shop's most powerful asset is its people. The moment a barista recalled a returning customer's name and order without prompting is not a small thing — it is the precise kind of experience that builds durable loyalty and that a chain competitor structurally cannot replicate.

The most urgent improvement is closing the loyalty loop at checkout. Every transaction is currently ending without a mechanism to formalize the relationship. A loyalty program that is never mentioned is a loyalty program that does not exist in practice.

On the question of food versus loyalty app: the data supports prioritizing the loyalty infrastructure first. The shop's challenge is afternoon retention and return visit frequency — both of which loyalty mechanics directly address.

For the growth path forward, four specific actions stand out: First, activate the outdoor seating area consistently on appropriate weather days with a brief staff checklist tied to open procedures — this alone could recover meaningful secondary purchase revenue. Second, build a social content strategy around the roasting process and the people behind the bar — this is distinctive, visual, and genuine. Third, introduce a simple upsell script for retail bags tied to the drinks customers already order. Fourth, delay second-location planning until the loyalty infrastructure and afternoon traffic recovery are underway.`,
};

const MIR_AI_DRAFT = {
  executive_summary:       "Coastal Brew Coffee occupies a defensible niche as the Shore's premier independent specialty roaster, with authentic craft credentials and staff-driven loyalty that a chain competitor cannot replicate at scale. The 12% weekday afternoon traffic decline warrants attention but signals an awareness gap rather than a fundamental rejection of the indie experience. Priority actions center on loyalty infrastructure, afternoon traffic recovery, and a disciplined digital content strategy before any expansion decision.",
  business_snapshot:       { overview: "Independent specialty coffee shop, in operation 3 years, single location in Asbury Park NJ. In-house roasting operation serving espresso drinks and retail whole-bean bags. Avg ticket $7.20. Highest-margin items are house blends.", financials: "Revenue growth target: 20% over next 12 months without significant headcount increase. No current loyalty program. Instagram presence: ~1,400 followers, low engagement." },
  customer_profile:        { segments: "Two primary segments: weekday morning regulars (25–45, local residents, habit-driven) and weekend tourists (seasonal beach visitors, discovery-driven). Secondary: remote workers seeking reliable WiFi environment.", behavior: "Regulars are loyalty candidates but retention mechanisms are absent. Tourists represent one-time high-value visits with no current conversion to repeat engagement." },
  competitive_landscape:   { primary: "Playa Coffee — regional chain, opened nearby 6 months ago. Drive-through format appeals to convenience-driven customers. Self-reported to have captured 12% of Coastal Brew's weekday afternoon traffic.", differentiation: "Coastal Brew holds a clear quality and authenticity advantage. Staff warmth and in-house roasting create genuine experiential differentiation that Playa cannot replicate." },
  positioning:             { current: "Premium indie roaster — positioned on craft, community, and authenticity. Identity is strong but undercommunicated both digitally and in-store.", opportunity: "The roasting story is a high-value brand asset that is currently invisible to most customers. Surfacing it through content and in-store storytelling would reinforce premium positioning." },
  insights:                { key_findings: "1. Loyalty loop is broken — the program exists but is never mentioned at the point of maximum engagement (checkout). 2. Digital presence is underperforming relative to in-store experience quality. 3. Outdoor seating is an untapped revenue asset. 4. Retail bag upsell is absent despite being the highest-margin category.", risk: "Second-location expansion before core retention infrastructure is in place risks replicating the vulnerability at scale." },
  recommendations:         { immediate: "Implement staff-scripted loyalty mention at checkout. Deploy outdoor seating consistently on appropriate weather days. Introduce retail bag upsell conversation tied to drink orders.", medium_term: "Develop roasting-focused social content strategy. Pilot weekend pastry partnership on 60-day trial. Evaluate loyalty app after verbal program awareness is established.", long_term: "Use loyalty data to inform second-location timing and format. Assess mobile cart for beach events as lower-risk expansion test." },
};

const SMA_AI_DRAFT = {
  profile_setup:          { handle: "@coastalbrewcoffee", platforms: "Instagram (primary), Facebook (inactive)", bio_quality: "Bio communicates location and coffee focus but lacks a clear value prop or call to action. No link-in-bio strategy.", setup_score: 62 },
  content_quality:        { assessment: "Content skews toward product shots and seasonal specials. Quality is inconsistent — some posts are visually compelling, others are low-effort. No behind-the-scenes roasting content despite this being the shop's clearest differentiator.", score: 58 },
  posting_consistency:    { frequency: "2–3 posts per week on average, with gaps during busy seasons when it would be most impactful.", consistency_score: 45 },
  engagement_assessment:  { avg_engagement_rate: "1.2% — below industry average for independent food/bev (~3.5%)", notes: "Low engagement likely reflects content that doesn't invite interaction. No questions posed to audience, no UGC strategy, no story polls or Q&A use." },
  brand_consistency:      { visual_identity: "Inconsistent. Some posts use a warm coastal palette that aligns with the brand; others feel generic. No defined color palette or typography system for social.", score: 55 },
  platform_utilization:   { instagram: "Stories underused. Reels not utilized. Grid is the sole focus, missing the higher-reach formats.", facebook: "Page exists but appears dormant. No benefit from maintaining unless actively resourced." },
  overall_score_recs:     { overall_score: 54, summary: "Social presence is underperforming relative to in-store experience quality. The content opportunity is substantial — the roasting process, staff personalities, and Shore aesthetic are all inherently visual and authentic. A simple, consistent content strategy would dramatically outperform the current ad-hoc approach.", top_recommendations: "1. Define a visual identity system for social (2–3 colors, consistent filter, text overlay style). 2. Commit to 4 posts/week with a content calendar: Monday roasting behind-the-scenes, Wednesday product/drink, Friday community/staff, Sunday seasonal. 3. Activate Instagram Stories for daily connection — polls, questions, 'what's brewing today'. 4. Introduce a UGC prompt at checkout: 'Tag us for a chance to be featured.'" },
};

const SSR_AI_DRAFT = {
  research_question_framework: { question: "Would our core customer base pay $35/month for a coffee subscription with weekly bag pickup and 10% off in-store?", hypothesis: "Regulars with established weekly visit patterns are likely candidates. Tourists and occasional visitors are unlikely subscribers. Price sensitivity and flexibility of pickup timing are key friction points.", methodology: "Synthetic survey simulation across 4 distinct customer personas derived from stated customer demographics and behavioral patterns." },
  customer_personas:           [{ name: "The Morning Regular", description: "34F, local resident, visits 4–5x/week, weekday mornings. Values consistency, staff recognition, quality. Low price sensitivity. High loyalty candidate.", likelihood_score: 82 }, { name: "The Weekend Tourist", description: "45M, seasonal visitor, visits 3–4x/summer. Discovery-driven, not a subscription candidate. Values experience over program.", likelihood_score: 18 }, { name: "The Remote Worker", description: "29NB, visits 2–3x/week for WiFi. High dwell time. Subscription appeals if pickup is flexible and includes a discount on in-store orders.", likelihood_score: 67 }, { name: "The Occasional Local", description: "38F, visits 1–2x/month when time allows. Convenience-driven — often chooses Playa for speed. Subscription would need to create urgency to visit.", likelihood_score: 31 }],
  thematic_analysis:           { key_themes: "1. Flexibility is the primary friction point — rigid weekly pickup doesn't match irregular schedules. 2. The in-store discount is the most compelling element of the offer. 3. Roast customization would significantly increase appeal. 4. Trust in the brand is high; the barrier is logistical, not relational.", sentiment: "Cautiously positive. The offer has real appeal for the core segment but the format needs refinement before broad rollout." },
  directional_recommendations: { recommendation: "Pilot with the 'Morning Regular' segment first — highest likelihood, lowest acquisition friction. Offer 2-week pickup windows instead of rigid weekly cadence. Lead with the in-store discount as the headline benefit, not the subscription itself. Test roast customization as an add-on at higher price point ($42/month).", confidence: "Medium-high for core segment. Low for tourist and occasional segments." },
  methodology_disclosure:      { approach: "Synthetic persona simulation based on stated customer demographics, behavioral self-report, and standard consumer psychology frameworks for subscription adoption.", limitations: "Simulated responses cannot substitute for real customer interviews or survey data. Results are directional, not predictive." },
  honest_limitations_statement:{ statement: "This report simulates likely customer responses based on described segments. It should be treated as a structured hypothesis-generation tool, not a predictive model. We recommend validating the top two findings with 8–10 real customer conversations before making any subscription investment decision.", confidence_level: "Medium — suitable for initial go/no-go framing, not final commitment." },
};

const DDR_AI_DRAFT = {
  executive_summary:              "The core strategic question — second location in Long Branch vs. mobile cart for beach events — resolves clearly in favor of the mobile cart as a first expansion move. Long Branch requires capital, staffing, and lease commitment before the core retention problem at the Asbury Park location is solved. A beach cart tests the brand in the tourist channel with minimal downside, generates real market data, and preserves optionality for a permanent second location informed by actual demand signals.",
  business_snapshot:              { overview: "3-year independent specialty coffee operation, single location Asbury Park NJ. In-house roasting. Avg ticket $7.20. 12% weekday afternoon traffic decline since Playa Coffee opened.", strengths: "Staff warmth, product quality, roasting authenticity, established local loyalty base.", vulnerabilities: "No loyalty infrastructure, underperforming digital presence, no conversion mechanism for tourist visits." },
  customer_segments:              { regulars: "High-value, habit-driven. Loyalty is behavioral but not formalized — no program captures or reinforces it. Primary retention risk if morning routine is disrupted.", tourists: "High first-visit potential, zero repeat mechanism. Currently leaves with a good experience and no connection to the brand.", remote_workers: "High dwell time, high secondary purchase potential. WiFi reliability is a churn risk." },
  competitive_intelligence:       { playa_coffee: "Regional chain with drive-through convenience. Captured afternoon traffic through speed, not quality. Unlikely to match Coastal Brew's craft positioning. Threat is habitual, not experiential.", opportunity: "Coastal Brew wins on every quality dimension. The competitive gap is awareness and convenience, not product." },
  market_context:                 { shore_market: "Jersey Shore summer economy is heavily tourist-driven with strong June–September spike. Weekday traffic is local and habitual. Weekend traffic is mixed and discovery-driven.", trends: "Independent coffee shops with strong local identity are outperforming chains in post-pandemic loyalty metrics nationally. Authenticity is a durable differentiator." },
  decision_specific_analysis:     { long_branch_second_location: "Requires 12–18 month lead time, $180–240K estimated buildout, new hiring, and management attention that would pull focus from the Asbury Park retention problem. Risk: replicates the current vulnerability at scale before it's solved.", mobile_cart: "Estimated $15–25K entry cost. Deploys in the tourist channel (beach events, farmers markets, festivals) where Coastal Brew currently has zero presence. Tests brand beyond the Asbury Park block with minimal commitment. Generates real revenue and market data." },
  extended_recommendations:       { primary: "Pursue mobile cart as first expansion vehicle. Target 3–4 summer weekend events to validate demand before committing to a permanent unit.", secondary: "Solve the Asbury Park loyalty loop first — staff-scripted checkout mention, counter card, basic punch card if app timeline is long. This takes one week and costs almost nothing.", tertiary: "Develop a roasting content series for Instagram: 5 posts per week showing the process, the people, and the product. This is the single highest-leverage marketing investment available at current scale." },
  priority_action_framework:      { phases: [{ phase: "Week 1–2", actions: ["Implement loyalty mention script at checkout", "Deploy outdoor seating checklist in morning open procedures", "Brief staff on retail bag upsell conversation"] }, { phase: "Month 1", actions: ["Launch Instagram content calendar — roasting series, staff features, product stories", "Book first beach/event appearance for mobile cart concept test", "Pilot weekend pastry offering from local bakery partnership"] }, { phase: "Quarter 2", actions: ["Evaluate loyalty app ROI based on verbal program data", "Assess mobile cart event performance for permanent unit decision", "Revisit Long Branch analysis with 6 months of additional retention data"] }] },
  expanded_analyst_interpretation:{ strategic_framing: "The core tension in this business is between a genuinely exceptional in-store experience and an almost complete absence of mechanisms to extend that experience beyond the physical visit. Every gap identified — no loyalty follow-through, no digital conversion, no tourist retention — is a version of the same problem: the shop is excellent at creating the moment and poor at capturing it.", competitive_read: "Playa Coffee is not winning on quality. It is winning on habit and convenience for a specific use case (the rushed weekday afternoon). Coastal Brew should not try to compete on that dimension — it will lose. The response is to deepen loyalty among customers who already value what Coastal Brew does, and to reach the tourist segment before they form a Playa habit.", long_term_view: "The second location question should be answered by data, not ambition. The mobile cart generates that data at 10% of the cost and risk. If beach event revenue is strong and the Coastal Brew brand travels well outside the Asbury Park block, Long Branch becomes an obvious next step. If it doesn't travel, that's critical information worth $20K to learn." },
};

const VOC_AI_DRAFT = {
  survey_design:         { methodology: "Phase 2 open-response customer interviews (8 respondents). Mix of regular customers, occasional visitors, and one tourist. Age range 28–52. Gender-diverse sample.", questions_covered: "Brand loyalty drivers, competitive awareness, digital engagement, subscription interest, WiFi/dwell experience." },
  quant_summary:         { questions: [{ question: "Overall satisfaction with Coastal Brew Coffee", segments: [{ label: "Regular", t2b: 94, mean: 4.7 }, { label: "Occasional", t2b: 71, mean: 3.9 }, { label: "Tourist", t2b: 88, mean: 4.4 }] }, { question: "Likelihood to recommend to a friend", segments: [{ label: "Regular", t2b: 91, mean: 4.6 }, { label: "Occasional", t2b: 65, mean: 3.7 }, { label: "Tourist", t2b: 85, mean: 4.3 }] }, { question: "Value for price paid", segments: [{ label: "Regular", t2b: 82, mean: 4.2 }, { label: "Occasional", t2b: 58, mean: 3.5 }, { label: "Tourist", t2b: 79, mean: 4.1 }] }] },
  thematic_analysis:     { themes: [{ title: "Staff Recognition as the Core Loyalty Driver", body: "The most consistent theme across regular customers is the experience of being known — staff remembering names and orders creates a feeling of belonging that respondents explicitly contrast against chain experiences. This is the shop's primary competitive moat." }, { title: "Digital Presence Underdelivering", body: "Multiple respondents discovered the shop through Instagram but noted the feed doesn't reflect the richness of the in-store experience. The roasting process and staff personalities — the most compelling content assets — are largely absent from the social feed." }, { title: "Convenience Friction Creates Playa Vulnerability", body: "Respondents who occasionally choose Playa Coffee consistently cite time as the driver, not preference. The battle for these customers is not quality — it's reducing the perceived time cost of choosing Coastal Brew." }, { title: "Subscription Interest is Real but Format-Sensitive", body: "Subscription resonates with regulars when framed around customization and flexibility. Rigid weekly pickup is the most cited deterrent. An in-store discount component significantly increases appeal across all segments." }] },
  visual_findings_summary: { themes: [{ title: "Top Loyalty Driver: Staff Recognition", body: "7 of 8 respondents cited staff warmth and personalization as the primary reason they return or recommend." }, { title: "Competitive Awareness is High", body: "All respondents were aware of Playa Coffee's opening. 3 of 8 had tried it. Quality verdict was consistent: Coastal Brew wins on product, Playa wins on speed." }, { title: "Content Gap is Visible to Customers", body: "4 respondents expressed interest in behind-the-scenes roasting content. None had seen it on the shop's social channels." }] },
  analyst_interpretation: { key_recommendation_1: "Formalize what's already working: the staff recognition culture is the brand's most defensible asset. Build a simple onboarding practice that makes name-and-order memory a standard for new hires, not just a personality trait of current staff.", key_recommendation_2: "Close the digital gap with the one story customers actually want: the roasting process. Three short-form videos per week showing the roast, the grind, and the pour would outperform months of generic product shots.", key_recommendation_3: "Test a flexible subscription format: 'any 4 pickups per month' rather than weekly, with the in-store discount as the headline. Pilot with 20 regulars before any app investment." },
};

const AISK_AI_DRAFT = {
  business_type_analysis:  { business_type: "Independent Specialty Coffee Roaster", key_characteristics: "Artisan product with strong craft identity. Staff-driven loyalty. Dual customer base (local regulars + seasonal tourists). Limited marketing resources. High opportunity for authentic content and customer relationship tools.", ai_opportunity: "AI is most useful here for: consistent customer communication, social content generation, loyalty program management, and competitive research that would otherwise require consultant engagement." },
  ai_best_practices:       { principles: "Start narrow: one use case mastered is worth ten half-implemented. AI tools amplify what's already working — they don't fix what's broken. For a staff-first business like Coastal Brew, AI should handle the repetitive and the administrative so the humans can focus on the irreplaceable.", pitfalls: "Avoid using AI to replace the authentic voice that customers already respond to. AI-generated social posts that sound generic will underperform the real thing. Use AI to draft, humans to refine and post." },
  custom_prompt_1:         { title: "Weekly Social Content Planner", prompt: "You are a social media content strategist for Coastal Brew Coffee, an independent specialty coffee shop in Asbury Park, NJ. We roast our own beans in-house and our strongest differentiator is our staff's genuine relationships with regular customers.\n\nFor this week, create a 4-post Instagram content plan. For each post include: the content concept, a caption draft (under 150 words, conversational, no hashtag spam), and one story idea to support it. The tone should feel like a real person who loves coffee and their community — not a marketing department.\n\nThis week's focus: [INSERT FOCUS — e.g., 'our fall roast launch' or 'introducing a new team member']" },
  custom_prompt_2:         { title: "Customer Response Templates", prompt: "You are helping Coastal Brew Coffee respond to customer reviews and messages. The shop's voice is warm, genuine, and community-rooted — never corporate or scripted-feeling.\n\nWrite a response to the following review. Acknowledge specifically what they mentioned, add one personal detail if possible, and invite them back naturally:\n\nReview: [PASTE REVIEW HERE]\n\nKeep the response under 80 words. Don't use the phrase 'Thank you for your feedback.'" },
  custom_prompt_3:         { title: "Loyalty Program Script Generator", prompt: "Write a short, natural verbal script for Coastal Brew Coffee staff to use when mentioning our loyalty program at checkout. The tone should feel like a genuine recommendation from a person, not a sales pitch.\n\nContext: the customer just paid and is waiting for their order. The staff member should mention the loyalty program in a way that feels helpful and low-pressure.\n\nCreate 3 variations: one for a first-time visitor, one for a returning customer who isn't enrolled, and one for an existing member checking their status." },
  custom_prompt_4:         { title: "Competitive Monitor Summary", prompt: "I'm going to paste in recent Google and Yelp reviews for Playa Coffee in Asbury Park, NJ — our main competitor. Summarize: (1) what customers like most about Playa, (2) what complaints appear repeatedly, and (3) any gaps in their experience that Coastal Brew could directly address in our own marketing or operations.\n\nReviews: [PASTE REVIEWS HERE]\n\nKeep the summary under 300 words. Focus on actionable intelligence, not general observations." },
  custom_prompt_5:         { title: "Event & Seasonal Promotion Brief", prompt: "Coastal Brew Coffee is planning a [INSERT EVENT TYPE — e.g., 'fall harvest popup' or 'holiday retail bag promotion']. Write a complete promotional brief including: a headline, a short description for social media, suggested in-store signage copy, and one email subject line.\n\nEvent details: [DESCRIBE EVENT]\nDate/duration: [DATES]\nKey offer: [WHAT CUSTOMERS GET]\n\nTone: warm, community-forward, artisan — not discount-driven." },
  custom_prompt_6:         { title: "Monthly Business Reflection Prompt", prompt: "At the end of each month, use this prompt to reflect on business performance and set priorities.\n\nThis month at Coastal Brew Coffee:\n- Revenue vs. last month: [UP/DOWN X%]\n- Biggest win: [DESCRIBE]\n- Biggest frustration: [DESCRIBE]\n- Customer feedback theme: [WHAT WERE YOU HEARING]\n- One thing I avoided dealing with: [BE HONEST]\n\nBased on the above, give me: (1) the one thing that actually matters most to address next month, (2) a 3-step action plan for it, and (3) one question I should be asking that I'm probably not." },
  real_use_case_examples:  { use_cases: [{ title: "Content Calendar in 20 Minutes", body: "The owner used the Weekly Social Content Planner prompt every Sunday evening. In 20 minutes they had a full week of Instagram content drafted and ready to review. Engagement increased 40% over 6 weeks as posting became consistent." }, { title: "Turning a Negative Review Into a Loyal Customer", body: "A 3-star review mentioned a long wait time with no acknowledgment. The Customer Response Template produced a warm, specific reply in 3 minutes. The reviewer returned the following week and updated to 5 stars." }, { title: "The Checkout Script That Doubled Loyalty Signups", body: "Three variations of the loyalty mention script were tested with staff. The 'returning customer' version outperformed the others. Loyalty program enrollment increased from 2/day to 9/day within two weeks of consistent use." }] },
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`Output directory: ${OUT_DIR}`);
  log(`Targeting: ${BASE_URL}`);
  log(`Mode: PDF-only (no AI generation — using hardcoded fixtures)`);
  log("─".repeat(60));

  const results: Array<{ service: string; file: string; status: "ok" | "error"; error?: string }> = [];

  // Create a single shared order for all PDFs
  log("\n▶ Creating shared test order…");
  const order = await post("/api/manual-order", {
    ...SAMPLE_BUSINESS,
    serviceType: "market_intelligence_report",
    q1: "Independent specialty coffee shop. We roast in-house.",
  }) as { id: string };
  const orderId = order.id;
  log(`  Order: ${orderId}`);

  // ── 1. Market Intelligence Report ─────────────────────────────────────────
  {
    const label = "Market Intelligence Report";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-MarketIntelligenceReport.pdf";
      await downloadPdf("/api/generate-pdf", { orderId, aiDraft: MIR_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 2. Social Media Audit ─────────────────────────────────────────────────
  {
    const label = "Social Media Audit";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-SocialMediaAudit.pdf";
      await downloadPdf("/api/generate-sma-pdf", { orderId, aiDraft: SMA_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 3. Synthetic Survey Report ────────────────────────────────────────────
  {
    const label = "Synthetic Survey Report";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-SyntheticSurveyReport.pdf";
      await downloadPdf("/api/generate-ssr-pdf", { orderId, aiDraft: SSR_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 4. Deep Dive Report ───────────────────────────────────────────────────
  {
    const label = "Deep Dive Report";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-DeepDiveReport.pdf";
      await downloadPdf("/api/generate-ddr-pdf", { orderId, aiDraft: DDR_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 5. Secret Shopping ────────────────────────────────────────────────────
  {
    const label = "Secret Shopping";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-SecretShopping.pdf";
      await downloadPdf("/api/generate-ss-pdf", {
        orderId,
        visitOverview: SS_VISIT_OVERVIEW,
        scorecard:     SS_SCORECARD,
        analystObs:    SS_ANALYST_OBS,
        aiDraft:       SS_AI_DRAFT,
      }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 6. Voice of Customer Survey ───────────────────────────────────────────
  {
    const label = "Voice Of Customer Survey";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-VoiceOfCustomerSurvey.pdf";
      await downloadPdf("/api/generate-voc-pdf", { orderId, aiDraft: VOC_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── 7. AI Starter Kit ─────────────────────────────────────────────────────
  {
    const label = "AI Starter Kit";
    log(`\n▶ ${label}`);
    try {
      const filename = "SamplePDF-AiStarterKit.pdf";
      await downloadPdf("/api/generate-aisk-pdf", { orderId, aiDraft: AISK_AI_DRAFT }, filename);
      log(`  ✓ ${filename}`);
      results.push({ service: label, file: filename, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log("\n" + "═".repeat(60));
  log("SUMMARY");
  log("═".repeat(60));
  for (const r of results) {
    if (r.status === "ok") {
      log(`  ✓  ${r.service.padEnd(35)} → sample-pdfs/${r.file}`);
    } else {
      log(`  ✗  ${r.service.padEnd(35)} FAILED: ${r.error}`);
    }
  }
  log("═".repeat(60));
  log(`\nDone. Open the sample-pdfs/ folder to review.`);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
