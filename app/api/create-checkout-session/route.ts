import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

    // 2. Create Stripe Checkout Session with the order ID
    // Derive base URL from the actual request so it's correct in every environment
    // (avoids NEXT_PUBLIC_URL being http://localhost:3000 in production live mode)
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? `${proto}://${host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 14900,
            product_data: {
              name: "Sea Glass Insights — Premium Market Research Report",
              description: `Custom market research report for ${businessName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id:     order.id,
        customerName: trunc(customerName),
        businessName: trunc(businessName),
      },
      success_url: `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/get-report`,
    });

    // 3. Attach the Stripe session ID to the order
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: "Failed to create checkout session", detail: msg }, { status: 500 });
  }
}
