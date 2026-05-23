import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReportDraft } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  // Fetch the full order
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Call Claude
  let draft;
  try {
    draft = await generateReportDraft(order);
  } catch (err) {
    console.error("Claude generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }

  // Persist draft and move status to in_progress
  const { error: saveError } = await supabase
    .from("orders")
    .update({ ai_draft: draft, status: "in_progress" })
    .eq("id", orderId);

  if (saveError) {
    console.error("Supabase save error:", saveError);
    // Still return the draft even if save fails — John can still see it
  }

  return NextResponse.json({ draft });
}
