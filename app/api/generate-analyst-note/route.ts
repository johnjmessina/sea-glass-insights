import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateAnalystNote } from "@/lib/claude";

// Drafts the MIR Analyst Note with AI and saves it to orders.analyst_note.
// Never overwrites a note the analyst has written unless `replace` is true
// (the dashboard asks for confirmation first).
export const maxDuration = 60;

// "Manual Order" is a placeholder the manual-order form stores; the dashboard
// already treats it as an empty note.
const isEmptyNote = (n: unknown) => typeof n !== "string" || !n.trim() || n === "Manual Order";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[generate-analyst-note] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "Server configuration error: API key not configured" }, { status: 500 });
  }

  let body: { orderId?: string; replace?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { orderId, replace = false } = body;
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
  if (!order.ai_draft || !Object.keys(order.ai_draft).length) {
    return NextResponse.json({ error: "Generate the report draft before drafting the Analyst Note." }, { status: 400 });
  }
  if (!replace && !isEmptyNote(order.analyst_note)) {
    return NextResponse.json({ note: order.analyst_note, saved: false, reason: "existing note kept" });
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Analyst Note timed out (55 s). Try again.")), 55_000);
  });

  let note: string;
  try {
    note = await Promise.race([
      generateAnalystNote(order, order.ai_draft as Record<string, unknown>),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error("[generate-analyst-note] failed for order", orderId, "—", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analyst Note generation failed" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }

  const { error: saveError } = await supabase
    .from("orders")
    .update({ analyst_note: note })
    .eq("id", orderId);

  if (saveError) {
    console.error("[generate-analyst-note] Failed to save note:", saveError);
    return NextResponse.json({ error: "Note drafted but could not be saved. Try again." }, { status: 500 });
  }

  return NextResponse.json({ note, saved: true });
}
