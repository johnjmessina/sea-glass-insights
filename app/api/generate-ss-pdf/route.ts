import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateSSReport } = require("@/lib/ssReportGenerator");

export async function POST(req: NextRequest) {
  try {
    const { orderId, analystNote: passedNote } = await req.json() as {
      orderId: string;
      analystNote?: string;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: `Order not found: ${error?.message ?? "no data"}` },
        { status: 404 }
      );
    }

    const analystNote: string =
      passedNote ??
      (order.analyst_note === "Manual Order" ? "" : (order.analyst_note ?? ""));

    const docxBuffer: Buffer = await generateSSReport(order, analystNote);

    const businessName = (order.business_name as string).replace(/[^a-zA-Z0-9]/g, "");
    const filename = `SeaGlassInsights-${businessName}-SecretShopping.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(docxBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error
      ? `${err.message}\n${err.stack ?? ""}`
      : String(err);
    console.error("generate-ss-report error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
