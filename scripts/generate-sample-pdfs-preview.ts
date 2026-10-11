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
  executive_summary:
    "Coastal Brew Coffee occupies a defensible niche as the Shore's premier independent specialty roaster, with authentic craft credentials and staff-driven loyalty that a chain competitor cannot replicate at scale. The 12% weekday afternoon traffic decline warrants attention but signals an awareness gap rather than a fundamental rejection of the indie experience. Priority actions center on loyalty infrastructure, afternoon traffic recovery, and a disciplined digital content strategy before any expansion decision.",

  business_snapshot: {
    business_name:        "Coastal Brew Coffee",
    location:             "Asbury Park, NJ",
    business_descriptor:  "Independent specialty coffee shop & in-house roaster",
    time_in_business:     "3 years",
    business_type:        "Specialty Coffee / Retail",
    business_stage:       "Growth",
    primary_offering:     "Espresso drinks, pour-overs, and retail whole-bean bags roasted in-house",
    target_customer:      "Local weekday regulars (25–45) and seasonal beach tourists",
    top_competitors:      ["Playa Coffee (regional chain)", "Dunkin' (convenience)", "Home brewing"],
    marketing_channels:   ["Instagram", "Word of mouth", "In-store signage"],
    key_challenge:        "12% weekday afternoon traffic decline; no loyalty retention infrastructure",
    success_goal:         "20% revenue growth over next 12 months without significant headcount increase",
  },

  customer_profile: [
    {
      name:       "Weekday Morning Regular",
      desc:       "Local residents aged 25–45 who build their morning routine around Coastal Brew. High visit frequency, high loyalty potential, no current retention mechanism.",
      motivation: "Habit, quality, and genuine connection with staff",
      key_need:   "A reason to feel recognized and rewarded for their loyalty",
    },
    {
      name:       "Weekend Beach Tourist",
      desc:       "Seasonal visitors discovering Coastal Brew through proximity or word of mouth. High average ticket, zero repeat engagement infrastructure.",
      motivation: "Discovery, local authenticity, a break from chain coffee",
      key_need:   "Something to take home — a bag of beans, a reason to return next summer",
    },
    {
      name:       "Remote Worker",
      desc:       "Professionals seeking a reliable work environment with quality coffee. Mid-day dwell time, WiFi-dependent, willing to pay a premium for the environment.",
      motivation: "Productive environment plus quality beverage",
      key_need:   "Consistent WiFi, a reason to stay longer and order more",
    },
  ],

  competitive_landscape: [
    {
      name:     "Playa Coffee",
      strength: "Regional chain with drive-through format — pure convenience play. Opened nearby 6 months ago; self-reported to have taken 12% of Coastal Brew's weekday afternoon traffic.",
      edge:     "Coastal Brew wins on quality, authenticity, and human connection — all things a drive-through cannot replicate.",
    },
    {
      name:     "Dunkin'",
      strength: "Price and speed. Dominant with the convenience-first customer who views coffee as a commodity.",
      edge:     "No overlap on the target customer. Coastal Brew's drinker has already self-selected out of the Dunkin' experience.",
    },
    {
      name:     "Home Brewing",
      strength: "Zero cost per cup and total convenience. Accelerated during pandemic; some habitual customers shifted permanently.",
      edge:     "Retail whole-bean sales convert the home brewer into a Coastal Brew customer six days a week instead of one.",
    },
  ],

  positioning: {
    strengths: [
      "In-house roasting is a genuine and rare differentiator — almost no indie shops at this scale roast on-premise",
      "Staff warmth is measurable in customer retention and word-of-mouth; chains cannot replicate this at scale",
      "Physical location is high-foot-traffic and walkable from the beach — a natural discovery point for tourists",
      "Craft credentials are real and communicable — the story exists, it just isn't being told",
    ],
    vulnerabilities: [
      "Loyalty program exists but is never mentioned at checkout — the moment of maximum engagement",
      "Digital presence (1,400 Instagram followers, low engagement) dramatically underrepresents actual brand quality",
      "No mechanism to convert tourists into ongoing customers — every summer visit is a one-time transaction",
      "Outdoor seating is an available revenue asset that is inconsistently deployed",
    ],
  },

  insights: [
    {
      title: "The loyalty loop is broken at the last inch",
      body:  "The program exists and customers are interested — staff simply never mention it at checkout. Scripting a 10-second loyalty ask would cost nothing and could recover meaningful retention within 30 days.",
    },
    {
      title: "The roasting story is invisible",
      body:  "In-house roasting is the clearest brand differentiator Coastal Brew has — and it has never appeared in any social post or in-store signage we observed. This is the single highest-leverage untapped asset.",
    },
    {
      title: "Digital presence underrepresents in-store quality",
      body:  "The Instagram experience gives a potential customer no reason to prioritize Coastal Brew. The actual in-store experience would earn a 5-star review from anyone who walked in. The gap between these two realities is the marketing problem.",
    },
    {
      title: "Outdoor seating is an untapped revenue lever",
      body:  "On moderate-weather days, outdoor seating is not deployed consistently. This is free incremental capacity that signals vitality to passersby and extends dwell time for existing customers.",
    },
    {
      title: "Retail bag upsell is structurally absent",
      body:  "Retail whole-bean bags are the highest-margin SKU and convert tourists into ongoing customers — but there is no upsell conversation, no counter card, and no checkout prompt. This is a missed transaction on every visit.",
    },
  ],

  recommendations: [
    {
      title: "Script the loyalty mention at checkout",
      body:  "Every staff member asks every customer about the loyalty program at the point of payment. Write the script, post it at the register, train it in one shift meeting. Cost: zero.",
    },
    {
      title: "Introduce a retail bag upsell conversation",
      body:  "Tie the whole-bean recommendation to the drink order: 'This is our house blend — we roast it here. Bags are at the counter if you want to take it home.' One sentence, highest-margin SKU, works equally well for regulars and tourists.",
    },
    {
      title: "Deploy outdoor seating consistently",
      body:  "Add outdoor setup to the morning open checklist on any day above 60°F and no rain. Visible outdoor seating is a foot-traffic signal and a dwell-time extender. No cost, immediate impact.",
    },
    {
      title: "Build a roasting content series for Instagram",
      body:  "Five posts per week: Monday roasting process, Wednesday product close-up, Friday staff feature, Saturday community moment, Sunday seasonal or educational. The roasting story is the content strategy — it is already happening in the shop every day.",
    },
    {
      title: "Pilot a pastry partnership on 60-day trial",
      body:  "Source weekend pastries from a local bakery on a revenue-share or wholesale basis. Increases average ticket, extends morning window, and creates a cross-promotional relationship with another local business.",
    },
    {
      title: "Test the mobile cart before committing to a second location",
      body:  "Estimated $15–25K entry vs $180–240K for a second brick-and-mortar. Deploy at 3–4 summer beach events to validate demand in the tourist channel before any permanent capital commitment. Lower risk, faster signal.",
    },
  ],
};

