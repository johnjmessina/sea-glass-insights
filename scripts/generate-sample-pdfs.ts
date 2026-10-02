#!/usr/bin/env npx tsx
/**
 * generate-sample-pdfs.ts
 *
 * Creates a test order for each Sea Glass Insights report type, generates AI
 * content via the live API, downloads the branded PDF, and saves it locally.
 *
 * Usage:
 *   npm run sample-pdfs
 *   BASE_URL=https://your-deployment.vercel.app npx tsx scripts/generate-sample-pdfs.ts
 *
 * PDFs land in ./sample-pdfs/ — open them to review layout and content.
 * Test orders are created in Supabase under email test@seaglassinsights.com
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const OUT_DIR  = path.join(process.cwd(), "sample-pdfs");

const SAMPLE_BUSINESS = {
  customerName: "Sea Glass Test",
  businessName: "Coastal Brew Coffee",
  email:        "test@seaglassinsights.com",
  location:     "Asbury Park, NJ",
};

const COMMON_ANSWERS = {
  q1: "Independent specialty coffee shop serving the Jersey Shore community. We roast in-house and sell retail bags alongside espresso drinks.",
  q2: "We've been open 3 years and are considering expanding to a second location in nearby Long Branch.",
  q3: "Our primary customers are 25–45 year old local residents and seasonal beach visitors. We see heavy weekday morning regulars and weekend tourist spikes.",
  q4: "Main competition is a regional chain (Playa Coffee) that opened nearby 6 months ago. We've noticed a 12% drop in weekday afternoon traffic.",
  q5: "We're considering adding a small food menu (pastries from a local bakery) and a loyalty app. Not sure which to prioritize.",
  q6: "Average ticket is $7.20. Highest margin items are our house blends. Lowest margin is drip coffee.",
  q7: "We do some Instagram posting but no structured social strategy. About 1,400 followers, low engagement.",
  q8: "We'd like to grow revenue 20% in the next 12 months without significantly increasing staff.",
  q9: "Our biggest uncertainty: do our customers value the indie/roaster experience enough to stay loyal, or will price and convenience win out?",
  q10: "We're open to pivoting our marketing entirely if the data supports it.",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/** Generate all sections for a report type that uses /api/generate-*-section */
