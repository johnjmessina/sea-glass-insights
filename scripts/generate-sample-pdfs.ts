#!/usr/bin/env npx tsx
/**
 * generate-sample-pdfs.ts
 *
 * Creates a test order for each Sea Glass Insights report type, generates AI
 * content via the live API, downloads the branded PDF, and saves it locally.
 *
 * Usage:
 *   BASE_URL=https://your-deployment.vercel.app npx tsx scripts/generate-sample-pdfs.ts
 *
 * Or set BASE_URL in .env.local and run without the prefix.
 *
 * PDFs land in ./sample-pdfs/ — open them to review layout and content.
 * Test orders are created in Supabase but tagged "test" so they're easy to find/delete.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const OUT_DIR  = path.join(process.cwd(), "sample-pdfs");

// Sample business used for all test orders
const SAMPLE_BUSINESS = {
  customerName: "Sea Glass Test",
  businessName: "Coastal Brew Coffee",
  email:        "test@seaglassinsights.com",
  location:     "Asbury Park, NJ",
};

// Common intake answers that work for most report types
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

// Per-service extra data and answers where needed
type ServiceConfig = {
  serviceType: string;
  pdfRoute: string;
  extraServiceData?: Record<string, unknown>;
  overrideAnswers?: Record<string, string>;
  ssScorecard?: Record<string, boolean | number>;
  ssAnalystObs?: Record<string, string>;
  vocPhase?: number;
  skipDraft?: boolean; // for types that need special handling
  analystPerspectives?: Record<string, string>;
};

const SERVICES: ServiceConfig[] = [
  {
    serviceType: "market_intelligence_report",
    pdfRoute:    "/api/generate-pdf",
  },
  {
    serviceType: "social_media_audit",
    pdfRoute:    "/api/generate-sma-pdf",
  },
  {
    serviceType: "synthetic_survey_report",
    pdfRoute:    "/api/generate-ssr-pdf",
    overrideAnswers: {
      q1: "Independent specialty coffee shop, Jersey Shore, NJ",
      q2: "Would our core customer base pay $35/month for a coffee subscription with weekly bag pickup and 10% off in-store?",
      q3: "Local regulars 25–45, some remote workers, seasonal beach visitors",
      q4: "Price-sensitive but values quality and local identity",
    },
  },
  {
    serviceType: "deep_dive_report",
    pdfRoute:    "/api/generate-ddr-pdf",
    overrideAnswers: {
      q2: "Should we open a second location in Long Branch, NJ, or invest in a mobile cart for beach events?",
    },
  },
  {
    serviceType: "secret_shopping",
    pdfRoute:    "/api/generate-ss-pdf",
    ssScorecard: {
      exterior_signage:       true,
      parking_accessibility:  true,
      entrance_welcome:       true,
      cleanliness:            true,
      ambiance_music:         false,
      staff_greeting:         true,
      wait_time_acknowledged: false,
      menu_knowledge:         true,
      upsell_attempt:         false,
      order_accuracy:         true,
      packaging_presentation: true,
      payment_ease:           true,
      loyalty_mention:        false,
      farewell:               true,
      overall_score:          7.2,
    },
    ssAnalystObs: {
      best_moment:              "Barista remembered a returning customer's name and order — genuine warmth that feels impossible to replicate at a chain.",
      biggest_miss:             "No loyalty program mentioned at any point during the visit, even at checkout where it would be most natural.",
      immediate_fix:            "Add a simple counter card or verbal script for staff to mention the loyalty program at checkout.",
      additional_observations:  "The outdoor seating area was not fully set up on a mild day — missed opportunity for extended dwell time and secondary purchases.",
    },
  },
  {
    serviceType: "voice_of_customer_survey",
    pdfRoute:    "/api/generate-voc-pdf",
    vocPhase:    2,
    extraServiceData: {
      voc_phase: 2,
      voc_responses: `
Response 1 (Regular, F, 34): Love the in-house roasting — can smell it from the parking lot. That's why I come back. The loyalty thing is confusing, I never know my points. The app crashes sometimes.
Response 2 (Occasional, M, 28): Honestly I go to Playa when I'm in a rush because the drive-through is faster. Coastal Brew is better coffee but I'm often time-crunched.
Response 3 (Regular, F, 41): The staff knows my name and order. That matters more to me than any app. I'd hate to see it get too big and lose that feel.
Response 4 (Tourist, M, 52): Found it on Instagram. Great cortado. Didn't realize there was a retail bag option — I would have bought one.
Response 5 (Regular, NB, 29): The seasonal specials are why I follow on Instagram. Would love more behind-the-scenes roasting content. Feels authentic.
Response 6 (Occasional, F, 45): I tried the new Playa location out of curiosity. The coffee wasn't as good but the experience felt more polished. That surprised me.
Response 7 (Regular, M, 37): Would definitely subscribe to a coffee bag service if I could customize roast level. The current subscription felt too rigid.
Response 8 (Regular, F, 31): Wish the WiFi was more reliable. I work remotely and come here to work but sometimes have to leave. That costs you my afternoon purchases.
`.trim(),
    },
  },
  {
    serviceType: "ai_starter_kit",
    pdfRoute:    "/api/generate-aisk-pdf",
  },
];

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

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`Output directory: ${OUT_DIR}`);
  log(`Targeting: ${BASE_URL}`);
  log("─".repeat(60));

  const results: Array<{ service: string; file: string; status: "ok" | "error"; error?: string }> = [];

  for (const svc of SERVICES) {
    const label = svc.serviceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    log(`\n▶ ${label}`);

    try {
      // 1. Create test order
      log("  Creating test order…");
      const answers = { ...COMMON_ANSWERS, ...(svc.overrideAnswers ?? {}) };
      const order = await post("/api/manual-order", {
        ...SAMPLE_BUSINESS,
        serviceType:      svc.serviceType,
        extraServiceData: svc.extraServiceData,
        ...answers,
      }) as { id: string };
      const orderId = order.id;
      log(`  Order created: ${orderId}`);

      // 2. Generate AI draft
      log("  Generating AI draft (this takes ~30–60s)…");
      await post("/api/generate-draft", {
        orderId,
        ...(svc.vocPhase    ? { vocPhase:    svc.vocPhase }    : {}),
        ...(svc.ssScorecard ? { ssScorecard: svc.ssScorecard } : {}),
        ...(svc.ssAnalystObs ? { ssAnalystObs: svc.ssAnalystObs } : {}),
      });
      log("  Draft generated ✓");

      // Small pause so Supabase write propagates
      await sleep(1000);

      // 3. Download PDF
      const safeName  = label.replace(/\s+/g, "");
      const filename  = `SamplePDF-${safeName}.pdf`;
      const pdfBody: Record<string, unknown> = { orderId };
      if (svc.ssScorecard)         pdfBody.ssScorecard       = svc.ssScorecard;
      if (svc.analystPerspectives) pdfBody.analystPerspectives = svc.analystPerspectives;

      log(`  Downloading PDF → ${filename}…`);
      await downloadPdf(svc.pdfRoute, pdfBody, filename);
      log(`  PDF saved ✓`);

      results.push({ service: label, file: filename, status: "ok" });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED: ${msg}`);
      results.push({ service: label, file: "", status: "error", error: msg });
    }
  }

  // Summary
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
