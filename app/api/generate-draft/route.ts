import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReportDraft } from "@/lib/claude";
import { generateServiceDraft } from "@/lib/claudeServices";
import { getEffectiveServiceType } from "@/lib/serviceConfig";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, vocPhase, vocResponses } = body as {
    orderId: string;
    vocPhase?: 1 | 2;
    vocResponses?: string;
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

  try {
    if (serviceType === "market_intelligence_report") {
      // Existing MIR generation — unchanged
      draft = await generateReportDraft(order) as unknown as Record<string, unknown>;
    } else {
      // Non-MIR services
      const ss = order.service_data as Record<string, unknown> | null;
      draft = await generateServiceDraft(order, serviceType, {
        vocPhase:    (vocPhase ?? (ss?.voc_phase as 1 | 2 | undefined)) ?? 1,
        vocResponses: vocResponses ?? (ss?.voc_responses as string | undefined),
        ssScorecard:  ss?.ss_scorecard as Record<string, boolean | number> | undefined,
        ssAnalystObs: ss?.ss_analyst_obs as {
          best_moment: string; biggest_miss: string;
          immediate_fix: string; additional_observations: string;
        } | undefined,
      });
    }
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }

  // For VoC Phase 2, merge new analysis sections into existing draft (keep Phase 1)
  let finalDraft = draft;
  if (serviceType === "voice_of_customer_survey" && (vocPhase === 2 || (order.service_data as Record<string,unknown>)?.voc_phase === 2)) {
    const existing = (order.ai_draft as Record<string, unknown>) ?? {};
    finalDraft = { ...existing, ...draft };
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
