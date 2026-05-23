import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  // Fetch the order
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Claude API integration coming in Step 6.
  // Returning a placeholder draft so the dashboard UI is fully testable now.
  const draft = {
    snapshot:
      `${order.business_name} is a small business operated by ${order.customer_name}. ` +
      `${order.q1 ?? ""}`,
    customer_profile:
      `Based on the intake: ${order.q3 ?? ""}`,
    competitive_landscape:
      `Competitors identified: ${order.q4 ?? ""}. Key differentiator: ${order.q5 ?? ""}`,
    positioning:
      `Current challenge: ${order.q6 ?? ""}. 12-month goal: ${order.q7 ?? ""}`,
    insights:
      `1. ${order.q9 ?? "Market insight pending Claude integration."}\n` +
      `2. Current marketing: ${order.q8 ?? ""}`,
    recommendations:
      `1. Address the challenge: ${order.q6 ?? ""}\n` +
      `2. Leverage differentiator: ${order.q5 ?? ""}\n` +
      `3. Expand on: ${order.q10 ?? ""}\n` +
      `4. Focus marketing around ideal customer: ${order.q3 ?? ""}`,
  };

  // Persist draft to Supabase
  await supabase
    .from("orders")
    .update({ ai_draft: draft, status: "in_progress" })
    .eq("id", orderId);

  return NextResponse.json({ draft });
}
