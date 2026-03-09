"use client";

import { useState } from "react";

export default function EmailForm({ pitchId }: { pitchId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const email = new FormData(form).get("email") as string;

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId, email }),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="mt-6 text-green-400 font-semibold">Listo, te vamos a contactar.</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="pitchId" value={pitchId} />
      <div className="flex-1">
        <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
          Dejanos tu email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Enviando..." : "Enviar"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400">Error al enviar. Intenta de nuevo.</p>
      )}
    </form>
  );
}
