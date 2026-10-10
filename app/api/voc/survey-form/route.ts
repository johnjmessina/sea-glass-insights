import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { VocQuestion } from "@/lib/vocTypes";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Look up contact by token
  const { data: contact, error: contactErr } = await supabase
    .from("survey_contacts")
    .select("id, order_id, name, completed_at")
    .eq("token", token)
    .single();

  if (contactErr || !contact) {
    return NextResponse.json({ error: "Invalid survey link" }, { status: 404 });
  }

  if (contact.completed_at) {
    return NextResponse.json({ completed: true, contactName: contact.name });
  }

  // Fetch order and questions
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, business_name, service_data")
    .eq("id", contact.order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const sd = (order.service_data ?? {}) as Record<string, unknown>;
  const questions = (sd.voc_question_map as VocQuestion[]) ?? [];

  return NextResponse.json({
    completed:    false,
    contactName:  contact.name,
    businessName: order.business_name,
    questions,
  });
}
