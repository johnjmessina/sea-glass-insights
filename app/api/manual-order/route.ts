import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, businessName, email,
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
    } = body;

    if (!customerName || !businessName || !email) {
      return NextResponse.json({ error: "Customer name, business name, and email are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name:  customerName,
        business_name:  businessName,
        email,
        status: "new",
        // analyst_note: "Manual Order" — re-enable after adding column to Supabase
        q1:  q1  || null,
        q2:  q2  || null,
        q3:  q3  || null,
        q4:  q4  || null,
        q5:  q5  || null,
        q6:  q6  || null,
        q7:  q7  || null,
        q8:  q8  || null,
        q9:  q9  || null,
        q10: q10 || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Manual order insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Manual order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
