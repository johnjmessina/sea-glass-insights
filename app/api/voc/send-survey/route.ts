import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import type { VocQuestion } from "@/lib/vocTypes";

export const maxDuration = 60;

function buildSurveyEmailHtml(opts: {
  contactName:   string | null;
  businessName:  string;
  surveyUrl:     string;
  questions:     VocQuestion[];
}) {
  const { contactName, businessName, surveyUrl, questions } = opts;
  const greeting = contactName ? `Hi ${contactName},` : "Hi,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>We'd love your feedback</title>
<style>
  body { margin: 0; padding: 0; background: #f6f8fa; font-family: system-ui, -apple-system, sans-serif; }
  .wrap { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  .header { background: #0A2F61; padding: 32px 40px 28px; }
  .header h1 { color: #5AC8C8; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: 0.02em; }
  .header p  { color: #a8c4d8; font-size: 13px; margin: 6px 0 0; }
  .body { padding: 36px 40px; }
  .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .preview { background: #f0fdfd; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
  .preview p { font-size: 13px; color: #065f46; margin: 0 0 8px; font-weight: 600; }
  .preview ul { margin: 0; padding-left: 18px; }
  .preview li { font-size: 13px; color: #374151; line-height: 1.7; }
  .btn-wrap { text-align: center; margin: 32px 0; }
  .btn { display: inline-block; background: #5AC8C8; color: #0A2F61; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 50px; text-decoration: none; letter-spacing: 0.01em; }
  .footer { padding: 24px 40px; border-top: 1px solid #e5e7eb; }
  .footer p { color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; }
  .footer a { color: #5AC8C8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Sea Glass Insights</h1>
    <p>Voice of Customer Survey</p>
  </div>
  <div class="body">
    <p>${greeting}</p>
    <p>${businessName} has partnered with Sea Glass Insights to better understand the experience of their customers. We'd love to hear your perspective — your feedback directly shapes how they serve you.</p>
    <p>The survey takes about <strong>3–5 minutes</strong> and covers ${questions.length} question${questions.length !== 1 ? "s" : ""}.</p>
    ${questions.length > 0 ? `
    <div class="preview">
      <p>You'll be asked about:</p>
      <ul>
        ${questions.slice(0, 5).map(q => `<li>${q.text || "(question)"}</li>`).join("")}
        ${questions.length > 5 ? `<li>…and ${questions.length - 5} more</li>` : ""}
      </ul>
    </div>` : ""}
    <div class="btn-wrap">
      <a href="${surveyUrl}" class="btn">Take the Survey →</a>
    </div>
    <p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${surveyUrl}" style="color:#5AC8C8;word-break:break-all;">${surveyUrl}</a></p>
  </div>
  <div class="footer">
    <p>This survey is powered by <a href="https://seaglassinsights.com">Sea Glass Insights</a>. Your responses are confidential and will only be shared in aggregate form with ${businessName}. This link is unique to you — please don't share it.</p>
  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
    }
    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ error: "Missing RESEND_FROM_EMAIL" }, { status: 500 });
    }

    const body = await req.json() as { orderId: string; questions: VocQuestion[] };
    const { orderId, questions } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, business_name, customer_name, email")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch unsent contacts
    const { data: contacts, error: contactErr } = await supabase
      .from("survey_contacts")
      .select("id, name, email, token")
      .eq("order_id", orderId)
      .is("sent_at", null);

    if (contactErr) {
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "No unsent contacts found. Upload contacts first." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM   = `Sea Glass Insights <${process.env.RESEND_FROM_EMAIL}>`;
    const proto  = process.env.NEXT_PUBLIC_URL ?? "https://seaglassinsights.com";

    let sentCount   = 0;
    const failedEmails: string[] = [];

    for (const contact of contacts) {
      const surveyUrl = `${proto}/survey/${contact.token}`;
      const html      = buildSurveyEmailHtml({
        contactName:  contact.name,
        businessName: order.business_name,
        surveyUrl,
        questions,
      });

      try {
        await resend.emails.send({
          from:    FROM,
          to:      contact.email,
          subject: `Share your feedback on ${order.business_name} — 3 min survey`,
          html,
        });

        // Mark as sent
        await supabase
          .from("survey_contacts")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", contact.id);

        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send to ${contact.email}:`, emailErr);
        failedEmails.push(contact.email);
      }
    }

    // Update order survey_status
    await supabase
      .from("orders")
      .update({ survey_status: "collecting" } as Record<string, unknown>)
      .eq("id", orderId);

    return NextResponse.json({
      sent:   sentCount,
      failed: failedEmails,
      total:  contacts.length,
    });
  } catch (err) {
    console.error("Send survey error:", err);
    return NextResponse.json({ error: "Failed to send survey" }, { status: 500 });
  }
}
