import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReportDraft } from "@/lib/claude";
import { generateServiceDraft } from "@/lib/claudeServices";
import { getEffectiveServiceType } from "@/lib/serviceConfig";

// Allow up to 120 seconds for AI generation (Vercel Pro supports up to 300s)
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Guard: fail fast with JSON if the API key is missing
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-draft] ANTHROPIC_API_KEY is not set in this environment");
    return NextResponse.json(
      { error: "Server configuration error: AI API key is not configured. Contact support." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { orderId, vocPhase, vocResponses, ssScorecard: bodyScorecard, ssAnalystObs: bodyAnalystObs } = body as {
    orderId: string;
    vocPhase?: 1 | 2;
    vocResponses?: string;
    ssScorecard?: Record<string, boolean | number>;
    ssAnalystObs?: { best_moment: string; biggest_miss: string; immediate_fix: string; additional_observations: string };
  };

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const serviceType = getEffectiveServiceType(order.service_type);

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
      // Existing MIR generation — unchanged
      draft = await Promise.race([
        generateReportDraft(order) as unknown as Record<string, unknown>,
        timeoutPromise,
      ]);
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
    console.error("[generate-draft] Generation error for order", orderId, "service", serviceType, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
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