const SMA_AI_DRAFT = {
  profile_setup_review: {
    summary: "Coastal Brew Coffee has an active Instagram presence and a dormant Facebook page. Overall profile setup is functional but underoptimized — bios are generic, no link-in-bio strategy is in place, and the roasting story that defines the brand is absent from every platform header.",
    instagram: {
      status: "Active",
      handle: "@coastalbrewcoffee",
      followers: "1,412",
      bio: true,
      profile_photo: true,
      highlights: ["Stories highlights exist but are outdated", "No link-in-bio tool in use"],
    },
    facebook: {
      status: "Incomplete",
      handle: "Coastal Brew Coffee",
      followers: "348",
      bio: false,
      profile_photo: true,
    },
    key_takeaways: [
      "Instagram is the only actively maintained platform",
      "Facebook page is live but functionally dormant — last post was 4+ months ago",
      "No link-in-bio strategy means zero web traffic conversion from social",
    ],
    action_items: [
      "Add a Linktree or Beacons link to Instagram bio pointing to the menu, loyalty signup, and online bag store",
      "Rewrite Instagram bio to lead with the roasting story: 'We roast it. You drink it fresh.'",
      "Either commit to Facebook with a weekly post or remove the page to avoid looking abandoned",
    ],
  },
  content_quality_scoring: {
    score: 58,
    dimensions: [
      { category: "Visual Quality",     score: 72, notes: "Best posts are strong — product-forward photography with good light. Inconsistent overall." },
      { category: "Caption Quality",    score: 48, notes: "Captions are short and transactional. No storytelling, no questions to the audience." },
      { category: "Brand Consistency",  score: 55, notes: "Some posts use a warm coastal palette; others feel generic. No defined visual system." },
      { category: "Call to Action",     score: 38, notes: "Almost no CTAs. Posts announce but do not invite response or action." },
      { category: "Content Variety",    score: 60, notes: "Mostly product shots. No behind-the-scenes roasting content, no staff features, no UGC." },
    ],
    observations: "The content quality ceiling is visible — the best posts show a real eye for the product. But consistency and intentionality are missing. The roasting story, which is the brand's clearest differentiator, has never appeared in any post we observed. That is the single biggest content gap.",
  },
  performance_metrics: {
    posting: {
      score: 45,
      observations: [
        "2-3 posts per week on average — inconsistent, with notable gaps during peak summer season",
        "No posting schedule or content calendar evident from pattern analysis",
      ],
      actions: [
        "Establish a 4-post weekly rhythm: roasting Monday, product Wednesday, community Friday, seasonal Sunday",
        "Schedule posts in advance using Later or Buffer to maintain consistency during busy weeks",
      ],
    },
    engagement: {
      score: 40,
      observations: [
        "Average engagement rate 1.2% — well below the 3-4% benchmark for independent food and beverage",
        "No story polls, Q&As, or interactive elements found in recent 90-day content review",
      ],
      actions: [
        "Add one question or prompt to every caption to invite response",
        "Use Instagram Stories 3-4 times per week with interactive stickers (polls, questions, countdowns)",
      ],
    },
    brand: {
      score: 55,
      observations: [
        "No defined color palette or typography system for social — posts vary widely in visual tone",
        "Voice is inconsistent: some captions are warm and local, others are generic product announcements",
      ],
      actions: [
        "Define a 3-color social palette and a consistent photo editing style (Lightroom preset or VSCO filter)",
        "Write a one-page brand voice guide: 3 words that describe the tone, 3 words to avoid",
      ],
    },
  },
  platform_utilization_review: {
    instagram: {
      score: 62,
      strengths: "Grid is maintained with regular product photography. Some strong individual posts show real visual capability.",
      gaps: "Reels not used at all. Stories are sporadic and non-interactive. Highlights are outdated. Zero link-in-bio strategy.",
    },
    facebook: {
      score: 28,
      strengths: "Page exists and has a modest follower base from earlier active period.",
      gaps: "Effectively dormant. No posts in 4+ months. No events, check-ins, or customer interaction. Creating an impression of a closed or neglected business.",
    },
    summary: "Instagram is the right primary platform for this business and audience — but it is being used at roughly 40% of its potential. Facebook is a liability in its current state. A focused Instagram-first strategy will deliver significantly more return than spreading effort across two underperforming platforms.",
  },
  overall_presence_score: {
    score: 54,
    dimensions: [
      { category: "Profile Setup",        score: 62 },
      { category: "Content Quality",      score: 58 },
      { category: "Posting Consistency",  score: 45 },
      { category: "Engagement",           score: 40 },
      { category: "Brand Consistency",    score: 55 },
      { category: "Platform Utilization", score: 62 },
    ],
    recommendations: "The social media opportunity here is larger than the current numbers suggest — because the raw material is excellent. The in-house roasting process, staff personalities, and Shore setting are all inherently visual and authentic. The four highest-leverage moves: define a visual identity system for social (3 colors, one consistent editing style), commit to a 4-post weekly content calendar with roasting behind-the-scenes as the anchor content type, activate Instagram Stories 3-4 times per week with interactive elements, and replace the Facebook page with a focused Instagram strategy until there is bandwidth to do both well.",
  },
};

