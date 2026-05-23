import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { supabase } from "@/lib/supabase";
import type { AIDraft, AnalystCommentary, Order } from "@/lib/supabase";


// ── Brand ─────────────────────────────────────────────────────────────────────
const NAVY    = "#0A2F61";
const SEAFOAM = "#00CED1";
const GREEN   = "#2E8B57";
const SAND    = "#FDF5E6";
const GRAY    = "#9CA3AF";
const WHITE   = "#FFFFFF";

const SECTIONS: { key: keyof AIDraft; label: string }[] = [
  { key: "snapshot",              label: "1. Business Snapshot"    },
  { key: "customer_profile",      label: "2. Customer Profile"      },
  { key: "competitive_landscape", label: "3. Competitive Landscape" },
  { key: "positioning",           label: "4. Market Positioning"    },
  { key: "insights",              label: "5. Key Insights"          },
  { key: "recommendations",       label: "6. Recommendations"       },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function buildPdf(order: Order, draft: AIDraft, commentary: AnalystCommentary): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true });

    doc.on("data",  (c: Buffer) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 612; // letter width pts
    const M = 52;  // content margin

    const today = new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

    // ── Cover page ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 792).fill(NAVY);

    // Accent bar
    doc.rect(M, 120, 44, 4).fill(SEAFOAM);

    doc.fillColor(SEAFOAM).fontSize(9).font("Helvetica")
      .text("PREMIUM MARKET RESEARCH REPORT", M, 90, { characterSpacing: 1.5 });

    doc.fillColor(WHITE).fontSize(32).font("Helvetica-Bold")
      .text(order.business_name, M, 136, { width: W - M * 2, lineGap: 4 });

    doc.fillColor("#93C5FD").fontSize(14).font("Helvetica")
      .text("Market Intelligence Report", M, doc.y + 10);

    doc.moveDown(2);

    const metaY = doc.y + 10;
    doc.fillColor("#93C5FD").fontSize(10).font("Helvetica")
      .text(`Prepared for:  ${order.customer_name}`, M, metaY, { lineGap: 6 })
      .text(`Business:        ${order.business_name}`, { lineGap: 6 })
      .text(`Delivered:       ${today}`,               { lineGap: 6 })
      .text("Prepared by:  Sea Glass Insights",        { lineGap: 6 });

    // Cover footer bar
    doc.rect(0, 752, W, 40).fill(SEAFOAM);
    doc.fillColor(NAVY).fontSize(11).font("Helvetica-Bold")
      .text("Sea Glass Insights", M, 762);
    doc.fillColor(NAVY).fontSize(9).font("Helvetica")
      .text("Refining the Edge.", M, 775);
    doc.fillColor(NAVY).fontSize(9)
      .text("seaglassinsights.com", W - M - 90, 768);

    // ── Report page ───────────────────────────────────────────────────────────
    doc.addPage({ size: "LETTER", margin: 0 });

    // Header bar
    doc.rect(0, 0, W, 38).fill(NAVY);
    doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
      .text("Sea Glass Insights", M, 12);
    doc.fillColor(SEAFOAM).fontSize(8).font("Helvetica")
      .text(`${order.business_name} — Market Research Report`, M, 25);

    // Confidential strip
    doc.rect(0, 38, W, 18).fill("#E5E7EB");
    doc.fillColor(GRAY).fontSize(7).font("Helvetica")
      .text("CONFIDENTIAL — FOR AUTHORIZED USE ONLY", 0, 44, { align: "center", width: W });

    let y = 72;
    const contentWidth = W - M * 2;

    for (const { key, label } of SECTIONS) {
      const body       = draft[key] ?? "";
      const note       = commentary[key] ?? "";
      const bodyLines  = doc.heightOfString(body,  { width: contentWidth, fontSize: 10, lineGap: 3 });
      const noteHeight = note ? doc.heightOfString(note, { width: contentWidth - 28, fontSize: 10, lineGap: 3 }) + 36 : 0;
      const needed     = 26 + bodyLines + noteHeight + 20;

      // New page if needed
      if (y + needed > 752) {
        // Footer on current page
        doc.rect(0, 752, W, 40).fill(NAVY);
        doc.fillColor("#93C5FD").fontSize(8).font("Helvetica")
          .text("Confidential — Prepared exclusively for this client", M, 763);

        doc.addPage({ size: "LETTER", margin: 0 });
        doc.rect(0, 0, W, 38).fill(NAVY);
        doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold").text("Sea Glass Insights", M, 12);
        doc.fillColor(SEAFOAM).fontSize(8).font("Helvetica")
          .text(`${order.business_name} — Market Research Report`, M, 25);
        doc.rect(0, 38, W, 18).fill("#E5E7EB");
        doc.fillColor(GRAY).fontSize(7).text("CONFIDENTIAL — FOR AUTHORIZED USE ONLY", 0, 44, { align: "center", width: W });
        y = 72;
      }

      // Section accent bar + title
      doc.rect(M, y, 4, 16).fill(SEAFOAM);
      doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold")
        .text(label, M + 12, y + 1, { width: contentWidth - 12 });
      y += 22;

      // Body text
      doc.fillColor("#374151").fontSize(10).font("Helvetica")
        .text(body, M, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 10;

      // Analyst commentary box
      if (note) {
        const noteH = doc.heightOfString(note, { width: contentWidth - 28, fontSize: 10, lineGap: 3 });
        doc.rect(M, y, contentWidth, noteH + 28).fill(SAND);
        doc.rect(M, y, 3, noteH + 28).fill(GREEN);
        doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold")
          .text("ANALYST COMMENTARY", M + 14, y + 8, { characterSpacing: 0.5 });
        doc.fillColor("#374151").fontSize(10).font("Helvetica")
          .text(note, M + 14, y + 20, { width: contentWidth - 28, lineGap: 3 });
        y = doc.y + 18;
      } else {
        y += 8;
      }
    }

    // Footer on last page
    doc.rect(0, 752, W, 40).fill(NAVY);
    doc.fillColor("#93C5FD").fontSize(8).font("Helvetica")
      .text("Confidential — Prepared exclusively for this client", M, 763);

    // Page numbers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      if (i === 0) continue; // no page number on cover
      doc.switchToPage(range.start + i);
      doc.fillColor(SEAFOAM).fontSize(8).font("Helvetica")
        .text(`Page ${i} of ${range.count - 1}`, W - M - 60, 763);
    }

    doc.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (error || !order) return NextResponse.json({ error: `Order not found: ${error?.message}` }, { status: 404 });
    if (!order.ai_draft)
      return NextResponse.json({ error: "No AI draft found." }, { status: 400 });

    const pdfBuffer = await buildPdf(order, order.ai_draft, order.analyst_commentary ?? {});
    const slug = order.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filename = `sea-glass-insights-${slug}-report.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("generate-pdf unhandled error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
