import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateVOCQuestions } from "@/lib/claudeServices";
import type { VocQuestion } from "@/lib/vocTypes";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { orderId } = await req.json() as { orderId: string };
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Question generation timed out.")), 55_000)
  );

  try {
    const drafts = await Promise.race([generateVOCQuestions(order), timeout]);

    // Map drafts to full VocQuestion objects with generated IDs
    const questions: VocQuestion[] = drafts.map((d, i) => ({
      id:             `q${Date.now()}_${i}`,
      text:           d.text ?? "",
      type:           d.type ?? "open_ended",
      options:        Array.isArray(d.options) ? d.options : [],
      bannerCut:      (d.suggestedBanners?.length ?? 0) > 0,
      t2bB2b:         !!d.t2bB2b,
      segmentationVar:!!d.segmentationVar,
    }));

    // Save to service_data
    const sd = (order.service_data as Record<string, unknown>) ?? {};
    await supabase.from("orders").update({
      service_data: { ...sd, voc_question_map: questions },
      status: order.status === "new" ? "in_progress" : order.status,
    }).eq("id", orderId);

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[generate-voc-questions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
