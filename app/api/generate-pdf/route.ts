import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { renderMirReportPdf } from "@/lib/mirPdf/render";
import { missingMirSections, MIR_SECTION_LABELS } from "@/lib/mirSections";

// Chromium cold start plus two render passes; well under this in practice
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { orderId, analystNote: passedNote, aiDraft: passedDraft } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order)
      return NextResponse.json(
        { error: `Order not found: ${error?.message}` },
        { status: 404 },
      );

    const finalDraft = passedDraft ?? order.ai_draft;

    if (!finalDraft)
      return NextResponse.json({ error: "No AI draft found." }, { status: 400 });

    // Validate that the draft is in the new structured format (only for DB drafts)
    if (!passedDraft && typeof finalDraft.customer_profile === "string") {
      return NextResponse.json(
        { error: "This order uses the old draft format. Please click Regenerate Draft to update it, then save before downloading." },
        { status: 400 },
      );
    }

    // Skip completeness check when using an inline preview draft
    if (!passedDraft) {
      const missing = missingMirSections(finalDraft);
      if (missing.length) {
        return NextResponse.json(
          { error: `Draft is incomplete. Generate these sections first: ${missing.map(k => MIR_SECTION_LABELS[k]).join(", ")}.` },
          { status: 400 },
        );
      }
    }

    // Use note passed from dashboard (reflects unsaved edits); fall back to stored value
    const analystNote = passedNote ?? order.analyst_note ?? "";

    const pdfBuffer = await renderMirReportPdf(order, finalDraft, analystNote);

    const businessName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `SeaGlassInsights-${businessName}-Report.pdf`;

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
    console.error("generate-report error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
