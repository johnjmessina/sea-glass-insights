import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { orderId, status, analyst_commentary, ai_draft, analyst_note } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined)              updates.status              = status;
  if (analyst_commentary !== undefined)  updates.analyst_commentary  = analyst_commentary;
  if (ai_draft !== undefined)            updates.ai_draft            = ai_draft;
  if (analyst_note !== undefined)        updates.analyst_note        = analyst_note;

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
