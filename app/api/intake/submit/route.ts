import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Map service-specific fields into q1-q10 storage slots ────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQSlots(service: string, b: Record<string, any>) {
  const nil = null;
  if (service === "social-media-audit") {
    return { q1: b.location, q2: b.industry, q3: b.facebook, q4: b.instagram,
             q5: b.otherPlatforms, q6: b.competitors, q7: b.challenge,
             q8: nil, q9: nil, q10: nil };
  }
  if (service === "secret-shopping") {
    return { q1: b.businessAddress, q2: b.industry, q3: b.hours,
             q4: b.typicalInteraction, q5: b.dimensions, q6: b.competitorShop,
             q7: b.focus, q8: nil, q9: nil, q10: nil };
  }
  if (service === "deep-dive-report") {
    // q10 = specific decision, q11 = prior research
    const extra = [
      b.q10  ? b.q10 : nil,
      b.q11  ? `Specific decision/problem: ${b.q11}` : nil,
      b.q12  ? `Prior research: ${b.q12}` : nil,
    ].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "voice-of-customer") {
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: b.q7, q8: nil, q9: nil, q10: nil };
  }
  if (service === "ai-starter-kit") {
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: nil, q8: nil, q9: nil, q10: nil };
  }
  // ── Bundles: extra questions beyond q10 combined into q10 slot ────────────
  if (service === "starter-intelligence") {
    const extra = [b.q10, b.q11 ? `Social platforms: ${b.q11}` : nil, b.q12 ? `Competitor socials: ${b.q12}` : nil, b.q13 ? `Social challenge: ${b.q13}` : nil].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5, q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "the-deep-field") {
    const extra = [b.q10, b.q11 ? `Address: ${b.q11}` : nil, b.q12 ? `Hours: ${b.q12}` : nil, b.q13 ? `Interaction: ${b.q13}` : nil, b.q14 ? `Dimensions: ${b.q14}` : nil, b.q15 ? `Competitor shop: ${b.q15}` : nil, b.q16 ? `Focus: ${b.q16}` : nil].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5, q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "the-field-report") {
    const extra = [b.q10, b.q11 ? `Address: ${b.q11}` : nil, b.q12 ? `Hours: ${b.q12}` : nil, b.q13 ? `Interaction: ${b.q13}` : nil, b.q14 ? `Dimensions: ${b.q14}` : nil, b.q15 ? `Competitor shop: ${b.q15}` : nil, b.q16 ? `Focus: ${b.q16}` : nil].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5, q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "market-and-mind") {
    const extra = [b.q10, b.q11 ? `Assumptions: ${b.q11}` : nil, b.q12 ? `Research Qs: ${b.q12}` : nil, b.q13 ? `Pricing/discovery: ${b.q13}` : nil, b.q14 ? `Decision test: ${b.q14}` : nil].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5, q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "complete-shopper-experience") {
    const extra = [b.q9 ? `Contacts: ${b.q9}` : nil, b.q10 ? `Collected via: ${b.q10}` : nil, b.q11 ? `Want to learn: ${b.q11}` : nil, b.q12 ? `Prior surveys: ${b.q12}` : nil, b.q13 ? `Decision: ${b.q13}` : nil].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5, q6: b.q6, q7: b.q7, q8: b.q8, q9: nil, q10: extra || nil };
  }
  // Default: MIR + synthetic-survey-report pass q1-q10 directly
  return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
           q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: b.q10 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...fields } = body as { token: string; [key: string]: string };

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 1. Look up order by intake_token
    const { data: order, error: lookupError } = await supabase
      .from("orders")
      .select("id, intake_completed_at, analyst_note, service")
      .eq("intake_token", token)
      .single();

    if (lookupError || !order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 2. Guard against duplicate submission
    if (order.intake_completed_at) {
      return NextResponse.json({ alreadySubmitted: true });
    }

    // 3. Map fields to q1-q10
    const service = (order.service as string) ?? (order.analyst_note as string) ?? "market-intelligence-report";
    const qSlots = buildQSlots(service, fields);

    // 4. Update the order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        ...qSlots,
        intake_completed_at: new Date().toISOString(),
        status: "new",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to save intake" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Intake submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