const SSR_AI_DRAFT = {
  research_question_framework: {
    question:    "Would our core customer base pay $35/month for a coffee subscription with weekly bag pickup and 10% in-store discount?",
    hypothesis:  "Regulars with established weekly visit patterns are likely candidates. Tourists and occasional visitors are unlikely subscribers. Price sensitivity and flexibility of pickup timing are key friction points.",
    methodology: "Synthetic persona simulation across 4 distinct customer personas derived from stated customer demographics and behavioral patterns.",
  },

  customer_personas: [
    {
      name:        "The Morning Regular",
      description: "34F, local resident, visits 4–5x/week on weekday mornings. Values consistency, staff recognition, and quality. Low price sensitivity. The ideal subscription candidate.",
      motivation:  "Locking in her routine and feeling recognized as a valued customer",
      concern:     "Wants flexibility — if she can’t pick up one week, she doesn’t want to lose a bag",
      likelihood:  "High",
      quote:       "I’d do it in a heartbeat if I could swap pickup weeks. I’m here every morning anyway.",
    },
    {
      name:        "The Weekend Tourist",
      description: "45M, seasonal Shore visitor, 3–4 visits per summer. Discovery-driven and experience-focused. Not a subscription candidate — lives too far away for regular pickup.",
      motivation:  "Authentic local experience and something to remember the trip by",
      concern:     "Lives in Pennsylvania — a weekly pickup model is geographically impossible",
      likelihood:  "Low",
      quote:       "I’d buy a bag to take home, but a subscription doesn’t make sense for me.",
    },
    {
      name:        "The Remote Worker",
      description: "29NB, visits 2–3x/week for WiFi. High dwell time and secondary purchase frequency. Subscription appeals if pickup is flexible and the in-store discount stacks.",
      motivation:  "Making the workspace feel like a good value — if they’re there anyway, might as well save",
      concern:     "Irregular schedule makes rigid weekly pickup stressful rather than convenient",
      likelihood:  "Medium",
      quote:       "A discount on my in-store orders would basically pay for itself. I just need it to be flexible.",
    },
    {
      name:        "The Occasional Local",
      description: "38F, visits 1–2x/month when time allows. Convenience-driven — often chooses Playa for speed. Subscription would need to create urgency to visit more often.",
      motivation:  "Feeling like she’s getting value without changing her schedule significantly",
      concern:     "Worried about paying for a bag she won’t actually pick up if life gets busy",
      likelihood:  "Low",
      quote:       "I love Coastal Brew but I’m honestly not sure I’d make it in every week.",
    },
  ],

  persona_response_simulation:
    "When presented with the subscription concept ($35/month, weekly bag pickup, 10% in-store discount), Morning Regulars responded with immediate interest contingent on pickup flexibility. Remote Workers showed conditional interest centered on the in-store discount stacking with their existing frequency. Occasional Locals and Weekend Tourists both declined — the former due to schedule unpredictability, the latter due to geography.\n\nThe simulation reveals a clear bifurcation: the offer works well for the 30–40% of the customer base who already visit weekly, and poorly for everyone else. Forcing a weekly cadence is the single largest conversion barrier. A ‘any 4 pickups per month’ format would likely convert 15–20% more of the conditional segment.",

  thematic_analysis: [
    {
      theme:    "Flexibility is the core friction point",
      body:     "Rigid weekly pickup doesn’t match the schedules of Remote Workers or Occasional Locals. A flexible window (‘any 4 pickups per month’) would significantly expand the addressable segment.",
      strength: 92,
      evidence: "Cited by 3 of 4 personas as a top concern. Even the Morning Regular flagged it — ‘What if I travel?’",
    },
    {
      theme:    "The in-store discount is the most compelling benefit",
      body:     "The discount on in-store orders resonates across segments more than the bag itself. For Remote Workers especially, the discount framing transforms the subscription from a commitment into a savings vehicle.",
      strength: 85,
      evidence: "Remote Worker and Morning Regular both cited the discount as the clearest value driver.",
    },
    {
      theme:    "Roast customization would meaningfully increase appeal",
      body:     "Multiple personas expressed interest in choosing roast level or bean origin as part of the subscription. Even a binary choice (light vs. dark) would add perceived value and reduce ‘stuck with one thing’ hesitation.",
      strength: 68,
    },
    {
      theme:    "Trust in the brand is high — the barrier is logistical, not relational",
      body:     "No persona expressed doubt about Coastal Brew’s product quality or reliability. Hesitation is entirely structural: pickup timing, geographic access, and schedule variability. The brand equity exists; the format doesn’t yet serve it.",
      strength: 55,
    },
  ],

  directional_recommendations: [
    {
      title: "Pilot with Morning Regulars first",
      body:  "This segment has the highest likelihood, lowest friction, and most predictable behavior. A 20-person pilot could be launched with a simple paper sign-up and a staff-driven ask at checkout. No app required.",
      label: "P1",
    },
    {
      title: "Replace weekly pickup with a monthly pickup window",
      body:  "Change the core format from ‘weekly bag’ to ‘any 4 pickups per month.’ This single change would expand the addressable segment and remove the most-cited conversion barrier across all personas.",
      label: "P1",
    },
    {
      title: "Lead with the in-store discount, not the subscription",
      body:  "Frame it as ‘10% off every visit, plus a free bag every month’ rather than ‘a coffee subscription.’ The discount is the clearest daily value driver and the bag becomes the bonus, not the burden.",
      label: "P2",
    },
    {
      title: "Test roast customization as a premium tier",
      body:  "Offer a $42/month tier with roast selection. This segments Morning Regulars (who will pay more for personalization) from price-sensitive Remote Workers, and creates a natural upgrade path.",
      label: "P2",
    },
  ],

  methodology_disclosure: {
    approach:    "Synthetic persona simulation based on stated customer demographics, behavioral self-report, and standard consumer psychology frameworks for subscription adoption. Each persona was constructed from actual customer segment descriptions provided in the intake.",
    limitations: "Simulated responses cannot substitute for real customer interviews or survey data. Results are directional, not predictive. Actual adoption rates may differ significantly based on pricing sensitivity, timing, and word-of-mouth dynamics not captured here.",
  },

  honest_limitations_statement: {
    statement:        "This report simulates likely customer responses based on described segments. It should be treated as a structured hypothesis-generation tool, not a predictive model. We recommend validating the top two findings with 8–10 real customer conversations before making any subscription investment decision.",
    confidence_level: "Medium — suitable for initial go/no-go framing, not final commitment.",
  },
};

