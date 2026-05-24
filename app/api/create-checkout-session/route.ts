import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function trunc(s: string): string {
  return s?.slice(0, 490) ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, businessName, email,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
    } = body;

    if (!customerName || !businessName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    // 1. Save order to Supabase first (status: pending_payment)
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        business_name: businessName,
        email,
        status: "pending_payment",
        q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }

    // 2. Build base URL from request headers
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? `${proto}://${host}`;

    // 3. Create Stripe Checkout Session via raw fetch (bypasses SDK HTTP client issues)
    const params = new URLSearchParams({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.id,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "14900",
      "line_items[0][price_data][product_data][name]": "Sea Glass Insights — Premium Market Research Report",
      "line_items[0][price_data][product_data][description]": `Custom market research report for ${businessName}`,
      "line_items[0][quantity]": "1",
      "metadata[order_id]": order.id,
      "metadata[customerName]": trunc(customerName),
      "metadata[businessName]": trunc(businessName),
      success_url: `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/get-report`,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2024-06-20",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const stripeData = await stripeRes.json() as { url?: string; error?: { message: string } };

    if (!stripeRes.ok || !stripeData.url) {
      const detail = stripeData.error?.message ?? `Stripe status ${stripeRes.status}`;
      console.error("Stripe API error:", detail);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    // 4. Attach the Stripe session ID to the order
    const sessionId = (stripeData as { id?: string }).id;
    if (sessionId) {
      await supabase
        .from("orders")
        .update({ stripe_session_id: sessionId })
        .eq("id", order.id);
    }

    return NextResponse.json({ url: stripeData.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
