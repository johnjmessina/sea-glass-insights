import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function trunc(s: string): string {
  return s?.slice(0, 490) ?? "";
}

// ── Service configuration ─────────────────────────────────────────────────────
// unit_amount is in cents. Add new services here as they launch.
const SERVICE_CONFIG: Record<string, { unitAmount: string; productName: string; cancelPath: string }> = {
  "market-intelligence-report": {
    unitAmount:  "14900",
    productName: "Sea Glass Insights — Market Intelligence Report",
    cancelPath:  "/get-report",
  },
  "social-media-audit": {
    unitAmount:  "19900",
    productName: "Sea Glass Insights — Social Media Audit",
    cancelPath:  "/services/social-media-audit",
  },
  "secret-shopping": {
    unitAmount:  "29900",
    productName: "Sea Glass Insights — Secret Shopping",
    cancelPath:  "/services/secret-shopping",
  },
  "deep-dive-report": {
    unitAmount:  "39900",
    productName: "Sea Glass Insights — Deep Dive Report",
    cancelPath:  "/services/deep-dive-report",
  },
  "synthetic-survey-report": {
    unitAmount:  "39900",
    productName: "Sea Glass Insights — Synthetic Survey Report",
    cancelPath:  "/services/synthetic-survey-report",
  },
  "voice-of-customer": {
    unitAmount:  "49900",
    productName: "Sea Glass Insights — Voice of Customer Survey",
    cancelPath:  "/services/voice-of-customer",
  },
  "ai-starter-kit": {
    unitAmount:  "9900",
    productName: "Sea Glass Insights — AI Starter Kit",
    cancelPath:  "/services/ai-starter-kit",
  },
};
const DEFAULT_SERVICE = "market-intelligence-report";

// ── Map service-specific fields into q1-q10 storage slots ────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQSlots(service: string, b: Record<string, any>) {
  const nil = null;
  if (service === "social-media-audit") {
    return { q1: b.location, q2: b.industry, q3: b.facebook, q4: b.instagram,
             q5: b.otherPlatforms, q6: b.competitors, q7: b.challenge,
             q8: nil, q9: nil, q10: nil };
  }
  if (service === "secret-shopping") {
    return { q1: b.businessAddress, q2: b.industry, q3: b.hours,
             q4: b.typicalInteraction, q5: b.dimensions, q6: b.competitorShop,
             q7: b.focus, q8: nil, q9: nil, q10: nil };
  }
  if (service === "deep-dive-report") {
    // q10-q12 combined: q10 (catch-all) + q11 (specific decision) + q12 (prior research)
    const extra = [
      b.q10  ? b.q10 : nil,
      b.q11  ? `Specific decision/problem: ${b.q11}` : nil,
      b.q12  ? `Prior research: ${b.q12}` : nil,
    ].filter(Boolean).join("\n\n");
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: extra || nil };
  }
  if (service === "voice-of-customer") {
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: b.q7, q8: nil, q9: nil, q10: nil };
  }
  if (service === "ai-starter-kit") {
    return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
             q6: b.q6, q7: nil, q8: nil, q9: nil, q10: nil };
  }
  // Default: MIR passes q1-q10 directly
  return { q1: b.q1, q2: b.q2, q3: b.q3, q4: b.q4, q5: b.q5,
           q6: b.q6, q7: b.q7, q8: b.q8, q9: b.q9, q10: b.q10 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, customerName, businessName, email } = body;

    if (!customerName || !businessName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const svc     = SERVICE_CONFIG[service ?? DEFAULT_SERVICE] ?? SERVICE_CONFIG[DEFAULT_SERVICE];
    const qSlots  = buildQSlots(service ?? DEFAULT_SERVICE, body);

    // 1. Save order to Supabase first (status: pending_payment)
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        business_name: businessName,
        email,
        status: "pending_payment",
        analyst_note: service ?? DEFAULT_SERVICE,
        ...qSlots,
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
      "line_items[0][price_data][unit_amount]": svc.unitAmount,
      "line_items[0][price_data][product_data][name]": svc.productName,
      "line_items[0][price_data][product_data][description]": `${svc.productName.split("—")[1].trim()} for ${businessName}`,
      "line_items[0][quantity]": "1",
      "metadata[order_id]": order.id,
      "metadata[service]":      service ?? DEFAULT_SERVICE,
      "metadata[customerName]": trunc(customerName),
      "metadata[businessName]": trunc(businessName),
      success_url: `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}${svc.cancelPath}`,
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
