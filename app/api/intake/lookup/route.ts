import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("service, customer_name, business_name, intake_completed_at, analyst_note")
    .eq("intake_token", token)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // analyst_note stores the service slug (set at checkout creation)
  const service = (order.service as string) ?? (order.analyst_note as string) ?? "market-intelligence-report";

  return NextResponse.json({
    service,
    customerName: order.customer_name,
    businessName: order.business_name,
    alreadySubmitted: !!order.intake_completed_at,
  });
}
