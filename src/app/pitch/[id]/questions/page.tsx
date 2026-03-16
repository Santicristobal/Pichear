"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// Configuracion de agentes
const AGENTS = [
  {
    type: "skeptic",
    name: "The Skeptic",
    nameEs: "La Esceptica",
    icon: "\u{1F9D0}", // placeholder hasta tener ilustraciones
    color: "text-red-400",
    bgColor: "bg-red-950/30",
    borderColor: "border-red-800/40",
  },
  {
    type: "builder",
    name: "The Builder",
    nameEs: "El Constructor",
    icon: "\u{1F527}",
    color: "text-blue-400",
    bgColor: "bg-blue-950/30",
    borderColor: "border-blue-800/40",
  },
  {
    type: "strategist",
    name: "The Strategist",
    nameEs: "La Estratega",
    icon: "\u{265F}\u{FE0F}",
    color: "text-purple-400",
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-800/40",
  },
];

// Frases de deliberacion
const DELIBERATION_PHRASES = [
  "The Skeptic esta calculando cuanto vas a perder...",
  "The Builder esta buscando tu repo en GitHub...",
  "The Strategist esta googleando a tu competencia...",
  "Los inversores estan peleando entre ellos...",
  "The Skeptic quiere rechazarte pero The Builder lo esta pensando...",
  "The Strategist esta comparandote con startups que ya murieron...",
  "The Builder dice que esto lo hace en un finde...",
  "The Skeptic se rio. Eso nunca es buena senal...",
];

type Phase = "loading" | "questions" | "deliberating" | "error";

interface QuestionData {
  agent_type: string;
  question: string;
}

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const pitchId = params.id as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentAgent, setCurrentAgent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");
  const [deliberationPhrase, setDeliberationPhrase] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Cargar preguntas al montar
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pitchId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Error generando preguntas");
        }

        const data = await res.json();
        setQuestions(data.questions);
        setPhase("questions");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Algo salio mal");
        setPhase("error");
      }
    }

    loadQuestions();
  }, [pitchId]);

  // Efecto de typing para la pregunta actual
  useEffect(() => {
    if (phase !== "questions" || !questions[currentAgent]) return;

    const fullText = questions[currentAgent].question;
    setTypingText("");
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypingText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [phase, currentAgent, questions]);

  // Rotar frases de deliberacion
  useEffect(() => {
    if (phase !== "deliberating") return;

    const interval = setInterval(() => {
      setDeliberationPhrase((prev) => (prev + 1) % DELIBERATION_PHRASES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [phase]);

  // Responder pregunta actual
  async function handleAnswer() {
    const newAnswers = [...answers];
    newAnswers[currentAgent] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentAgent < 2) {
      // Siguiente agente
      setCurrentAgent(currentAgent + 1);
    } else {
      // Todas respondidas — guardar y deliberar
      await startDeliberation(newAnswers);
    }
  }

  const startDeliberation = useCallback(async (finalAnswers: string[]) => {
    setPhase("deliberating");

    try {
      // Guardar respuestas
      const answersPayload = questions.map((q, i) => ({
        agent_type: q.agent_type,
        answer: finalAnswers[i],
      }));

      const answersRes = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId, answers: answersPayload }),
      });

      if (!answersRes.ok) throw new Error("Error guardando respuestas");

      // Duracion minima de 8 segundos para la deliberacion
      const startTime = Date.now();

      // Generar el roast
      const roastRes = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId }),
      });

      if (!roastRes.ok) throw new Error("Error generando el roast");

      // Esperar minimo 8 segundos totales
      const elapsed = Date.now() - startTime;
      if (elapsed < 8000) {
        await new Promise((resolve) => setTimeout(resolve, 8000 - elapsed));
      }

      router.push(`/pitch/${pitchId}/result`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salio mal");
      setPhase("error");
    }
  }, [pitchId, questions, router]);

  // --- RENDERS ---

  // Loading: generando preguntas
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="flex justify-center gap-4 mb-8">
            {AGENTS.map((agent, i) => (
              <div
                key={agent.type}
                className={`text-4xl transition-all duration-500 ${
                  i === 0 ? "animate-bounce" : i === 1 ? "animate-bounce [animation-delay:0.2s]" : "animate-bounce [animation-delay:0.4s]"
                }`}
              >
                {agent.icon}
              </div>
            ))}
          </div>
          <p className="text-zinc-300 text-lg">Los inversores estan leyendo tu pitch...</p>
          <p className="text-zinc-500 text-sm mt-2">Preparando preguntas</p>
        </div>
      </div>
    );
  }

  // Error
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Deliberacion
  if (phase === "deliberating") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-lg">
          {/* Avatares de agentes */}
          <div className="flex justify-center gap-6 mb-10">
            {AGENTS.map((agent) => (
              <div key={agent.type} className="flex flex-col items-center gap-2">
                <div className="text-5xl animate-pulse">{agent.icon}</div>
                <span className={`text-xs font-medium ${agent.color}`}>{agent.name}</span>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Los inversores estan deliberando...</h2>

          {/* Frase rotativa */}
          <p className="text-zinc-400 italic transition-opacity duration-500 min-h-[3rem]">
            {DELIBERATION_PHRASES[deliberationPhrase]}
          </p>

          {/* Barra de progreso */}
          <div className="mt-8 w-64 mx-auto h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full animate-[progress_10s_ease-in-out_forwards]" />
          </div>
        </div>
      </div>
    );
  }

  // Q&A
  const agent = AGENTS[currentAgent];

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progreso */}
        <div className="flex gap-2 mb-8">
          {AGENTS.map((a, i) => (
            <div
              key={a.type}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < currentAgent ? "bg-red-500" : i === currentAgent ? "bg-red-500/50" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Card del agente */}
        <div className={`${agent.bgColor} border ${agent.borderColor} rounded-2xl p-8`}>
          {/* Header del agente */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{agent.icon}</span>
            <div>
              <h2 className={`font-bold text-lg ${agent.color}`}>{agent.name}</h2>
              <p className="text-zinc-500 text-sm">{agent.nameEs}</p>
            </div>
          </div>

          {/* Pregunta con typing */}
          <div className="mb-8">
            <p className="text-white text-lg leading-relaxed">
              {typingText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>

          {/* Respuesta */}
          {!isTyping && (
            <div className="space-y-4">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                maxLength={300}
                rows={3}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
                placeholder="Tu respuesta..."
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 text-xs">{currentAnswer.length}/300</span>
                <button
                  onClick={handleAnswer}
                  disabled={!currentAnswer.trim()}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${
                    currentAgent === 2
                      ? "bg-red-600 hover:bg-red-700 text-white disabled:opacity-30"
                      : "bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-30"
                  } disabled:cursor-not-allowed`}
                >
                  {currentAgent === 2 ? "Que deliberen" : "Responder"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preguntas ya respondidas */}
        {currentAgent > 0 && (
          <div className="mt-6 space-y-3">
            {AGENTS.slice(0, currentAgent).map((a, i) => (
              <div key={a.type} className="bg-zinc-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{a.icon}</span>
                  <span className={`text-sm font-medium ${a.color}`}>{a.name}</span>
                </div>
                <p className="text-zinc-400 text-sm">{questions[i]?.question}</p>
                <p className="text-zinc-300 text-sm mt-1">Tu: {answers[i]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
