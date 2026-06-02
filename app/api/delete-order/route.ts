import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json() as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
