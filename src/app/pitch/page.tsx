"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PitchFormData } from "@/lib/types";

const VERTICALS = ["AI", "Fintech", "SaaS", "Crypto", "Marketplace", "Edtech", "Healthtech", "Climate/Energy", "Otra vertical"];
const STAGES = ["Idea", "Pre-seed", "Seed", "Series A+"];
const FOUNDERS_OPTIONS = [
  { value: "solo", label: "Solo/a" },
  { value: "duo", label: "2 cofounders" },
  { value: "small_team", label: "3-4 personas" },
  { value: "full_team", label: "5+ personas" },
];
const LOOKING_FOR_OPTIONS = [
  { value: "feedback", label: "Feedback" },
  { value: "investment", label: "Inversion" },
  { value: "cofounders", label: "Cofounders" },
  { value: "customers", label: "Clientes" },
  { value: "just_roast", label: "Solo quiero el roast" },
];

// Reglas de validacion por campo requerido
const REQUIRED_FIELDS = {
  startup_name: { label: "Nombre de la startup", max: 100 },
  oneliner: { label: "One-liner", max: 120 },
  problem: { label: "Problema", max: 280 },
  solution: { label: "Solucion", max: 280 },
  target_user: { label: "Para quien es tu producto", max: 100 },
  founders: { label: "Founders", max: 0 },
  vertical: { label: "Vertical", max: 0 },
  stage: { label: "Stage", max: 0 },
} as const;

export default function PitchPage() {
  const router = useRouter();

  const [form, setForm] = useState<PitchFormData>({
    startup_name: "",
    oneliner: "",
    problem: "",
    solution: "",
    founders: "",
    target_user: "",
    vertical: "",
    stage: "",
    looking_for: "",
    business_model: "",
    metrics: "",
    competitors: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PitchFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField(field: keyof PitchFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PitchFormData, string>> = {};

    for (const [key, config] of Object.entries(REQUIRED_FIELDS)) {
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
      const pitchRes = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!pitchRes.ok) {
        const errData = await pitchRes.json().catch(() => null);
        throw new Error(errData?.error || "Error al enviar el pitch");
      }

      const { id } = await pitchRes.json();

      // Redirigir al Q&A con los agentes
      router.push(`/pitch/${id}/questions`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Algo salio mal");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-zinc-700 border-t-red-500 animate-spin" />
          </div>
          <p className="text-zinc-300 text-lg">Guardando tu pitch...</p>
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
            />
          </Field>

          {/* One-liner */}
          <Field label="One-liner" error={errors.oneliner}>
            <input
              type="text"
              value={form.oneliner}
              onChange={(e) => updateField("oneliner", e.target.value)}
              maxLength={120}
              className="form-input"
              placeholder="Que haces en una oracion. Ej: Uber para mascotas"
            />
          </Field>

          {/* Problema */}
          <Field label="Problema" error={errors.problem}>
            <textarea
              value={form.problem}
              onChange={(e) => updateField("problem", e.target.value)}
              maxLength={280}
              rows={3}
              className="form-input resize-none"
              placeholder="Que problema resuelven y para quien. Se breve."
            />
          </Field>

          {/* Solucion */}
          <Field label="Solucion" error={errors.solution}>
            <textarea
              value={form.solution}
              onChange={(e) => updateField("solution", e.target.value)}
              maxLength={280}
              rows={3}
              className="form-input resize-none"
              placeholder="Como lo resuelven. Sin buzzwords."
            />
          </Field>

          {/* Para quien */}
          <Field label="Para quien es tu producto?" error={errors.target_user}>
            <input
              type="text"
              value={form.target_user}
              onChange={(e) => updateField("target_user", e.target.value)}
              maxLength={100}
              className="form-input"
              placeholder="Ej: Pymes de LATAM con +10 empleados"
            />
          </Field>

          {/* Founders, Vertical, Stage en grilla */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Field label="Founders" error={errors.founders}>
              <select
                value={form.founders}
                onChange={(e) => updateField("founders", e.target.value)}
                className="form-input"
              >
                <option value="">Seleccionar...</option>
                {FOUNDERS_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </Field>

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

          {/* Separador: campos opcionales */}
          <div className="border-t border-zinc-800 pt-6">
            <p className="text-sm text-zinc-400 mb-4 italic">
              Si no lo completas, los inversores van a asumir lo peor.
            </p>

            <div className="space-y-6">
              <Field label="Modelo de negocio" error={errors.business_model}>
                <textarea
                  value={form.business_model}
                  onChange={(e) => updateField("business_model", e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Como ganan o van a ganar plata?"
                />
              </Field>

              <Field label="Metricas" error={errors.metrics}>
                <textarea
                  value={form.metrics}
                  onChange={(e) => updateField("metrics", e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Usuarios, revenue, crecimiento. Numeros concretos."
                />
              </Field>

              <Field label="Competidores" error={errors.competitors}>
                <textarea
                  value={form.competitors}
                  onChange={(e) => updateField("competitors", e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Quienes son y por que sos diferente."
                />
              </Field>

              <Field label="Que estas buscando?" error={errors.looking_for}>
                <select
                  value={form.looking_for}
                  onChange={(e) => updateField("looking_for", e.target.value)}
                  className="form-input"
                >
                  <option value="">Seleccionar...</option>
                  {LOOKING_FOR_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Error general */}
          {submitError && (
            <p className="text-red-400 text-sm">{submitError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Pichear
          </button>
        </form>
      </div>
    </div>
  );
}

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