async function generateSections(
  route: string,
  orderId: string,
  sectionKeys: string[],
  extraBody: Record<string, unknown> = {},
) {
  for (const sectionKey of sectionKeys) {
    log(`    Generating section: ${sectionKey}…`);
    await post(route, { orderId, sectionKey, ...extraBody });
    await sleep(500);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`Output directory: ${OUT_DIR}`);
  log(`Targeting: ${BASE_URL}`);
  log("─".repeat(60));

  const results: Array<{ service: string; file: string; status: "ok" | "error"; error?: string }> = [];

  // ── 1. Market Intelligence Report ─────────────────────────────────────────
  {
    const label = "Market Intelligence Report";
    log(`\n▶ ${label}`);
    try {
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "market_intelligence_report",
        ...COMMON_ANSWERS,
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      await generateSections("/api/generate-mir-section", orderId, [
        "business_snapshot",
        "customer_profile",
        "competitive_landscape",
        "positioning",
        "insights",
        "recommendations",
        "executive_summary",
      ]);

      await sleep(1000);
      const filename = "SamplePDF-MarketIntelligenceReport.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-pdf", { orderId }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "social_media_audit",
        ...COMMON_ANSWERS,
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      log("  Generating AI draft…");
      await post("/api/generate-draft", { orderId });
      log("  Draft generated ✓");

      await sleep(1000);
      const filename = "SamplePDF-SocialMediaAudit.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-sma-pdf", { orderId }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "synthetic_survey_report",
        ...COMMON_ANSWERS,
        q2: "Would our core customer base pay $35/month for a coffee subscription with weekly bag pickup and 10% off in-store?",
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      await generateSections("/api/generate-ssr-section", orderId, [
        "research_question_framework",
        "customer_personas",
        "persona_response_simulation",
        "thematic_analysis",
        "directional_recommendations",
        "methodology_disclosure",
        "honest_limitations_statement",
      ]);

      await sleep(1000);
      const filename = "SamplePDF-SyntheticSurveyReport.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-ssr-pdf", { orderId }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "deep_dive_report",
        ...COMMON_ANSWERS,
        q2: "Should we open a second location in Long Branch, NJ, or invest in a mobile cart for beach events?",
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      await generateSections("/api/generate-ddr-section", orderId, [
        "executive_summary",
        "business_snapshot",
        "customer_segments",
        "competitive_intelligence",
        "market_context",
        "decision_specific_analysis",
        "extended_recommendations",
        "priority_action_framework",
        "expanded_analyst_interpretation",
      ]);

      await sleep(1000);
      const filename = "SamplePDF-DeepDiveReport.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-ddr-pdf", { orderId }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "secret_shopping",
        ...COMMON_ANSWERS,
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      const ssScorecard = {
        // First Impression
        fi_exterior_signage:     true,
        fi_entrance_clear:       true,
        fi_hours_posted:         true,
        fi_acknowledged_60s:     true,
        fi_greeting_quality:     4,
        fi_overall_first:        4,
        // Physical Environment
        pe_clean:                true,
        pe_organized:            true,
        pe_interior_signage:     true,
        pe_lighting:             true,
        pe_music:                false,
        pe_temperature:          true,
        pe_overall_env:          4,
        pe_visual_merch:         3,
        // Staff Engagement
        se_visible:              true,
        se_natural:              true,
        se_listened:             true,
        se_accurate:             true,
        se_friendliness:         5,
        se_knowledge:            4,
        se_objection:            3,
        se_consistency:          4,
        // Core Experience
        ce_easy_find:            true,
        ce_upsell_attempted:     false,
        ce_upsell_helpful:       false,
        ce_matched_promise:      true,
        ce_relevance:            4,
        ce_personalization:      3,
        ce_valued:               4,
        // Purchase Process
        pp_efficient:            true,
        pp_accurate:             true,
        pp_loyalty:              false,
        pp_receipt:              true,
        pp_packaging:            true,
        pp_checkout_staff:       4,
        pp_farewell:             4,
        // Digital Touchpoints
        dt_findable:             true,
        dt_website_accurate:     true,
        dt_hours_match:          true,
        dt_contact_accurate:     true,
        dt_reviews_responded:    false,
        dt_overall_digital:      3,
        // Lasting Impression
        li_would_return:         true,
        li_would_recommend:      true,
        li_gut_score:            4,
      };
      const ssAnalystObs = {
        best_moment:              "Barista remembered a returning customer's name and order — genuine warmth that feels impossible to replicate at a chain.",
        biggest_miss:             "No loyalty program mentioned at any point during the visit, even at checkout where it would be most natural.",
        immediate_fix:            "Add a simple counter card or verbal script for staff to mention the loyalty program at checkout.",
        additional_observations:  "The outdoor seating area was not fully set up on a mild day — missed opportunity for extended dwell time and secondary purchases.",
      };

      log("  Generating AI draft…");
      await post("/api/generate-draft", { orderId, ssScorecard, ssAnalystObs });
      log("  Draft generated ✓");

      await sleep(1000);
      const filename = "SamplePDF-SecretShopping.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-ss-pdf", { orderId, ssScorecard }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "voice_of_customer_survey",
        ...COMMON_ANSWERS,
        extraServiceData: {
          voc_phase: 2,
          voc_responses: `Response 1 (Regular, F, 34): Love the in-house roasting — can smell it from the parking lot. That's why I come back. The loyalty thing is confusing, I never know my points. The app crashes sometimes.
Response 2 (Occasional, M, 28): Honestly I go to Playa when I'm in a rush because the drive-through is faster. Coastal Brew is better coffee but I'm often time-crunched.
Response 3 (Regular, F, 41): The staff knows my name and order. That matters more to me than any app. I'd hate to see it get too big and lose that feel.
Response 4 (Tourist, M, 52): Found it on Instagram. Great cortado. Didn't realize there was a retail bag option — I would have bought one.
Response 5 (Regular, NB, 29): The seasonal specials are why I follow on Instagram. Would love more behind-the-scenes roasting content. Feels authentic.
Response 6 (Occasional, F, 45): I tried the new Playa location out of curiosity. The coffee wasn't as good but the experience felt more polished. That surprised me.
Response 7 (Regular, M, 37): Would definitely subscribe to a coffee bag service if I could customize roast level. The current subscription felt too rigid.
Response 8 (Regular, F, 31): Wish the WiFi was more reliable. I work remotely and come here to work but sometimes have to leave. That costs you my afternoon purchases.`,
        },
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      // VoC Phase 2: generate each section individually
      await generateSections("/api/generate-voc-section", orderId, [
        "quant_summary",
        "thematic_analysis",
        "visual_findings_summary",
        "analyst_interpretation",
      ]);

      await sleep(1000);
      const filename = "SamplePDF-VoiceOfCustomerSurvey.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-voc-pdf", { orderId }, filename);
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
      log("  Creating order…");
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType: "ai_starter_kit",
        ...COMMON_ANSWERS,
      }) as { id: string };
      const orderId = order.id;
      log(`  Order: ${orderId}`);

      log("  Generating AI draft…");
      await post("/api/generate-draft", { orderId });
      log("  Draft generated ✓");

      await sleep(1000);
      const filename = "SamplePDF-AiStarterKit.pdf";
      log(`  Downloading PDF…`);
      await downloadPdf("/api/generate-aisk-pdf", { orderId }, filename);
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
  log(`Note: test orders were created in Supabase under email ${SAMPLE_BUSINESS.email}`);
  log(`You can delete them from the dashboard or Supabase directly.`);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
