import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  SKEPTIC_QUESTION_PROMPT,
  BUILDER_QUESTION_PROMPT,
  STRATEGIST_QUESTION_PROMPT,
  formatPitchAsText,
} from "@/lib/prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

const AGENTS = [
  { name: "skeptic" as const, prompt: SKEPTIC_QUESTION_PROMPT },
  { name: "builder" as const, prompt: BUILDER_QUESTION_PROMPT },
  { name: "strategist" as const, prompt: STRATEGIST_QUESTION_PROMPT },
];

async function callOpenRouter(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY no configurada");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function parseQuestion(raw: string): string {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.question || "No tengo preguntas. Eso es peor.";
  } catch {
    // Si no es JSON valido, usar el texto directamente
    return cleaned || "No tengo preguntas. Eso es peor.";
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const { pitchId } = await req.json();

    if (!pitchId) {
      return NextResponse.json({ error: "pitchId es requerido" }, { status: 400 });
    }

    const { data: pitch, error: pitchError } = await supabase
      .from("pitches")
      .select("*")
      .eq("id", pitchId)
      .single();

    if (pitchError || !pitch) {
      return NextResponse.json({ error: "Pitch no encontrado" }, { status: 404 });
    }

    const pitchText = formatPitchAsText(pitch);

    // 3 llamadas paralelas
    const rawResponses = await Promise.all(
      AGENTS.map((agent) => callOpenRouter(agent.prompt, pitchText))
    );

    const questions = AGENTS.map((agent, i) => ({
      pitch_id: pitchId,
      agent_type: agent.name,
      question: parseQuestion(rawResponses[i]),
    }));

    // Guardar en DB
    const { data, error } = await supabase
      .from("questions")
      .insert(questions)
      .select("id, agent_type, question");

    if (error) {
      console.error("Error insertando preguntas:", error);
      return NextResponse.json({ error: "Error guardando preguntas" }, { status: 500 });
    }

    return NextResponse.json({ questions: data });
  } catch (err) {
    console.error("Error en POST /api/questions:", err);
    return NextResponse.json(
      { error: "Los inversores se fueron a almorzar. Intenta de nuevo en unos minutos." },
      { status: 500 }
    );
  }
}
