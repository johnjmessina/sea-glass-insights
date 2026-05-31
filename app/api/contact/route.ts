import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { name, businessName, email, phone, message } = await req.json();

    if (!name || !businessName || !email || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM   = `Sea Glass Insights <${process.env.RESEND_FROM_EMAIL}>`;

    const { error } = await resend.emails.send({
      from:     FROM,
      to:       "john@seaglassinsights.com",
      replyTo:  email,
      subject:  `New Contact: ${name} — ${businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0A2F61;padding:28px 32px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">New Contact Form Submission</h2>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;">Name</td><td style="padding:8px 0;font-size:14px;color:#111;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Business</td><td style="padding:8px 0;font-size:14px;color:#111;">${businessName}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;color:#111;"><a href="mailto:${email}" style="color:#00CED1;">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Phone</td><td style="padding:8px 0;font-size:14px;color:#111;">${phone}</td></tr>` : ""}
            </table>
            <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:13px;margin-bottom:8px;">Message</p>
            <p style="font-size:14px;color:#111;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("contact route error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
