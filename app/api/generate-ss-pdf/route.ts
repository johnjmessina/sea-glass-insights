import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateSSReport } = require("@/lib/ssReportGenerator");

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      analystNote: passedNote,
      visitOverview: passedVO,
      scorecard: passedSC,
      analystObs: passedObs,
      aiDraft: passedDraft,
      summaryAnalystNote: passedSummaryNote,
    } = await req.json() as {
      orderId: string;
      analystNote?: string;
      visitOverview?: Record<string, string>;
      scorecard?: Record<string, boolean | number>;
      analystObs?: Record<string, string>;
      aiDraft?: Record<string, string>;
      summaryAnalystNote?: string;
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

    // Merge current in-memory state (not yet auto-saved) over whatever is in Supabase
    const storedSD = (order.service_data as Record<string, unknown>) ?? {};
    const reportData = {
      ...order,
      service_data: {
        ...storedSD,
        ss_visit_overview: passedVO  ?? storedSD.ss_visit_overview ?? {},
        ss_scorecard:      passedSC  ?? storedSD.ss_scorecard      ?? {},
        ss_analyst_obs:    passedObs ?? storedSD.ss_analyst_obs    ?? {},
        ss_summary_analyst_note: passedSummaryNote ?? "",
      },
      ai_draft: passedDraft ?? (order.ai_draft as Record<string, string> | null) ?? {},
    };
    const docxBuffer: Buffer = await generateSSReport(reportData, analystNote);

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
