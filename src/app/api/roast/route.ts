import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  SKEPTIC_PROMPT,
  BUILDER_PROMPT,
  STRATEGIST_PROMPT,
  META_PROMPT,
  formatPitchAsText,
} from "@/lib/prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

type AgentName = "skeptic" | "builder" | "strategist";

interface AgentEvaluation {
  roast: string;
  verdict: "INVEST" | "PASS" | "MORE_INFO";
  justification: string;
  dimension_scores: Record<string, number>;
}

interface MetaResult {
  final_score: number;
  approved: boolean;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  killer_quote: string;
}

/**
 * Llama a OpenRouter con un system prompt y un mensaje de usuario.
 * Retorna el contenido de la respuesta como string.
 */
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

/**
 * Intenta parsear JSON de la respuesta del agente.
 * Si falla, reintenta una vez pidiendo al modelo que corrija.
 * Si vuelve a fallar, devuelve un fallback.
 */
async function parseAgentResponse(
  rawContent: string,
  systemPrompt: string,
  userMessage: string
): Promise<AgentEvaluation> {
  // Limpiar posibles backticks o bloques markdown
  const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as AgentEvaluation;
  } catch {
    // Retry: pedir al modelo que corrija su respuesta
    console.warn("JSON inválido del agente, reintentando...");
    try {
      const retryContent = await callOpenRouter(
        systemPrompt,
        `Tu respuesta anterior no fue JSON válido. Respondé SOLO con JSON válido, sin texto adicional.\n\nPitch original:\n${userMessage}`
      );
      const retryCleaned = retryContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(retryCleaned) as AgentEvaluation;
    } catch {
      // Fallback: evaluación neutra
      console.error("Retry falló, usando fallback");
      return {
        roast: "Los inversores se quedaron sin palabras. Eso nunca es buena señal.",
        verdict: "MORE_INFO",
        justification: "No se pudo generar una evaluación válida para este pitch.",
        dimension_scores: {},
      };
    }
  }
}

/**
 * Parsea la respuesta del meta-agente con retry y fallback.
 */
async function parseMetaResponse(
  rawContent: string,
  userMessage: string
): Promise<MetaResult> {
  const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as MetaResult;
  } catch {
    console.warn("JSON inválido del meta-agente, reintentando...");
    try {
      const retryContent = await callOpenRouter(
        META_PROMPT,
        `Tu respuesta anterior no fue JSON válido. Respondé SOLO con JSON válido.\n\n${userMessage}`
      );
      const retryCleaned = retryContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(retryCleaned) as MetaResult;
    } catch {
      console.error("Meta-agente retry falló, usando fallback");
      return {
        final_score: 50,
        approved: false,
        strengths: ["No se pudo generar análisis completo"],
        weaknesses: ["No se pudo generar análisis completo"],
        recommendation: "Hubo un error procesando las evaluaciones. Intentá de nuevo.",
        killer_quote: "Hasta la IA se negó a opinar. Eso dice algo.",
      };
    }
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const body = await req.json();
    const { pitchId } = body;

    if (!pitchId) {
      return NextResponse.json({ error: "pitchId es requerido" }, { status: 400 });
    }

    // Buscar el pitch en Supabase
    const { data: pitch, error: pitchError } = await supabase
      .from("pitches")
      .select("*")
      .eq("id", pitchId)
      .single();

    if (pitchError || !pitch) {
      return NextResponse.json({ error: "Pitch no encontrado" }, { status: 404 });
    }

    const pitchText = formatPitchAsText(pitch);

    // Llamadas paralelas a los 3 agentes
    const agents: { name: AgentName; prompt: string }[] = [
      { name: "skeptic", prompt: SKEPTIC_PROMPT },
      { name: "builder", prompt: BUILDER_PROMPT },
      { name: "strategist", prompt: STRATEGIST_PROMPT },
    ];

    const rawResponses = await Promise.all(
      agents.map((agent) => callOpenRouter(agent.prompt, pitchText))
    );

    // Parsear las 3 respuestas (con retry si falla)
    const evaluations = await Promise.all(
      rawResponses.map((raw, i) =>
        parseAgentResponse(raw, agents[i].prompt, pitchText)
      )
    );

    // Armar el texto para el meta-agente con las 3 evaluaciones
    const metaInput = agents
      .map(
        (agent, i) =>
          `--- ${agent.name.toUpperCase()} ---\n${JSON.stringify(evaluations[i], null, 2)}`
      )
      .join("\n\n");

    // Llamada al meta-agente
    const metaRaw = await callOpenRouter(META_PROMPT, metaInput);
    const metaResult = await parseMetaResponse(metaRaw, metaInput);

    // Insertar las 3 evaluaciones en Supabase
    const evalRows = agents.map((agent, i) => ({
      pitch_id: pitchId,
      agent_type: agent.name,
      roast: evaluations[i].roast,
      verdict: evaluations[i].verdict,
      justification: evaluations[i].justification,
      dimension_scores: evaluations[i].dimension_scores,
    }));

    const { error: evalError } = await supabase.from("evaluations").insert(evalRows);
    if (evalError) {
      console.error("Error insertando evaluaciones:", evalError);
      return NextResponse.json(
        { error: "Error guardando evaluaciones" },
        { status: 500 }
      );
    }

    // Insertar el resultado final
    const { data: resultData, error: resultError } = await supabase
      .from("results")
      .insert({
        pitch_id: pitchId,
        final_score: metaResult.final_score,
        approved: metaResult.approved,
        strengths: metaResult.strengths,
        weaknesses: metaResult.weaknesses,
        recommendation: metaResult.recommendation,
        killer_quote: metaResult.killer_quote,
        share_url: `/pitch/${pitchId}/result`,
      })
      .select("id")
      .single();

    if (resultError) {
      console.error("Error insertando resultado:", resultError);
      return NextResponse.json(
        { error: "Error guardando resultado" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { resultId: resultData.id, pitchId },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en POST /api/roast:", err);
    return NextResponse.json(
      { error: "Error procesando el roast" },
      { status: 500 }
    );
  }
}
