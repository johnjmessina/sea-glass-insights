import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      ANTHROPIC_API_KEY:  process.env.ANTHROPIC_API_KEY  ? `set (${process.env.ANTHROPIC_API_KEY.slice(0, 12)}...)` : "MISSING",
      SUPABASE_URL:       process.env.SUPABASE_URL        ? `set (${process.env.SUPABASE_URL})` : "MISSING",
      SUPABASE_ANON_KEY:  process.env.SUPABASE_ANON_KEY   ? "set" : "MISSING",
      STRIPE_SECRET_KEY:  process.env.STRIPE_SECRET_KEY   ? "set" : "missing (optional)",
      DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD  ? "set" : "MISSING",
    },
    anthropic: null as unknown,
    supabase_select: null as unknown,
    supabase_insert: null as unknown,
  };

  // ── Anthropic ping ─────────────────────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    const start = Date.now();
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      });
      checks.anthropic = { ok: true, ms: Date.now() - start };
    } catch (err) {
      checks.anthropic = {
        ok: false,
        ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    checks.anthropic = { ok: false, error: "ANTHROPIC_API_KEY not set" };
  }

  // ── Supabase SELECT test ───────────────────────────────────────────────────
  {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .limit(1);
      if (error) {
        checks.supabase_select = {
          ok: false, ms: Date.now() - start,
          error: error.message, code: error.code, details: error.details, hint: error.hint,
        };
      } else {
        checks.supabase_select = { ok: true, ms: Date.now() - start, rowCount: data?.length ?? 0 };
      }
    } catch (err) {
      checks.supabase_select = {
        ok: false, ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Supabase INSERT test (inserts a sentinel row then deletes it) ──────────
  {
    const start = Date.now();
    const testEmail = `health-check-${Date.now()}@test.internal`;
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("orders")
        .insert({
          customer_name: "_health_check_",
          business_name: "_health_check_",
          email:         testEmail,
          status:        "new",
          analyst_note:  "DELETE ME — health check sentinel",
          service_type:  "market_intelligence_report",
        })
        .select("id")
        .single();

      if (insertErr) {
        checks.supabase_insert = {
          ok: false, ms: Date.now() - start,
          error: insertErr.message, code: insertErr.code,
          details: insertErr.details, hint: insertErr.hint,
        };
      } else {
        // Clean up immediately
        await supabase.from("orders").delete().eq("id", (inserted as { id: string }).id);
        checks.supabase_insert = { ok: true, ms: Date.now() - start };
      }
    } catch (err) {
      checks.supabase_insert = {
        ok: false, ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const supabaseSelectOk = (checks.supabase_select as { ok: boolean }).ok;
  const supabaseInsertOk = (checks.supabase_insert as { ok: boolean }).ok;

  const allOk =
    !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_ANON_KEY &&
    (checks.anthropic as { ok: boolean }).ok &&
    supabaseSelectOk &&
    supabaseInsertOk;

  return NextResponse.json({ status: allOk ? "ok" : "degraded", checks }, { status: allOk ? 200 : 500 });
}
