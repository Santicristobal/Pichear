import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabase();
  try {
    // Support both JSON and form-encoded bodies
    const contentType = request.headers.get("content-type") ?? "";
    let pitchId: string;
    let email: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      pitchId = body.pitchId;
      email = body.email;
    } else {
      const formData = await request.formData();
      pitchId = formData.get("pitchId") as string;
      email = formData.get("email") as string;
    }

    if (!pitchId || !email) {
      return NextResponse.json(
        { error: "pitchId and email are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("results")
      .update({ email })
      .eq("pitch_id", pitchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
