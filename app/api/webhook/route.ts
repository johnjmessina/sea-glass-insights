import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

// Stripe requires the raw body to verify the signature
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      // Verify signature in production
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
      // No secret yet (local dev) — parse directly
      event = JSON.parse(payload) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id ?? session.client_reference_id;

    if (!orderId) {
      console.error("No order_id in Stripe session metadata");
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "new",
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`Order ${orderId} marked as paid.`);
  }

  return NextResponse.json({ received: true });
}
