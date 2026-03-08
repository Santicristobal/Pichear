import Link from "next/link";

const agents = [
  {
    emoji: "🔍",
    name: "The Skeptic",
    description:
      "Busca los puntos débiles de tu pitch. Si tu modelo de negocio tiene un hueco, lo va a encontrar.",
  },
  {
    emoji: "🛠️",
    name: "The Builder",
    description:
      "Evalúa tu producto y tecnología. Si no se puede construir o escalar, te lo dice en la cara.",
  },
  {
    emoji: "🎯",
    name: "The Strategist",
    description:
      "Analiza mercado, timing y competencia. Si tu estrategia no cierra, no va a invertir.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-block rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">
          Powered by AI
        </span>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Pitchea tu startup.
          <br />
          <span className="text-red-500">Sobreviví al roast.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          3 inversores de IA van a destrozar tu pitch. Si sobrevivís, te
          conectamos con VCs reales.
        </p>

        <Link
          href="/pitch"
          className="mt-10 inline-flex items-center rounded-lg bg-red-500 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25"
        >
          Empezar pitch
        </Link>
      </main>

      {/* Agents */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="mb-4 text-4xl">{agent.emoji}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {agent.name}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 text-center text-sm text-zinc-600">
        Un proyecto de Crecimiento
      </footer>
    </div>
  );
}
