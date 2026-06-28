import { NextRequest, NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  console.log("[manual-order] handler invoked");

  // ── Step 1: parse body ─────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error("[manual-order] STEP 1 FAIL: could not parse request body:", parseErr);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  console.log("[manual-order] STEP 1 OK: body parsed, keys =", Object.keys(body).join(", "));

  // ── Step 2: extract and validate fields ────────────────────────────────────
  const {
    customerName, businessName, email, serviceType,
    q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
    extraServiceData,
  } = body as {
    customerName?: string; businessName?: string; email?: string;
    serviceType?: string;
    q1?: string; q2?: string; q3?: string; q4?: string; q5?: string;
    q6?: string; q7?: string; q8?: string; q9?: string; q10?: string;
    extraServiceData?: Record<string, unknown>;
  };

  if (!customerName || !businessName || !email) {
    console.error("[manual-order] STEP 2 FAIL: missing required fields",
      { hasCustomerName: !!customerName, hasBusinessName: !!businessName, hasEmail: !!email });
    return NextResponse.json(
      { error: "Customer name, business name, and email are required." },
      { status: 400 }
    );
  }
  console.log("[manual-order] STEP 2 OK: required fields present, serviceType =",
    serviceType ?? "market_intelligence_report");

  // ── Step 3: Supabase insert ────────────────────────────────────────────────
  console.log("[manual-order] STEP 3: inserting order into Supabase...");
  let data: Record<string, unknown> | null = null;
  let dbError: PostgrestError | null = null;

  try {
    const result = await supabase
      .from("orders")
      .insert({
        customer_name:  customerName,
        business_name:  businessName,
        email,
        status:         "new",
        analyst_note:   "Manual Order",
        service_type:   serviceType ?? "market_intelligence_report",
        service_data:   extraServiceData ?? null,
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

    data    = result.data as Record<string, unknown> | null;
    dbError = result.error;
  } catch (dbException) {
    console.error("[manual-order] STEP 3 FAIL: Supabase threw an exception:", dbException);
    return NextResponse.json(
      { error: "Database connection error", detail: String(dbException) },
      { status: 500 }
    );
  }

  if (dbError) {
    console.error("[manual-order] STEP 3 FAIL: Supabase insert returned error:", {
      message: dbError.message,
      code:    dbError.code,
      details: dbError.details,
      hint:    dbError.hint,
    });
    return NextResponse.json(
      {
        error:   dbError.message,
        code:    dbError.code,
        details: dbError.details,
        hint:    dbError.hint,
      },
      { status: 500 }
    );
  }

  console.log("[manual-order] STEP 3 OK: order created, id =", data?.id);
  return NextResponse.json(data);
}