const DDR_AI_DRAFT = {
  executive_summary: {
    intro:           "The core strategic question — second location in Long Branch vs. mobile cart for beach events — resolves clearly in favor of the mobile cart as a first expansion move. Long Branch requires capital, staffing, and lease commitment before the core retention problem at the Asbury Park location is solved.",
    bullets: [
      "Mobile cart entry cost is $15–25K vs. $180–240K for a second brick-and-mortar — 10x less capital at risk",
      "Loyalty infrastructure gap must be closed before expansion or the vulnerability replicates at scale",
      "Roasting story remains the brand’s clearest differentiator and is not yet communicated digitally or in-store",
    ],
    key_finding:     "The Asbury Park retention problem — broken loyalty loop, absent digital strategy, no tourist conversion — must be solved before any expansion. Scaling a leaky bucket doesn’t fix the leak.",
    priority_action: "Pursue the mobile cart as the first expansion vehicle while solving retention at the Asbury Park location in parallel. These are not sequential — they can happen simultaneously.",
  },

  business_snapshot:
    "3-year independent specialty coffee operation, single location Asbury Park NJ. In-house roasting. Average ticket $7.20. 12% weekday afternoon traffic decline since Playa Coffee opened nearby. Strengths: staff warmth, product quality, roasting authenticity, established local loyalty base. Vulnerabilities: no loyalty infrastructure, underperforming digital presence, no conversion mechanism for tourist visits.",

  customer_segments: [
    { name: "Morning Regulars", desc: "High-value, habit-driven locals. Loyalty is behavioral but not formalized — no program captures or reinforces it. Primary retention risk if morning routine is disrupted.", motivation: "Coffee quality + staff familiarity", key_need: "Loyalty recognition and a reason to stay past the commute window" },
    { name: "Weekend Tourists", desc: "High first-visit potential, zero repeat mechanism. Currently leaves with a positive experience and no connection to the brand.", motivation: "Discovery, Shore atmosphere", key_need: "A mechanism to stay connected after leaving Asbury Park" },
    { name: "Remote Workers", desc: "High dwell time and secondary purchase potential. WiFi reliability is a churn risk. Open to subscription if flexible.", motivation: "Reliable workspace, quality product", key_need: "Consistent WiFi and a subscription that rewards regular visits" },
  ],

  competitive_intelligence: [
    { name: "Playa Coffee", strength: "Drive-through convenience, speed, regional brand recognition", vulnerability: "Generic product, no authentic local identity, chain feel", edge: "Coastal Brew wins on every quality dimension — craft, roasting, staff warmth" },
  ],

  market_context:
    "Jersey Shore summer economy is heavily tourist-driven with a strong June–September spike. Weekday traffic is local and habitual; weekend traffic is mixed and discovery-driven. Independent coffee shops with strong local identity are outperforming chains in post-pandemic loyalty metrics nationally. Authenticity is a durable differentiator — and Coastal Brew’s in-house roasting story is the clearest expression of it in this market.",

  decision_specific_analysis:
    "Long Branch second location requires 12–18 month lead time, $180–240K estimated buildout, new hiring, and management attention that would pull focus from the Asbury Park retention problem. Risk: replicates the current vulnerability at scale before it is solved.\n\nMobile cart: estimated $15–25K entry cost. Deploys in the tourist channel — beach events, farmers markets, festivals — where Coastal Brew currently has zero presence. Tests the brand beyond the Asbury Park block with minimal commitment. Generates real revenue and real market data before any permanent capital commitment.",

  extended_recommendations: [
    {
      title:     "Solve the Asbury Park loyalty loop before anything else",
      rationale: "Staff-scripted checkout mention, a counter card, and a basic punch card. This takes one week and costs almost nothing. Do it this week.",
      priority:  1,
    },
    {
      title:     "Pursue the mobile cart as the first expansion vehicle",
      rationale: "Target 3–4 summer weekend events to validate demand before committing to a permanent unit. Estimated $15–25K. Real revenue, real data, preserved optionality.",
      priority:  1,
    },
    {
      title:     "Build a roasting content series for Instagram",
      rationale: "Five posts per week: Monday roasting, Wednesday product, Friday staff, Saturday community, Sunday seasonal. The story already exists in the shop — it just needs to be captured.",
      priority:  2,
    },
    {
      title:     "Pilot a pastry partnership on 60-day trial",
      rationale: "Source from a local bakery on revenue-share. Increases average ticket, extends morning window, creates a cross-promotional relationship at zero upfront cost.",
      priority:  2,
    },
    {
      title:     "Revisit Long Branch after 6 months of retention data",
      rationale: "Use loyalty program data and mobile cart performance to make the second location decision from evidence, not ambition. If the numbers support it then, the case becomes easy.",
      priority:  3,
    },
  ],

  priority_action_framework: {
    phases: [
      { phase: "Week 1–2", actions: ["Implement loyalty mention script at checkout", "Deploy outdoor seating checklist in morning open procedures", "Brief staff on retail bag upsell conversation"] },
      { phase: "Month 1",  actions: ["Launch Instagram content calendar — roasting series, staff features, product stories", "Book first beach/event appearance for mobile cart concept test", "Pilot weekend pastry offering from local bakery partnership"] },
      { phase: "Quarter 2", actions: ["Evaluate loyalty app ROI based on verbal program data", "Assess mobile cart event performance for permanent unit decision", "Revisit Long Branch analysis with 6 months of additional retention data"] },
    ],
  },

  expanded_analyst_interpretation: {
    strategic_framing:  "The core tension in this business is between a genuinely exceptional in-store experience and an almost complete absence of mechanisms to extend that experience beyond the physical visit. Every gap identified — no loyalty follow-through, no digital conversion, no tourist retention — is a version of the same problem: the shop is excellent at creating the moment and poor at capturing it.",
    competitive_read:   "Playa Coffee is not winning on quality. It is winning on habit and convenience for a specific use case — the rushed weekday afternoon. Coastal Brew should not compete on that dimension; it will lose. The response is to deepen loyalty among customers who already value what Coastal Brew does, and to reach the tourist segment before they form a Playa habit.",
    long_term_view:     "The second location question should be answered by data, not ambition. The mobile cart generates that data at 10% of the cost and risk. If beach event revenue is strong and the brand travels well outside Asbury Park, Long Branch becomes an obvious next step. If it doesn’t travel, that’s critical information worth $20K to learn.",
  },
};

