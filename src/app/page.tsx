import Link from "next/link";

const agents = [
  {
    icon: "\uD83E\uDDD0",
    name: "The Skeptic",
    nameEs: "La Esceptica",
    color: "text-red-400",
    borderColor: "border-red-800/40",
    bgColor: "bg-red-950/20",
    description:
      "Veterana de Sand Hill Road. Ya escucho tu idea 47 veces. Busca agujeros en tu modelo de negocio con la precision de un cirujano y el humor de un comediante de stand-up.",
  },
  {
    icon: "\uD83D\uDD27",
    name: "The Builder",
    nameEs: "El Constructor",
    color: "text-blue-400",
    borderColor: "border-blue-800/40",
    bgColor: "bg-blue-950/20",
    description:
      "CTO serial. Si tu tech no impresiona, te dice 'esto lo hago en un finde con Firebase y tres cafes'. No le importan tus slides — le importa si se puede construir.",
  },
  {
    icon: "\u265F\uFE0F",
    name: "The Strategist",
    nameEs: "La Estratega",
    color: "text-purple-400",
    borderColor: "border-purple-800/40",
    bgColor: "bg-purple-950/20",
    description:
      "Operadora que vio startups nacer y morir. Habla despacio, elige cada palabra, y cuando dice algo duele porque es verdad. Su hobby: compararte con startups que fracasaron.",
  },
];

const steps = [
  { number: "01", title: "Pichea", description: "Completa tu pitch en 2 minutos. Sin decks, sin humo." },
  { number: "02", title: "Te roastean", description: "3 inversores AI te hacen preguntas y despues te destruyen con humor negro." },
  { number: "03", title: "Comparti", description: "Si sobreviviste, comparti tu resultado. Si no, al menos vas a tener la mejor killer quote." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-black text-white tracking-tight">pichear</span>
          <Link
            href="/pitch"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Pichea tu startup
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-4xl text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
          3 inversores AI.
          <br />
          <span className="text-red-500">0 piedad.</span>
        </h1>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
          Pitchea tu startup. Te van a hacer preguntas, te van a destruir con
          humor negro, y te van a dar el feedback que tu mama no te va a dar.
          Si pasas, te conectamos con VCs reales.
        </p>

        <Link
          href="/pitch"
          className="mt-10 inline-flex items-center rounded-xl bg-red-500 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.02]"
        >
          Pichea tu startup
        </Link>

        <p className="mt-4 text-sm text-zinc-600">
          Gratis. 2 minutos. Sin registro.
        </p>
      </main>

      {/* Agents */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-10">
          El panel
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className={`rounded-xl border ${agent.borderColor} ${agent.bgColor} p-6 transition-all hover:scale-[1.02]`}
            >
              <div className="mb-4 text-4xl">{agent.icon}</div>
              <h3 className={`text-lg font-bold ${agent.color}`}>
                {agent.name}
              </h3>
              <p className="text-xs text-zinc-500 mb-3">{agent.nameEs}</p>
              <p className="text-sm leading-relaxed text-zinc-400">
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-zinc-800/50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-12">
            Como funciona
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <span className="text-3xl font-black text-red-500/30">{step.number}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Todo el feedback que necesitas.
          <br />
          <span className="text-zinc-500">Nada del que queres escuchar.</span>
        </h2>
        <Link
          href="/pitch"
          className="mt-8 inline-flex items-center rounded-xl bg-red-500 px-10 py-4 text-lg font-bold text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25"
        >
          Pichea tu startup
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-600">
            Un proyecto de{" "}
            <a href="https://crecimiento.build" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
              Crecimiento
            </a>
          </span>
          <span className="text-xl font-black text-zinc-800 tracking-tight">pichear</span>
        </div>
      </footer>
    </div>
  );
}
