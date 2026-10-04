import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { renderSmaReportPdf } from "@/lib/smaPdf/render";

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

    // Use note passed from dashboard (reflects unsaved edits); fall back to stored value
    const analystNote = passedNote ?? order.analyst_note ?? "";

    const pdfBuffer = await renderSmaReportPdf(
      order,
      finalDraft as Record<string, unknown>,
      analystNote,
    );

    const businessName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `SeaGlassInsights-${businessName}-SocialMediaAudit.pdf`;

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
    console.error("generate-sma-report error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
