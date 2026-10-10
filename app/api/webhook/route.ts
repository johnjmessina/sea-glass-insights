import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import Stripe from "stripe";

const SERVICE_LABELS: Record<string, string> = {
  "market-intelligence-report": "Market Intelligence Report",
  "social-media-audit":         "Social Media Audit",
  "secret-shopping":            "Secret Shopping",
  "deep-dive-report":           "Deep Dive Report",
  "synthetic-survey-report":    "Synthetic Customer Profiles",
  "voice-of-customer":          "Voice of Customer Survey",
  "ai-starter-kit":             "AI Starter Kit",
  "starter-intelligence":       "Starter Intelligence Bundle",
  "the-field-report":           "The Field Report Bundle",
  "market-and-mind":            "Market & Mind Bundle",
  "the-deep-field":             "The Deep Field Bundle",
  "complete-shopper-experience":"Complete Shopper Experience Bundle",
};

function intakeEmailHtml(
  customerName: string,
  businessName: string,
  serviceLabel: string,
  intakeUrl: string,
): string {
  const NAVY  = "#0A2F61";
  const TEAL  = "#00CED1";
  const GRAY  = "#6B7280";
  const SAND  = "#F4EADA";
  const WHITE = "#FFFFFF";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Complete Your Order — Sea Glass Insights</title></head>
<body style="margin:0;padding:0;background:${SAND};font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${WHITE};border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(10,47,97,0.08);">
        <!-- Header -->
        <tr><td style="background:${NAVY};padding:28px 40px;">
          <p style="margin:0;font-family:'Montserrat',system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${TEAL};">Sea Glass Insights</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;">One more step to complete your order</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.6;">Hi ${customerName},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">
            Thank you for purchasing your <strong>${serviceLabel}</strong> for <strong>${businessName}</strong>. Your payment is confirmed.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#333;line-height:1.6;">
            To get started on your report, we need a few details about your business. Click the button below to fill out your intake form — it takes about 10 minutes and helps us build something genuinely useful for you.
          </p>
          <!-- CTA Button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:${NAVY};border-radius:9999px;padding:0;">
              <a href="${intakeUrl}" style="display:inline-block;padding:15px 40px;font-family:'Montserrat',system-ui,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.03em;">Complete Your Intake Form →</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:${GRAY};line-height:1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 28px;font-size:12px;color:${TEAL};word-break:break-all;">${intakeUrl}</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:${GRAY};line-height:1.6;">
            This link is unique to your order and doesn't expire, so you can come back to it anytime. Once you submit, we'll get to work and deliver your report within the promised timeframe.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:${SAND};padding:20px 40px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:${GRAY};line-height:1.6;">
            Sea Glass Insights &nbsp;|&nbsp; seaglassinsights.com &nbsp;|&nbsp; john@seaglassinsights.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } else {
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

    // 1. Mark order as paid — intake_token is already set by DB default gen_random_uuid()
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: "new",
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, customer_name, business_name, email, analyst_note, intake_token")
      .single();

    if (error || !order) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`Order ${orderId} marked as paid. intake_token: ${order.intake_token}`);

    // 2. Send intake email via Resend
    const resendKey  = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM_EMAIL;

    if (resendKey && resendFrom && order.email && order.intake_token) {
      try {
        const resend  = new Resend(resendKey);
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://seaglassinsights.com";
        const intakeUrl    = `${baseUrl}/intake/${order.intake_token}`;
        const serviceSlug  = (order.analyst_note as string) ?? "market-intelligence-report";
        const serviceLabel = SERVICE_LABELS[serviceSlug] ?? "Report";

        await resend.emails.send({
          from:    `Sea Glass Insights <${resendFrom}>`,
          to:      order.email as string,
          subject: `Complete your ${serviceLabel} intake — Sea Glass Insights`,
          html:    intakeEmailHtml(
            (order.customer_name as string) ?? "there",
            (order.business_name as string) ?? "",
            serviceLabel,
            intakeUrl,
          ),
        });

        console.log(`Intake email sent to ${order.email} for order ${orderId}`);
      } catch (emailErr) {
        // Don't fail the webhook over email — order is already marked paid
        console.error("Failed to send intake email:", emailErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
