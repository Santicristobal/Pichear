import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl font-black text-red-500/20">404</span>
      <h1 className="mt-4 text-2xl font-bold text-white">
        Los inversores no encontraron esta pagina.
      </h1>
      <p className="mt-2 text-zinc-500">
        Probablemente la destruyeron en el roast.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-xl bg-zinc-800 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
