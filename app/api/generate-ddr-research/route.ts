import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateDDRResearch } from "@/lib/claudeServices";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-ddr-research] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error: API key not configured" }, { status: 500 });
  }

  const { orderId } = await req.json() as { orderId: string };
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

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Research timed out (55 s). Please try again.")),
      55_000
    )
  );

  let researchContext: string;
  try {
    researchContext = await Promise.race([generateDDRResearch(order), timeoutPromise]);
  } catch (err) {
    console.error("[generate-ddr-research] Failed for order", orderId, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research phase failed" },
      { status: 500 }
    );
  }

  // Persist research context in service_data so section calls can read it
  const existingServiceData = (order.service_data as Record<string, unknown>) ?? {};
  const { error: saveError } = await supabase
    .from("orders")
    .update({ service_data: { ...existingServiceData, ddr_research_context: researchContext } })
    .eq("id", orderId);

  if (saveError) {
    console.error("[generate-ddr-research] Failed to save research context:", saveError);
  }

  return NextResponse.json({ success: true });
}
