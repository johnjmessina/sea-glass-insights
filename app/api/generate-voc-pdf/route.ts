import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateVOCReport } from "@/lib/vocReportGenerator";
import type { VocQuantData, VocQuestion } from "@/lib/vocTypes";

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      analystNote:         passedNote,
      aiDraft:             passedDraft,
      analystPerspectives: passedPerspectives,
      questionMap:         passedQMap,
      quantData:           passedQuant,
    } = await req.json() as {
      orderId:              string;
      analystNote?:         string;
      aiDraft?:             Record<string, string>;
      analystPerspectives?: Record<string, string>;
      questionMap?:         VocQuestion[];
      quantData?:           VocQuantData;
    };

    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const sd                = (order.service_data as Record<string, unknown>) ?? {};
    const finalDraft        = passedDraft        ?? (order.ai_draft as Record<string, string>) ?? {};
    const finalNote         = passedNote         ?? (sd.voc_closing_note as string) ?? "";
    const finalPerspectives = passedPerspectives ?? {};
    const finalQMap         = passedQMap         ?? (sd.voc_question_map as VocQuestion[])  ?? [];
    const finalQuant        = passedQuant        ?? (sd.voc_quant_data   as VocQuantData | undefined);

    const docxBuffer: Buffer = await generateVOCReport(
      order, finalDraft, finalNote, finalPerspectives, finalQMap, finalQuant
    );

    const safeName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="SeaGlassInsights-${safeName}-VoiceOfCustomerReport.docx"`,
        "Content-Length":      String(docxBuffer.length),
      },
    });
  } catch (err) {
    console.error("VOC report generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
