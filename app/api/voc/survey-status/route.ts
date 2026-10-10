import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  // Fetch contacts summary
  const { data: contacts, error } = await supabase
    .from("survey_contacts")
    .select("id, name, email, token, sent_at, completed_at")
    .eq("order_id", orderId)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  const total     = contacts?.length ?? 0;
  const sent      = contacts?.filter(c => c.sent_at).length ?? 0;
  const completed = contacts?.filter(c => c.completed_at).length ?? 0;

  return NextResponse.json({ contacts: contacts ?? [], total, sent, completed });
}
