import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { regenerateServiceSection } from "@/lib/claudeServices";
import { getEffectiveServiceType } from "@/lib/serviceConfig";
import { regenerateMIRSection } from "@/lib/claude";
import { isMirSectionKey } from "@/lib/mirSections";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { orderId, sectionKey, analystNotes, tableContext } = await req.json() as {
      orderId: string;
      sectionKey: string;
      analystNotes?: string;
      tableContext?: string;  // for SMA competitive comparison — serialized table data
    };

    if (!orderId || !sectionKey) {
      return NextResponse.json({ error: "Missing orderId or sectionKey" }, { status: 400 });
    }

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

    const serviceType = getEffectiveServiceType(order.service_type);

    // ── MIR sections — same per-section format and validation as generation ──
    if (serviceType === "market_intelligence_report" && isMirSectionKey(sectionKey)) {
      let newContent: unknown;
      try {
        newContent = await regenerateMIRSection(
          order,
          sectionKey,
          order.ai_draft as Record<string, unknown>,
          analystNotes,
        );
      } catch (err) {
        console.error(`[regenerate-section] MIR "${sectionKey}" failed for order`, orderId, "—", err);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Regeneration failed" },
          { status: 500 }
        );
      }

      const updatedDraft = { ...(order.ai_draft as object), [sectionKey]: newContent };
      const { error: saveError } = await supabase.from("orders").update({ ai_draft: updatedDraft }).eq("id", orderId);
      if (saveError) {
        console.error("[regenerate-section] Failed to save MIR section:", saveError);
        return NextResponse.json({ error: "Section regenerated but could not be saved. Try again." }, { status: 500 });
      }
      return NextResponse.json({ content: newContent });
    }

    // ── Non-MIR sections — plain text regeneration ─────────────────────────────
    const currentContent = ((order.ai_draft as Record<string, unknown>)[sectionKey] as string) ?? "";

    // Special handling: SMA competitive comparison — inject table data into prompt
    const isCompTable = serviceType === "social_media_audit" && sectionKey === "competitive_social_comparison";

    const newContent = await regenerateServiceSection(
      order,
      sectionKey,
      currentContent,
      isCompTable && tableContext
        ? `${analystNotes?.trim() ? analystNotes.trim() + "\n\n" : ""}COMPARISON TABLE DATA:\n${tableContext}`
        : (analystNotes ?? "")
    );

    const updatedDraft = { ...(order.ai_draft as object), [sectionKey]: newContent };
    await supabase.from("orders").update({ ai_draft: updatedDraft }).eq("id", orderId);

    return NextResponse.json({ content: newContent });

  } catch (err) {
    console.error("Regenerate section error:", err);
    return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
  }
}
