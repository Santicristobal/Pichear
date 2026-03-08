"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PitchFormData } from "@/lib/types";

const VERTICALS = ["Crypto", "AI", "Fintech", "Biotech", "SaaS", "Hardware", "Otro"];
const STAGES = ["Idea", "Pre-seed", "Seed", "Series A+"];

// Reglas de validacion por campo
const FIELD_CONFIG = {
  startup_name: { label: "Nombre de la startup", max: 100 },
  oneliner: { label: "One-liner", max: 200 },
  problem: { label: "Problema", max: 500 },
  solution: { label: "Solucion", max: 500 },
  team: { label: "Equipo", max: 300 },
  vertical: { label: "Vertical", max: 0 },
  stage: { label: "Stage", max: 0 },
  country: { label: "Pais", max: 0 },
} as const;

export default function PitchPage() {
  const router = useRouter();

  const [form, setForm] = useState<PitchFormData>({
    startup_name: "",
    oneliner: "",
    problem: "",
    solution: "",
    team: "",
    vertical: "",
    stage: "",
    country: "Argentina",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PitchFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Actualiza un campo del form
  function updateField(field: keyof PitchFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpia el error del campo cuando el usuario escribe
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // Validacion client-side: todos los campos son requeridos
  function validate(): boolean {
    const newErrors: Partial<Record<keyof PitchFormData, string>> = {};

    for (const [key, config] of Object.entries(FIELD_CONFIG)) {
      const field = key as keyof PitchFormData;
      const value = form[field].trim();

      if (!value) {
        newErrors[field] = `${config.label} es requerido`;
      } else if (config.max > 0 && value.length > config.max) {
        newErrors[field] = `Maximo ${config.max} caracteres`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setLoading(true);

    try {
      // 1. Crear el pitch
      const pitchRes = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!pitchRes.ok) {
        throw new Error("Error al enviar el pitch");
      }

      const { id } = await pitchRes.json();

      // 2. Generar el roast
      const roastRes = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId: id }),
      });

      if (!roastRes.ok) {
        throw new Error("Error al generar el roast");
      }

      // 3. Redirigir al resultado
      router.push(`/pitch/${id}/result`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Algo salio mal");
      setLoading(false);
    }
  }

  // Estado de carga con animacion
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-red-500 animate-spin" />
          </div>
          <p className="text-zinc-300 text-lg">Los inversores estan deliberando...</p>
          <p className="text-zinc-500 text-sm mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            &larr; Volver
          </Link>
          <h1 className="text-3xl font-bold text-white mt-4">Tu Pitch</h1>
          <p className="text-zinc-400 mt-1">Completa los datos y preparate para el roast.</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-8 space-y-6">
          {/* Startup name */}
          <Field label="Nombre de la startup" error={errors.startup_name}>
            <input
              type="text"
              value={form.startup_name}
              onChange={(e) => updateField("startup_name", e.target.value)}
              maxLength={100}
              className="form-input"
              placeholder="Acme Inc."
            />
          </Field>

          {/* One-liner */}
          <Field label="One-liner" error={errors.oneliner}>
            <input
              type="text"
              value={form.oneliner}
              onChange={(e) => updateField("oneliner", e.target.value)}
              maxLength={200}
              className="form-input"
              placeholder="En una frase, que hace tu startup?"
            />
          </Field>

          {/* Problema */}
          <Field label="Problema" error={errors.problem}>
            <textarea
              value={form.problem}
              onChange={(e) => updateField("problem", e.target.value)}
              maxLength={500}
              rows={3}
              className="form-input resize-none"
              placeholder="Que problema resuelve?"
            />
          </Field>

          {/* Solucion */}
          <Field label="Solucion" error={errors.solution}>
            <textarea
              value={form.solution}
              onChange={(e) => updateField("solution", e.target.value)}
              maxLength={500}
              rows={3}
              className="form-input resize-none"
              placeholder="Como lo resuelve?"
            />
          </Field>

          {/* Equipo */}
          <Field label="Equipo" error={errors.team}>
            <textarea
              value={form.team}
              onChange={(e) => updateField("team", e.target.value)}
              maxLength={300}
              rows={2}
              className="form-input resize-none"
              placeholder="Quienes forman el equipo?"
            />
          </Field>

          {/* Vertical y Stage en fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Vertical" error={errors.vertical}>
              <select
                value={form.vertical}
                onChange={(e) => updateField("vertical", e.target.value)}
                className="form-input"
              >
                <option value="">Seleccionar...</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Stage" error={errors.stage}>
              <select
                value={form.stage}
                onChange={(e) => updateField("stage", e.target.value)}
                className="form-input"
              >
                <option value="">Seleccionar...</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Pais */}
          <Field label="Pais" error={errors.country}>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="form-input"
            />
          </Field>

          {/* Error general */}
          {submitError && (
            <p className="text-red-400 text-sm">{submitError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Enviar Pitch
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente auxiliar para cada campo del form
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
