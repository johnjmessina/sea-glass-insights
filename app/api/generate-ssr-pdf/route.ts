import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { renderSsrReportPdf } from "@/lib/ssrPdf/render";

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      analystNote: passedNote,
      aiDraft: passedDraft,
      analystPerspectives: passedPerspectives,
    } = await req.json() as {
      orderId: string;
      analystNote?: string;
      aiDraft?: Record<string, string>;
      analystPerspectives?: Record<string, string>;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const finalDraft        = passedDraft        ?? (order.ai_draft as Record<string, string>) ?? {};
    const finalNote         = passedNote         ?? order.analyst_note ?? "";
    const finalPerspectives = passedPerspectives ?? {};

    const pdfBuffer = await renderSsrReportPdf(
      order,
      finalDraft,
      finalNote,
      finalPerspectives,
    );

    const safeName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="SeaGlassInsights-${safeName}-SyntheticSurveyReport.pdf"`,
        "Content-Length":      String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("SSR PDF generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 },
    );
  }
}
