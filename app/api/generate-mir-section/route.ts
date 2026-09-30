import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateMIRSection } from "@/lib/claude";
import { isMirSectionKey } from "@/lib/mirSections";

// Generates one MIR section and merges it into the order's ai_draft. The
// dashboard calls this once per section, in MIR_GENERATION_ORDER, mirroring
// /api/generate-ddr-section.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-mir-section] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error: API key not configured" }, { status: 500 });
  }

  let body: { orderId?: string; sectionKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { orderId, sectionKey } = body;
  if (!orderId || !sectionKey) {
    return NextResponse.json({ error: "Missing orderId or sectionKey" }, { status: 400 });
  }
  if (!isMirSectionKey(sectionKey)) {
    return NextResponse.json({ error: `Unknown MIR section: ${sectionKey}` }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fires before Vercel's 60 s limit so the dashboard gets a clean JSON error
  // (and a Retry button) instead of a dropped connection.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Section timed out (55 s). Use the retry button.")),
      55_000,
    );
  });

  const existingDraft = (order.ai_draft as Record<string, unknown>) ?? {};

  let content: unknown;
  try {
    content = await Promise.race([
      generateMIRSection(order, sectionKey, existingDraft),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error(`[generate-mir-section] "${sectionKey}" failed for order`, orderId, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Section generation failed" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }

  // Merge this section into ai_draft without overwriting other sections
  const updatedDraft = { ...existingDraft, [sectionKey]: content };
  const { error: saveError } = await supabase
    .from("orders")
    .update({
      ai_draft: updatedDraft,
      status:   order.status === "new" ? "in_progress" : order.status,
    })
    .eq("id", orderId);

  if (saveError) {
    console.error("[generate-mir-section] Failed to save section to Supabase:", saveError);
    return NextResponse.json({ error: "Section generated but could not be saved. Retry this section." }, { status: 500 });
  }

  return NextResponse.json({ sectionKey, content });
}
