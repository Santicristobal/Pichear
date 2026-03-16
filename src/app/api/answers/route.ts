import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const { pitchId, answers } = await req.json();

    if (!pitchId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "pitchId y answers son requeridos" }, { status: 400 });
    }

    // Actualizar cada pregunta con su respuesta
    for (const { agent_type, answer } of answers) {
      const { error } = await supabase
        .from("questions")
        .update({ answer })
        .eq("pitch_id", pitchId)
        .eq("agent_type", agent_type);

      if (error) {
        console.error(`Error guardando respuesta de ${agent_type}:`, error);
        return NextResponse.json({ error: "Error guardando respuestas" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en POST /api/answers:", err);
    return NextResponse.json({ error: "Error procesando respuestas" }, { status: 500 });
  }
}
