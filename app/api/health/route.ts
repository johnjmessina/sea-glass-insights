import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      ANTHROPIC_API_KEY:  process.env.ANTHROPIC_API_KEY  ? `set (${process.env.ANTHROPIC_API_KEY.slice(0, 12)}...)` : "MISSING",
      SUPABASE_URL:       process.env.SUPABASE_URL        ? "set" : "MISSING",
      SUPABASE_ANON_KEY:  process.env.SUPABASE_ANON_KEY   ? "set" : "MISSING",
      STRIPE_SECRET_KEY:  process.env.STRIPE_SECRET_KEY   ? "set" : "missing (optional)",
      DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD  ? "set" : "MISSING",
    },
    anthropic: null as unknown,
  };

  // Minimal Anthropic ping — 1 output token, just tests connectivity + auth
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

  const allOk =
    !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_ANON_KEY &&
    (checks.anthropic as { ok: boolean }).ok;

  return NextResponse.json({ status: allOk ? "ok" : "degraded", checks }, { status: allOk ? 200 : 500 });
}
