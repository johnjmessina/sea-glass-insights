import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { VocQuestion } from "@/lib/vocTypes";
import { calculateStats } from "@/lib/vocDataProcessing";
import type { ParsedCSV, ColumnMapping } from "@/lib/vocTypes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { orderId: string; questions: VocQuestion[] };
    const { orderId, questions } = body;

    if (!orderId || !questions?.length) {
      return NextResponse.json({ error: "Missing orderId or questions" }, { status: 400 });
    }

    // Get all responses for this order
    const { data: rawResponses, error } = await supabase
      .from("survey_responses")
      .select("contact_id, question_id, value")
      .eq("order_id", orderId);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
    }

    if (!rawResponses || rawResponses.length === 0) {
      return NextResponse.json({ error: "No responses collected yet" }, { status: 404 });
    }

    // Group by contact_id to form "rows"
    const byContact: Record<string, Record<string, string>> = {};
    for (const r of rawResponses) {
      if (!byContact[r.contact_id]) byContact[r.contact_id] = {};
      // select_all responses are stored with ||| separator — convert back for processing
      byContact[r.contact_id][r.question_id] = r.value ?? "";
    }

    // Build ParsedCSV: headers = questionIds, rows = one per respondent
    const headers  = questions.map(q => q.id);
    const rows     = Object.values(byContact).map(contactData =>
      Object.fromEntries(headers.map(qId => [qId, contactData[qId] ?? ""]))
    );

    const parsedCSV: ParsedCSV = { headers, rows };

    // Mapping: questionId → questionId (direct match)
    const mapping: ColumnMapping = Object.fromEntries(headers.map(h => [h, h]));

    // Use existing vocDataProcessing calculateStats
    const quant = calculateStats(parsedCSV, questions, mapping);

    // Also gather open-ended responses
    for (const q of questions) {
      if (q.type === "open_ended") {
        const texts = rows
          .map(r => r[q.id]?.trim())
          .filter(Boolean) as string[];
        quant.openEndedResponses[q.id] = texts;
      }
    }

    return NextResponse.json({ quant, totalResponses: quant.totalResponses });
  } catch (err) {
    console.error("Load responses error:", err);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}
