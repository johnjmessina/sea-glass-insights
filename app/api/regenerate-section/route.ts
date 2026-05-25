import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-section format instructions for Claude
const FORMAT: Record<string, string> = {
  snapshot: `Return 2-3 cohesive paragraphs as plain text only. No JSON, no headers, no bullet points.`,
  customer_profile: `Return a JSON array only — no other text. Each element must be exactly:
{"name":"3-5 word segment label","desc":"one sentence description","motivation":"primary purchase motivation","key_need":"single most important need"}`,
  competitive_landscape: `Return a JSON array only — no other text. Each element must be exactly:
{"name":"competitor name","strength":"their main competitive advantage","edge":"client's specific edge over them"}`,
  positioning: `Return a JSON object only — no other text. Format exactly:
{"strengths":["statement","statement","statement","statement"],"vulnerabilities":["statement","statement","statement"]}`,
  insights: `Return a JSON array of 4-5 items only — no other text. Each element must be exactly:
{"title":"5-8 word insight title","body":"2-3 sentences unpacking this insight"}`,
  recommendations: `Return a JSON array of exactly 4 items only — no other text. Each element must be exactly:
{"title":"5-8 word action-oriented title","body":"2-3 sentences explaining the recommendation"}`,
};

export async function POST(req: NextRequest) {
  try {
    const { orderId, sectionKey, analystNotes } = await req.json();

    if (!orderId || !sectionKey) {
      return NextResponse.json({ error: "Missing orderId or sectionKey" }, { status: 400 });
    }

    if (!FORMAT[sectionKey]) {
      return NextResponse.json({ error: `Unknown section: ${sectionKey}` }, { status: 400 });
    }

    // Fetch the order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.ai_draft) {
      return NextResponse.json({ error: "No draft exists. Generate the full draft first." }, { status: 400 });
    }

    // Build intake summary
    const intake = [
      order.q1, order.q2, order.q3, order.q4, order.q5,
      order.q6, order.q7, order.q8, order.q9, order.q10,
    ]
      .map((a, i) => `Q${i + 1}: ${a ?? "(not provided)"}`)
      .join("\n");

    const currentContent = (order.ai_draft as Record<string, unknown>)[sectionKey];

    const systemPrompt = `You are a senior market research analyst. The following section was generated from a business intake form. The analyst has reviewed it and provided notes. Please revise this section incorporating the analyst's guidance while maintaining the professional tone and format. Return only the revised section content, no preamble.\n\n${FORMAT[sectionKey]}`;

    const userPrompt = `BUSINESS INTAKE ANSWERS:\n${intake}\n\nCURRENT SECTION (${sectionKey}):\n${JSON.stringify(currentContent, null, 2)}\n\nANALYST NOTES:\n${analystNotes?.trim() || "(no notes — improve and sharpen the existing content)"}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Parse response
    let newContent: unknown;
    if (sectionKey === "snapshot") {
      newContent = raw;
    } else {
      // Strip any accidental markdown fences
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      try {
        newContent = JSON.parse(cleaned);
      } catch {
        console.error("Claude non-JSON response:", cleaned.slice(0, 500));
        return NextResponse.json(
          { error: "Claude returned unexpected format. Try again or simplify your notes." },
          { status: 500 }
        );
      }
    }

    // Save updated draft to Supabase
    const updatedDraft = { ...(order.ai_draft as object), [sectionKey]: newContent };
    await supabase.from("orders").update({ ai_draft: updatedDraft }).eq("id", orderId);

    return NextResponse.json({ content: newContent });
  } catch (err) {
    console.error("Regenerate section error:", err);
    return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
  }
}
