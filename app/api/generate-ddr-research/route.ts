import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateDDRResearchBrief } from "@/lib/claudeServices";

// Research can take 2-3 minutes with multiple web searches
export const maxDuration = 180;

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

  let brief;
  try {
    brief = await generateDDRResearchBrief(order);
  } catch (err) {
    console.error("[generate-ddr-research] Research failed for order", orderId, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research phase failed" },
      { status: 500 }
    );
  }

  // Store the brief on the order
  const { error: saveError } = await supabase
    .from("orders")
    .update({
      research_brief: brief,
      status: order.status === "new" ? "in_progress" : order.status,
    })
    .eq("id", orderId);

  if (saveError) {
    console.error("[generate-ddr-research] Failed to save brief to Supabase:", saveError);
    return NextResponse.json({ error: "Failed to save research brief" }, { status: 500 });
  }

  return NextResponse.json({ brief });
}
