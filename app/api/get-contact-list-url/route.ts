import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storagePath = searchParams.get("path");

  if (!storagePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const { data, error } = await supabase.storage
    .from("contact-lists")
    .createSignedUrl(storagePath, 300); // 5-minute signed URL

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
