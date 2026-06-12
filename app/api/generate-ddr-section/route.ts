import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateDDRSectionWithSearch } from "@/lib/claudeServices";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-ddr-section] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error: API key not configured" }, { status: 500 });
  }

  const { orderId, sectionKey } = await req.json() as { orderId: string; sectionKey: string };
  if (!orderId || !sectionKey) {
    return NextResponse.json({ error: "Missing orderId or sectionKey" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Section timed out (45 s). Use the retry button.`)),
      45_000
    )
  );

  let content: string;
  try {
    content = await Promise.race([
      generateDDRSectionWithSearch(
        order,
        sectionKey,
        (order.ai_draft as Record<string, string>) ?? {},
      ),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error(`[generate-ddr-section] "${sectionKey}" failed for order`, orderId, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Section generation failed" },
      { status: 500 }
    );
  }

  // Merge this section into ai_draft without overwriting other sections
  const existingDraft = (order.ai_draft as Record<string, unknown>) ?? {};
  const updatedDraft  = { ...existingDraft, [sectionKey]: content };
  const { error: saveError } = await supabase
    .from("orders")
    .update({
      ai_draft: updatedDraft,
      status:   order.status === "new" ? "in_progress" : order.status,
    })
    .eq("id", orderId);

  if (saveError) {
    console.error("[generate-ddr-section] Failed to save section to Supabase:", saveError);
  }

  return NextResponse.json({ sectionKey, content });
}
