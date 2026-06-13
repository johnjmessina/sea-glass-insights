import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateVOCSection } from "@/lib/claudeServices";
import type { VocQuantData, VocQuestion } from "@/lib/vocTypes";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { orderId, sectionKey, quantData, questionMap } = await req.json() as {
    orderId:     string;
    sectionKey:  string;
    quantData?:  VocQuantData;
    questionMap?:VocQuestion[];
  };

  if (!orderId || !sectionKey) {
    return NextResponse.json({ error: "Missing orderId or sectionKey" }, { status: 400 });
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders").select("*").eq("id", orderId).single();
  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Use passed quantData/questionMap first, fall back to service_data
  const sd               = (order.service_data as Record<string, unknown>) ?? {};
  const resolvedQuant    = quantData    ?? (sd.voc_quant_data    as VocQuantData   | undefined);
  const resolvedQMap     = questionMap  ?? (sd.voc_question_map  as VocQuestion[]  | undefined);
  const prevSections     = (order.ai_draft as Record<string, string>) ?? {};

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Section timed out. Use the retry button.")), 55_000)
  );

  let content: string;
  try {
    content = await Promise.race([
      generateVOCSection(order, sectionKey, resolvedQuant, resolvedQMap, prevSections),
      timeout,
    ]);
  } catch (err) {
    console.error(`[generate-voc-section] "${sectionKey}" failed:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Section generation failed" },
      { status: 500 }
    );
  }

  const updatedDraft = { ...prevSections, [sectionKey]: content };
  await supabase.from("orders").update({
    ai_draft: updatedDraft,
    status:   order.status === "new" ? "in_progress" : order.status,
  }).eq("id", orderId);

  return NextResponse.json({ sectionKey, content });
}
