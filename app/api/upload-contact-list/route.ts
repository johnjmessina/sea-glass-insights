import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_EXTS  = /\.(csv|xls|xlsx)$/i;
const MAX_BYTES     = 10 * 1024 * 1024; // 10 MB

// NOTE: Create a private Supabase storage bucket named "contact-lists"
// before this route is used. In the Supabase dashboard:
//   Storage → New bucket → name: contact-lists → Private (unchecked public)
// Then add an INSERT policy allowing the service role or anon key to upload.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const orderId  = formData.get("orderId") as string | null;
    const file     = formData.get("file") as File | null;

    if (!orderId || !file) {
      return NextResponse.json({ error: "orderId and file are required." }, { status: 400 });
    }

    // ── Validate the order exists and is a VoC order ──────────────────────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, analyst_note")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.analyst_note !== "voice-of-customer" && !order.analyst_note?.startsWith("complete-shopper-experience")) {
      return NextResponse.json({ error: "This order does not support contact list upload." }, { status: 400 });
    }

    // ── Validate file type and size ───────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.test(file.name)) {
      return NextResponse.json({ error: "Only CSV, XLS, or XLSX files are accepted." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be under 10 MB." }, { status: 400 });
    }

    // ── Upload to Supabase storage ────────────────────────────────────────
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath  = `${orderId}/${safeFilename}`;
    const arrayBuffer  = await file.arrayBuffer();
    const buffer       = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabase.storage
      .from("contact-lists")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert:      true,
      });

    if (uploadErr) {
      console.error("Supabase storage upload error:", uploadErr.message);
      return NextResponse.json(
        { error: "File upload failed. Please try again or email your list to john@seaglassinsights.com." },
        { status: 500 },
      );
    }

    // ── Record the upload path on the order ──────────────────────────────
    await supabase
      .from("orders")
      .update({ analyst_note: `voice-of-customer | contact-list: ${storagePath}` })
      .eq("id", orderId);

    return NextResponse.json({ ok: true, path: storagePath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("upload-contact-list error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