const VOC_AI_DRAFT: Record<string, string> = {
  survey_design:
    "Phase 2 open-response customer interviews (8 respondents). Mix of regular customers, occasional visitors, and one tourist. Age range 28–52. Gender-diverse sample. Questions covered: brand loyalty drivers, competitive awareness, digital engagement, subscription interest, and WiFi/dwell experience.",

  quant_summary:
    "Satisfaction scores are strongest among Regular customers (94% T2B, mean 4.7) and Tourists (88% T2B, mean 4.4), with Occasional visitors trailing at 71% T2B and mean 3.9 — a segment worth examining for friction points. Likelihood to recommend follows a similar pattern: Regulars at 91% T2B vs. Occasional visitors at 65%. Value-for-price scores reveal a mild gap for Occasional customers (58% T2B, mean 3.5) that may reflect infrequent exposure to the product's quality story relative to pricing.",

  thematic_analysis:
    `## Staff Recognition as the Core Loyalty Driver

The most consistent theme across regular customers is the experience of being known — staff remembering names and orders creates a feeling of belonging that respondents explicitly contrast against chain experiences. This is the shop's primary competitive moat.

## Digital Presence Underdelivering

Multiple respondents discovered the shop through Instagram but noted the feed doesn't reflect the richness of the in-store experience. The roasting process and staff personalities — the most compelling content assets — are largely absent from the social feed.

## Convenience Friction Creates Playa Vulnerability

Respondents who occasionally choose Playa Coffee consistently cite time as the driver, not preference. The battle for these customers is not quality — it's reducing the perceived time cost of choosing Coastal Brew.

## Subscription Interest is Real but Format-Sensitive

Subscription resonates with regulars when framed around customization and flexibility. Rigid weekly pickup is the most cited deterrent. An in-store discount component significantly increases appeal across all segments.`,

  visual_findings_summary:
    `## Top Loyalty Driver: Staff Recognition

7 of 8 respondents cited staff warmth and personalization as the primary reason they return or recommend.

## Competitive Awareness is High

All respondents were aware of Playa Coffee's opening. 3 of 8 had tried it. Quality verdict was consistent: Coastal Brew wins on product, Playa wins on speed.

## Content Gap is Visible to Customers

4 respondents expressed interest in behind-the-scenes roasting content. None had seen it on the shop's social channels.`,

  analyst_interpretation:
    `Formalize what's already working: the staff recognition culture is the brand's most defensible asset. Build a simple onboarding practice that makes name-and-order memory a standard for new hires, not just a personality trait of current staff.

Close the digital gap with the one story customers actually want: the roasting process. Three short-form videos per week showing the roast, the grind, and the pour would outperform months of generic product shots.

Test a flexible subscription format: 'any 4 pickups per month' rather than weekly, with the in-store discount as the headline. Pilot with 20 regulars before any app investment.`,
};

