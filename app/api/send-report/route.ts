import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { generateReport } from "@/lib/reportGenerator";
import type { Order } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    if (!process.env.RESEND_FROM_EMAIL) throw new Error("Missing RESEND_FROM_EMAIL");

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM   = `Sea Glass Insights <${process.env.RESEND_FROM_EMAIL}>`;

    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    // 1. Fetch order
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.ai_draft)
      return NextResponse.json({ error: "No AI draft found." }, { status: 400 });
    if (!Array.isArray(order.ai_draft.customer_profile))
      return NextResponse.json(
        { error: "Draft is in the old format. Regenerate it in the dashboard before sending." },
        { status: 400 },
      );

    // 2. Generate .docx
    const docxBuffer = await generateReport(
      order,
      order.ai_draft,
      order.analyst_note ?? "",
    );

    const businessName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    const filename     = `SeaGlassInsights-${businessName}-Report.docx`;

    // 3. Send email with attachment
    const { error: emailError } = await resend.emails.send({
      from:        FROM,
      to:          order.email,
      subject:     `Your Market Intelligence Report is Ready — ${order.business_name}`,
      html:        buildEmailHtml(order),
      attachments: [{ filename, content: docxBuffer }],
    });

    if (emailError) throw new Error(emailError.message);

    // 4. Mark order as delivered
    await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-report error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Email template ─────────────────────────────────────────────────────────────
function buildEmailHtml(order: Order): string {
  const sections = [
    "Business Snapshot",
    "Customer Profile",
    "Competitive Landscape",
    "Market Positioning",
    "Key Insights",
    "Recommendations",
    "A Note from the Analyst",
  ];

  const sectionRows = sections
    .map(
      s => `
      <tr>
        <td style="padding:6px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;">
          <span style="color:#00CED1;font-weight:bold;margin-right:8px;">—</span>${s}
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0A2F61;border-radius:12px 12px 0 0;padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#00CED1;text-transform:uppercase;">
              Sea Glass Insights
            </p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">
              Your report is ready.
            </h1>
            <p style="margin:10px 0 0;font-size:14px;color:#93C5FD;line-height:1.5;">
              Market Intelligence Report for ${order.business_name}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:36px 40px;">

            <p style="margin:0 0 18px;font-size:16px;color:#1C1C1C;line-height:1.6;">
              Hi ${order.customer_name},
            </p>
            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
              Your Sea Glass Insights market intelligence report for
              <strong style="color:#0A2F61;">${order.business_name}</strong> is attached
              to this email as a Word document (<code style="background:#F3F4F6;padding:2px 6px;border-radius:4px;font-size:13px;">.docx</code>).
              Open it in Microsoft Word, Google Docs, or Pages.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Here&rsquo;s what&rsquo;s inside:
            </p>

            <!-- Sections list -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#FDF5E6;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
              <tr><td><table width="100%" cellpadding="0" cellspacing="0">${sectionRows}</table></td></tr>
            </table>

            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
              If you have any questions about the report or want to talk through the
              recommendations, just reply to this email. I read every response.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              Thanks for trusting Sea Glass Insights with your business.
            </p>

            <!-- Signature -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-left:3px solid #00CED1;padding-left:14px;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0A2F61;">John Messina</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">
                    Founder, Sea Glass Insights &nbsp;|&nbsp;
                    <a href="https://seaglassinsights.com" style="color:#00CED1;text-decoration:none;">
                      seaglassinsights.com
                    </a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB;
                     padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              Sea Glass Insights &nbsp;&bull;&nbsp; seaglassinsights.com<br>
              This report was prepared exclusively for ${order.customer_name} and is confidential.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}
