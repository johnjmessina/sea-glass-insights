// ── MIR report → PDF via Puppeteer ─────────────────────────────────────────
// Two passes: each section is first rendered alone to count its pages, which
// gives the table of contents its page numbers; then the full document is
// rendered once with those numbers filled in.

import type { Browser } from "puppeteer-core";
import { PDFDocument } from "pdf-lib";
import { buildMirReportHtml, REPORT_SECTIONS, type MirOrderInfo, type SectionId } from "./html";

// Chromium build for Vercel's Linux runtime, matched to @sparticuz/chromium-min
// 149. It must be 131+ for the CSS @page margin boxes used for the header bar
// and page numbers.
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    return puppeteer.launch({
      args:           chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless:       true,
    });
  }

  // Local: a locally installed Chrome. Set PUPPETEER_EXECUTABLE_PATH if it
  // isn't at the default macOS location.
  return puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? MAC_CHROME,
    headless:       true,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// Page size and margins come from the document's own @page CSS.
const PDF_OPTIONS = { printBackground: true, preferCSSPageSize: true } as const;

export async function renderMirReportPdf(
  order: MirOrderInfo,
  draft: Record<string, unknown>,
  analystNote: string,
): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const render = async (html: string) => {
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      return page.pdf(PDF_OPTIONS);
    };

    // Pass 1: page count of each section on its own. Every section starts on
    // a new page, so counts add up exactly. Cover and contents are one page each.
    const pageNumbers: Partial<Record<SectionId, number>> = {};
    let next = 3;
    for (const s of REPORT_SECTIONS) {
      const pdf = await render(buildMirReportHtml(order, draft, analystNote, { only: s.id }));
      pageNumbers[s.id] = next;
      next += (await PDFDocument.load(pdf)).getPageCount();
    }

    // Pass 2: the full report with the contents page numbers filled in
    const pdf = await render(buildMirReportHtml(order, draft, analystNote, { pageNumbers }));
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