const AISK_AI_DRAFT = {
  business_type_analysis:
    "Coastal Brew Coffee is an independent specialty coffee roaster — a business category where craft identity and staff-driven loyalty are the primary competitive advantages.\n\nThe dual customer base (local regulars and seasonal Shore tourists) creates both an opportunity and a structural tension: regulars want relationship and recognition; tourists want discovery and a story to tell. Both segments respond to authenticity, which Coastal Brew has in abundance through its in-house roasting operation.\n\nAI is most useful here for consistent customer communication, social content generation, and competitive research that would otherwise require consultant engagement. The goal is not to automate the human warmth that defines the brand — it is to free up time and mental bandwidth so that warmth can show up more consistently.",

  ai_best_practices_introduction:
    "The most important thing to understand about AI tools is that they work best when you are specific. A vague prompt gets a generic answer. A prompt that includes your business name, your customer type, and the exact situation you are dealing with gets something you can actually use.\n\nThink of AI as a conversation, not a search engine. If the first response is close but not quite right, say so. Tell the AI what to change. Ask it to try a different tone, cut it in half, or make it sound less formal. Most people give up after one try — the people who get real value from these tools are the ones who treat it like a back-and-forth.\n\nOne of the most useful things you can do is ask AI to interview you before it writes anything. Say: 'Before you write the Instagram caption, ask me 3 questions about what I want it to accomplish.' This almost always produces a better result than diving straight into the output.\n\nThese prompts work in ChatGPT, Claude, or any major AI chatbot. You do not need a paid subscription to start — the free versions of both tools are capable of everything in this kit.",

  custom_prompt_1:
    `You are a social media content strategist for Coastal Brew Coffee, an independent specialty coffee shop in Asbury Park, NJ. We roast our own beans in-house and our strongest differentiator is our staff's genuine relationships with regular customers.

For this week, create a 4-post Instagram content plan. For each post include: the content concept, a caption draft (under 150 words, conversational, no hashtag spam), and one story idea to support it. The tone should feel like a real person who loves coffee and their community — not a marketing department.

This week's focus: [INSERT FOCUS — e.g., 'our fall roast launch' or 'introducing a new team member']
---
Copy and paste this prompt directly into ChatGPT or Claude. Replace the bracketed placeholder with your actual focus for the week before hitting send. Run it every Sunday to plan the week ahead.`,

  custom_prompt_2:
    `You are helping Coastal Brew Coffee respond to customer reviews and messages. The shop's voice is warm, genuine, and community-rooted — never corporate or scripted-feeling.

Write a response to the following review. Acknowledge specifically what they mentioned, add one personal detail if possible, and invite them back naturally:

Review: [PASTE REVIEW HERE]

Keep the response under 80 words. Don't use the phrase 'Thank you for your feedback.'
---
Paste any Google or Yelp review where the bracketed placeholder is. Works for both positive and negative reviews. If the review is negative, add this line after pasting it: "This is a difficult review — please help me respond with empathy and not defensiveness."`,

  custom_prompt_3:
    `Write a short, natural verbal script for Coastal Brew Coffee staff to use when mentioning our loyalty program at checkout. The tone should feel like a genuine recommendation from a person, not a sales pitch.

Context: the customer just paid and is waiting for their order. The staff member should mention the loyalty program in a way that feels helpful and low-pressure.

Create 3 variations: one for a first-time visitor, one for a returning customer who isn't enrolled, and one for an existing member checking their status.
---
Run this once and print the three scripts for your staff. Post them near the register. Revisit every few months and regenerate with updated context if the program changes.`,

  custom_prompt_4:
    `I'm going to paste in recent Google and Yelp reviews for Playa Coffee in Asbury Park, NJ — our main competitor. Summarize: (1) what customers like most about Playa, (2) what complaints appear repeatedly, and (3) any gaps in their experience that Coastal Brew could directly address in our own marketing or operations.

Reviews: [PASTE REVIEWS HERE]

Keep the summary under 300 words. Focus on actionable intelligence, not general observations.
---
Paste 10-20 recent reviews from Playa's Google or Yelp profile. Run this monthly to track shifts in customer sentiment. The gaps you find in their reviews are your marketing talking points.`,

  custom_prompt_5:
    `Coastal Brew Coffee is planning a [INSERT EVENT TYPE — e.g., 'fall harvest popup' or 'holiday retail bag promotion']. Write a complete promotional brief including: a headline, a short description for social media, suggested in-store signage copy, and one email subject line.

Event details: [DESCRIBE EVENT]
Date/duration: [DATES]
Key offer: [WHAT CUSTOMERS GET]

Tone: warm, community-forward, artisan — not discount-driven.
---
Fill in the bracketed placeholders with your specific event details before running. This prompt works for any seasonal promotion, partnership launch, or special offering. Use the output as a first draft — read it out loud and adjust anything that doesn't sound like you.`,

  custom_prompt_6:
    `At the end of each month, use this prompt to reflect on business performance and set priorities.

This month at Coastal Brew Coffee:
- Revenue vs. last month: [UP/DOWN X%]
- Biggest win: [DESCRIBE]
- Biggest frustration: [DESCRIBE]
- Customer feedback theme: [WHAT WERE YOU HEARING]
- One thing I avoided dealing with: [BE HONEST]

Based on the above, give me: (1) the one thing that actually matters most to address next month, (2) a 3-step action plan for it, and (3) one question I should be asking that I'm probably not.
---
Run this on the last Sunday of each month. The more honest you are with the inputs, the more useful the output. This prompt is designed to cut through the noise and tell you where to actually focus.`,

  real_use_case_examples: {
    "Content Calendar in 20 Minutes":
      "The owner used the Weekly Social Content Planner prompt every Sunday evening. In 20 minutes they had a full week of Instagram content drafted and ready to review. Engagement increased 40% over 6 weeks as posting became consistent. The key was the specificity of the focus line — 'our fall roast launch' produced dramatically better content than a generic request.",

    "Turning a Negative Review Into a Loyal Customer":
      "A 3-star review mentioned a long wait time with no acknowledgment from staff. The Customer Response Template produced a warm, specific reply in 3 minutes that named the experience, explained what had changed, and invited the customer back personally. The reviewer returned the following week and updated their review to 5 stars.",

    "The Checkout Script That Doubled Loyalty Signups":
      "Three variations of the loyalty mention script were tested with different staff members over two weeks. The 'returning customer' variation outperformed the others by a wide margin. Loyalty program enrollment increased from 2 sign-ups per day to 9 within two weeks of consistent use. The script was printed and taped near the register — visible to staff, invisible to customers.",
  },
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
