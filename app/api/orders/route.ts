import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const archived = req.nextUrl.searchParams.get("archived") === "true";

  // First, attempt the query with the is_archived column.
  // If that column doesn't yet exist (migration not applied), the query will error.
  // In that case we fall back to the simpler pre-archive query so the dashboard
  // stays functional.

  if (archived) {
    // Fetch archived orders
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("is_archived", true)
      .order("created_at", { ascending: false });

    if (error) {
      // is_archived column may not exist — return empty array rather than crashing the dashboard
      console.warn("orders?archived=true failed (is_archived column may be missing):", error.message);
      return NextResponse.json([]);
    }
    return NextResponse.json(data);
  }

  // Active orders — try with is_archived filter first
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("is_archived", false)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback: query without is_archived (column probably missing)
    console.warn("orders active query failed, retrying without is_archived:", error.message);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false });

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
    return NextResponse.json(fallbackData);
  }

  return NextResponse.json(data);
}
