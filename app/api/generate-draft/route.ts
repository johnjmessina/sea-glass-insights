import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReportDraft } from "@/lib/claude";
import { generateServiceDraft } from "@/lib/claudeServices";
import { getEffectiveServiceType } from "@/lib/serviceConfig";

// Allow up to 120 seconds for AI generation (Vercel Pro supports up to 300s)
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  console.log("[generate-draft] handler invoked");

  // ── Step 1: env guard ──────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-draft] STEP 1 FAIL: ANTHROPIC_API_KEY missing");
    return NextResponse.json(
      { error: "Server configuration error: AI API key is not configured. Contact support." },
      { status: 500 }
    );
  }
  console.log("[generate-draft] STEP 1 OK: env vars present");

  // ── Step 2: parse body ─────────────────────────────────────────────────────
  let body: {
    orderId: string;
    vocPhase?: 1 | 2;
    vocResponses?: string;
    ssScorecard?: Record<string, boolean | number>;
    ssAnalystObs?: { best_moment: string; biggest_miss: string; immediate_fix: string; additional_observations: string };
  };
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error("[generate-draft] STEP 2 FAIL: could not parse request body:", parseErr);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { orderId, vocPhase, vocResponses, ssScorecard: bodyScorecard, ssAnalystObs: bodyAnalystObs } = body;
  console.log("[generate-draft] STEP 2 OK: orderId =", orderId);

  if (!orderId) {
    console.error("[generate-draft] STEP 2 FAIL: orderId missing from body");
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  // ── Step 3: fetch order ────────────────────────────────────────────────────
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    console.error("[generate-draft] STEP 3 FAIL: order not found for id", orderId, "| supabase error:", fetchError?.message);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  console.log("[generate-draft] STEP 3 OK: order fetched, service_type =", order.service_type);

  // ── Step 4: resolve service type ──────────────────────────────────────────
  const serviceType = getEffectiveServiceType(order.service_type);
  console.log("[generate-draft] STEP 4 OK: effectiveServiceType =", serviceType);

  let draft: Record<string, unknown>;

  // 115-second JS timeout — fires before Vercel's 120s limit so we can return
  // a clean JSON error instead of letting Vercel drop the TCP connection.
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Generation timed out (115 s). The AI is taking longer than expected — please try again.")),
      115_000
    )
  );

  try {
    if (serviceType === "market_intelligence_report") {
      // MIR generation
      console.log("[generate-draft] STEP 5: starting MIR generateReportDraft");
      draft = await Promise.race([
        generateReportDraft(order) as unknown as Record<string, unknown>,
        timeoutPromise,
      ]);
      console.log("[generate-draft] STEP 5 OK: MIR draft generated");
    } else {
      // Non-MIR services
      const ss = order.service_data as Record<string, unknown> | null;
      draft = await Promise.race([
        generateServiceDraft(order, serviceType, {
          vocPhase:    (vocPhase ?? (ss?.voc_phase as 1 | 2 | undefined)) ?? 1,
          vocResponses: vocResponses ?? (ss?.voc_responses as string | undefined),
          ssScorecard:  bodyScorecard ?? ss?.ss_scorecard as Record<string, boolean | number> | undefined,
          ssAnalystObs: bodyAnalystObs ?? ss?.ss_analyst_obs as {
            best_moment: string; biggest_miss: string;
            immediate_fix: string; additional_observations: string;
          } | undefined,
        }),
        timeoutPromise,
      ]);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error("[generate-draft] STEP 5 FAIL for order", orderId, "service", serviceType);
    console.error("[generate-draft] error message:", errMsg);
    if (errStack) console.error("[generate-draft] stack:", errStack);
    return NextResponse.json(
      { error: errMsg, step: "generation" },
      { status: 500 }
    );
  }

  // For VoC Phase 2, merge new analysis sections into existing draft (keep Phase 1)
  let finalDraft = draft;
  if (serviceType === "voice_of_customer_survey" && (vocPhase === 2 || (order.service_data as Record<string,unknown>)?.voc_phase === 2)) {
    const existing = (order.ai_draft as Record<string, unknown>) ?? {};
    finalDraft = { ...existing, ...finalDraft };
  }

  const { error: saveError } = await supabase
    .from("orders")
    .update({ ai_draft: finalDraft, status: "in_progress" })
    .eq("id", orderId);

  if (saveError) {
    console.error("Supabase save error:", saveError);
  }

  return NextResponse.json({ draft: finalDraft });
}
