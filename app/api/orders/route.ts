import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const archived = req.nextUrl.searchParams.get("archived") === "true";

  const query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (archived) {
    query.eq("is_archived", true);
  } else {
    // Active orders: exclude archived AND exclude pending_payment
    query.eq("is_archived", false).neq("status", "pending_payment");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
