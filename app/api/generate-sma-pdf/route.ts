import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateSMAReport } from "@/lib/smaReportGenerator";

export async function POST(req: NextRequest) {
  try {
    const { orderId, analystNote: passedNote } = await req.json();
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

    if (!order.ai_draft)
      return NextResponse.json({ error: "No AI draft found." }, { status: 400 });

    // Use note passed from dashboard (reflects unsaved edits); fall back to stored value
    const analystNote = passedNote ?? order.analyst_note ?? "";

    const docxBuffer = await generateSMAReport(
      order,
      order.ai_draft as Record<string, unknown>,
      analystNote,
    );

    const businessName = order.business_name.replace(/[^a-zA-Z0-9]/g, "");
    const filename = `SeaGlassInsights-${businessName}-SocialMediaAudit.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(docxBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("generate-sma-report error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
