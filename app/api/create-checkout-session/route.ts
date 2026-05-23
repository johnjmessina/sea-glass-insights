import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Stripe metadata values are capped at 500 chars
function trunc(s: string): string {
  return s?.slice(0, 490) ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      businessName,
      email,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
    } = body;

    if (!customerName || !businessName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 14900, // $149.00
            product_data: {
              name: "Sea Glass Insights — Premium Market Research Report",
              description: `Custom market research report for ${businessName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        customerName: trunc(customerName),
        businessName: trunc(businessName),
        email: trunc(email),
        q1: trunc(q1),
        q2: trunc(q2),
        q3: trunc(q3),
        q4: trunc(q4),
        q5: trunc(q5),
        q6: trunc(q6),
        q7: trunc(q7),
        q8: trunc(q8),
        q9: trunc(q9),
        q10: trunc(q10),
      },
      success_url: `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/get-report`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
