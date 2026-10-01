// ── VoC (Voice of Customer) report → PDF via Puppeteer ───────────────────────
// Identical two-pass pipeline to lib/ddrPdf/render.ts: pass 1 measures each
// section for TOC page numbers, pass 2 renders the full document.

import type { Browser } from "puppeteer-core";
import { PDFDocument } from "pdf-lib";
import {
  buildVocReportHtml,
  VOC_SECTIONS,
  type VocOrderInfo,
  type VocSectionId,
  type VocReportData,
} from "./html";

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

  return puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? MAC_CHROME,
    headless:       true,
    args:           ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

const PDF_OPTIONS = { printBackground: true, preferCSSPageSize: true } as const;

export async function renderVocReportPdf(
  order:      VocOrderInfo,
  reportData: VocReportData,
): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const render = async (html: string) => {
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      return page.pdf(PDF_OPTIONS);
    };

    // Pass 1: measure each section to populate TOC page numbers.
    // Cover (p1) + Contents (p2) = start at page 3.
    const pageNumbers: Partial<Record<VocSectionId, number>> = {};
    let next = 3;
    for (const s of VOC_SECTIONS) {
      const pdf = await render(
        buildVocReportHtml(order, reportData, { only: s.id }),
      );
      pageNumbers[s.id] = next;
      next += (await PDFDocument.load(pdf)).getPageCount();
    }

    // Pass 2: full report with TOC page numbers filled in.
    const pdf = await render(
      buildVocReportHtml(order, reportData, { pageNumbers }),
    );
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
