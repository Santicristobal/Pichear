import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PitchFormData } from "@/lib/types";

const REQUIRED_FIELDS: (keyof PitchFormData)[] = [
  "startup_name",
  "oneliner",
  "problem",
  "solution",
  "target_user",
  "founders",
  "vertical",
  "stage",
];

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await req.json();

    // Validar campos requeridos
    const missing = REQUIRED_FIELDS.filter(
      (field) => !body[field] || typeof body[field] !== "string" || !body[field].trim()
    );

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar limite de intentos (max 2 por nombre de startup)
    const normalizedName = body.startup_name.trim().toLowerCase();
    const { count, error: countError } = await supabase
      .from("pitches")
      .select("id", { count: "exact", head: true })
      .ilike("startup_name", normalizedName);

    if (!countError && count !== null && count >= 2) {
      return NextResponse.json(
        { error: "Esta startup ya fue evaluada 2 veces. El roast es final." },
        { status: 429 }
      );
    }

    // Armar objeto limpio
    const pitchData: PitchFormData = {
      startup_name: body.startup_name.trim(),
      oneliner: body.oneliner.trim(),
      problem: body.problem.trim(),
      solution: body.solution.trim(),
      target_user: body.target_user.trim(),
      founders: body.founders.trim(),
      vertical: body.vertical.trim(),
      stage: body.stage.trim(),
      looking_for: (body.looking_for || "").trim() || null,
      business_model: (body.business_model || "").trim(),
      metrics: (body.metrics || "").trim(),
      competitors: (body.competitors || "").trim(),
    };

    const { data, error } = await supabase
      .from("pitches")
      .insert(pitchData)
      .select("id")
      .single();

    if (error) {
      console.error("Error insertando pitch:", error);
      return NextResponse.json(
        { error: "Error guardando el pitch" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Error en POST /api/pitch:", err);
    return NextResponse.json(
      { error: "Error procesando la solicitud" },
      { status: 500 }
    );
  }
}
