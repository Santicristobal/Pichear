import { getSupabase } from "@/lib/supabase";
import type { Pitch, Evaluation, Result, Verdict, AgentType } from "@/lib/types";
import type { Metadata } from "next";
import EmailForm from "./EmailForm";
import ShareGate from "./ShareGate";

// --- Metadata (OG tags) ---

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabase();
  const { data: pitch } = await supabase
    .from("pitches")
    .select("startup_name")
    .eq("id", id)
    .single();

  const title = pitch
    ? `${pitch.startup_name} — Roast My Startup`
    : "Roast My Startup";

  return {
    title,
    openGraph: {
      title,
      description: "Mirá cómo le fue a este startup en el roast.",
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [`/api/og/${id}`],
    },
  };
}

// --- Agent display config ---

const AGENT_CONFIG: Record<
  Evaluation["agent_type"],
  { label: string; emoji: string; color: string }
> = {
  skeptic: { label: "The Skeptic", emoji: "\uD83D\uDD0D", color: "border-red-500" },
  builder: { label: "The Builder", emoji: "\uD83D\uDD27", color: "border-amber-500" },
  strategist: { label: "The Strategist", emoji: "\u265F\uFE0F", color: "border-blue-500" },
};

// --- Helpers ---

function scoreColor(score: number) {
  if (score < 40) return "text-red-500";
  if (score < 70) return "text-yellow-400";
  return "text-green-400";
}

function verdictBadge(approved: boolean) {
  return approved ? (
    <span className="inline-block rounded-full bg-green-600/20 px-4 py-1 text-sm font-bold text-green-400 ring-1 ring-green-500/40">
      APROBADO
    </span>
  ) : (
    <span className="inline-block rounded-full bg-red-600/20 px-4 py-1 text-sm font-bold text-red-400 ring-1 ring-red-500/40">
      NO APROBADO
    </span>
  );
}

function agentVerdictBadge(verdict: Verdict) {
  const map = {
    INVEST: { text: "INVEST", cls: "bg-green-600/20 text-green-400 ring-green-500/40" },
    PASS: { text: "PASS", cls: "bg-red-600/20 text-red-400 ring-red-500/40" },
    MORE_INFO: { text: "MORE INFO", cls: "bg-yellow-600/20 text-yellow-400 ring-yellow-500/40" },
  };
  const v = map[verdict];
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ring-1 ${v.cls}`}>
      {v.text}
    </span>
  );
}


// --- Page ---

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabase();

  // Fetch all data in parallel
  const [pitchRes, evalsRes, resultRes, totalRes] = await Promise.all([
    supabase.from("pitches").select("*").eq("id", id).single(),
    supabase.from("evaluations").select("*").eq("pitch_id", id),
    supabase.from("results").select("*").eq("pitch_id", id).single(),
    supabase.from("results").select("id", { count: "exact", head: true }),
  ]);

  const pitch = pitchRes.data as Pitch | null;
  const evaluations = (evalsRes.data ?? []) as Evaluation[];
  const result = resultRes.data as Result | null;

  if (!pitch || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-zinc-400">Resultado no encontrado.</p>
      </main>
    );
  }

  // Sort evaluations in consistent order
  const agentOrder: AgentType[] = ["skeptic", "builder", "strategist"];
  const sortedEvals = agentOrder
    .map((a) => evaluations.find((e) => e.agent_type === a))
    .filter(Boolean) as Evaluation[];

  const shareUrl = typeof result.share_url === "string" ? result.share_url : "";

  // Calcular percentil
  const totalCount = totalRes.count ?? 0;
  let percentileText = "";
  if (totalCount >= 5) {
    // Contar cuántos tienen score menor
    const { count: belowCount } = await supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .lt("final_score", result.final_score);
    if (belowCount !== null && totalCount > 0) {
      const percentile = Math.round((belowCount / totalCount) * 100);
      percentileText = `Top ${100 - percentile}% de ${totalCount} startups evaluadas`;
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <h1 className="text-center text-3xl font-bold sm:text-4xl">
          {pitch.startup_name}
        </h1>

        {/* Score + verdict */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className={`text-8xl font-black ${scoreColor(result.final_score)}`}>
            {result.final_score}
          </p>
          <p className="text-sm text-zinc-500">/100</p>
          {verdictBadge(result.approved)}
          {percentileText && (
            <p className="mt-2 text-sm text-zinc-500">{percentileText}</p>
          )}
        </div>

        {/* Killer quote */}
        {result.killer_quote && (
          <div className="mt-10 rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center">
            <p className="text-lg italic text-zinc-200 leading-relaxed">
              &ldquo;{result.killer_quote}&rdquo;
            </p>
          </div>
        )}

        {/* Gated content: share to unlock */}
        <ShareGate pitchId={id} startupName={pitch.startup_name} shareUrl={shareUrl}>
          {/* Agent cards */}
          <section className="grid gap-6 sm:grid-cols-3">
            {sortedEvals.map((ev) => {
              const cfg = AGENT_CONFIG[ev.agent_type];
              return (
                <div
                  key={ev.id}
                  className={`rounded-xl border-t-4 ${cfg.color} bg-zinc-900 p-5`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-2xl">{cfg.emoji}</span>
                    <h3 className="font-bold">{cfg.label}</h3>
                  </div>

                  <div className="mb-3">{agentVerdictBadge(ev.verdict)}</div>

                  {ev.roast && (
                    <p className="mb-4 text-sm leading-relaxed text-zinc-200">{ev.roast}</p>
                  )}

                  <p className="mb-4 text-xs text-zinc-500 italic">{ev.justification}</p>

                  <div className="space-y-2">
                    {Object.entries(ev.dimension_scores).map(([dim, score]) => (
                      <div key={dim}>
                        <div className="mb-0.5 flex justify-between text-xs text-zinc-400">
                          <span className="capitalize">{dim.replace(/_/g, " ")}</span>
                          <span>{score}/10</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400"
                            style={{ width: `${Math.min(score * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {result.strengths.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-bold">Fortalezas</h2>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="mt-0.5 text-green-400">&bull;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.weaknesses.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Debilidades</h2>
              <ul className="space-y-1">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="mt-0.5 text-red-400">&bull;</span>
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8 rounded-xl bg-zinc-900 p-6">
            <h2 className="mb-2 text-lg font-bold">Recomendacion</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              {result.recommendation}
            </p>
          </section>

          {/* CTA section */}
          <section className="mt-10 rounded-xl bg-zinc-900 p-6">
            {result.approved ? (
              <>
                <p className="text-zinc-300">
                  Tu startup paso el roast. Si queres conectar con el ecosistema
                  builder de LATAM, dejanos tu email.
                </p>
                <EmailForm pitchId={id} />
                <a
                  href="https://crecimiento.build"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm text-green-400 underline hover:text-green-300"
                >
                  Conoce Crecimiento
                </a>
              </>
            ) : (
              <>
                <p className="text-zinc-300">
                  No te rindas. Usa el feedback para mejorar tu pitch y volve a
                  intentarlo.
                </p>
                <a
                  href="/pitch"
                  className="mt-4 inline-block rounded-lg bg-zinc-700 px-6 py-2 font-semibold text-white hover:bg-zinc-600 transition-colors"
                >
                  Intentar de nuevo
                </a>
              </>
            )}
          </section>
        </ShareGate>
      </div>
    </main>
  );
}
