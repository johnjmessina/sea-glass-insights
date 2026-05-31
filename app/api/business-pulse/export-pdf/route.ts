import { NextRequest, NextResponse } from "next/server";

// Allow up to 30 seconds — Puppeteer + Chromium cold start can be slow
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const cardData = await req.json();

    // ── Resolve the base URL so Puppeteer can navigate to the print page ──
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const base  = process.env.NEXT_PUBLIC_URL ?? `${proto}://${host}`;

    const printUrl =
      `${base}/dashboard/business-pulse/print` +
      `?data=${encodeURIComponent(JSON.stringify(cardData))}`;

    // ── Launch Puppeteer ───────────────────────────────────────────────────
    let pdfBuffer: Buffer;

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // Local development: use puppeteer-core with a locally installed Chrome.
      // Point PUPPETEER_EXECUTABLE_PATH at Chrome if the default detection fails.
      const puppeteer = (await import("puppeteer-core")).default;
      const executablePath =
        process.env.PUPPETEER_EXECUTABLE_PATH ??
        // Common Windows path; adjust if needed
        "C:/Program Files/Google/Chrome/Application/chrome.exe";

      const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const page = await browser.newPage();
        await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 25000 });
        const buf = await page.pdf({
          width:           "4in",
          height:          "6in",
          printBackground: true,
          margin:          { top: "0", right: "0", bottom: "0", left: "0" },
        });
        pdfBuffer = Buffer.from(buf);
      } finally {
        await browser.close();
      }
    } else {
      // Production (Vercel / Linux): use @sparticuz/chromium-min
      const chromium = (await import("@sparticuz/chromium-min")).default;
      const puppeteer = (await import("puppeteer-core")).default;

      // Chromium binary — hosted on Sparticuz GitHub releases
      const CHROMIUM_URL =
        "https://github.com/Sparticuz/chromium/releases/download/v130.0.0/chromium-v130.0.0-pack.tar";

      const browser = await puppeteer.launch({
        args:            chromium.args,
        executablePath:  await chromium.executablePath(CHROMIUM_URL),
        headless:        true,
      });

      try {
        const page = await browser.newPage();
        await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 25000 });
        const buf = await page.pdf({
          width:           "4in",
          height:          "6in",
          printBackground: true,
          margin:          { top: "0", right: "0", bottom: "0", left: "0" },
        });
        pdfBuffer = Buffer.from(buf);
      } finally {
        await browser.close();
      }
    }

    // ── Return PDF ─────────────────────────────────────────────────────────
    const safeName = (cardData.businessName ?? "BusinessPulse")
      .replace(/[^a-zA-Z0-9]/g, "");
    const filename = `${safeName}-BusinessPulse.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("export-pdf error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
