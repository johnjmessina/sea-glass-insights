import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      token:    string;
      responses: Record<string, string>; // questionId → value
    };
    const { token, responses } = body;

    if (!token || !responses) {
      return NextResponse.json({ error: "Missing token or responses" }, { status: 400 });
    }

    // Look up contact by token
    const { data: contact, error: contactErr } = await supabase
      .from("survey_contacts")
      .select("id, order_id, completed_at")
      .eq("token", token)
      .single();

    if (contactErr || !contact) {
      return NextResponse.json({ error: "Invalid survey link" }, { status: 404 });
    }

    if (contact.completed_at) {
      return NextResponse.json({ error: "Survey already completed" }, { status: 409 });
    }

    // Insert one row per question response
    const rows = Object.entries(responses).map(([questionId, value]) => ({
      order_id:    contact.order_id,
      contact_id:  contact.id,
      question_id: questionId,
      value,
    }));

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("survey_responses")
        .insert(rows);

      if (insertErr) {
        console.error("Insert responses error:", insertErr);
        return NextResponse.json({ error: "Failed to save responses" }, { status: 500 });
      }
    }

    // Mark contact as completed
    await supabase
      .from("survey_contacts")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", contact.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit response error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
