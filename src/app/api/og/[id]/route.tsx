import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";
import type { Evaluation } from "@/lib/types";

export const runtime = "edge";

const AGENT_META: Record<string, { label: string; emoji: string }> = {
  skeptic: { label: "Skeptic", emoji: "\uD83D\uDD0D" },
  builder: { label: "Builder", emoji: "\uD83D\uDD27" },
  strategist: { label: "Strategist", emoji: "\u265F\uFE0F" },
};

function scoreHex(score: number) {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#facc15";
  return "#4ade80";
}

function verdictColor(v: string) {
  if (v === "INVEST") return "#4ade80";
  if (v === "PASS") return "#ef4444";
  return "#facc15";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const [pitchRes, evalsRes, resultRes] = await Promise.all([
    supabase.from("pitches").select("startup_name").eq("id", id).single(),
    supabase.from("evaluations").select("agent_type, verdict").eq("pitch_id", id),
    supabase.from("results").select("final_score, approved").eq("pitch_id", id).single(),
  ]);

  const name = pitchRes.data?.startup_name ?? "Startup";
  const result = resultRes.data as { final_score: number; approved: boolean } | null;
  const evals = (evalsRes.data ?? []) as Pick<Evaluation, "agent_type" | "verdict">[];
  const score = result?.final_score ?? 0;
  const approved = result?.approved ?? false;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "white",
          fontFamily: "sans-serif",
          padding: "40px",
        }}
      >
        {/* Startup name */}
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
          {name}
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: scoreHex(score),
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 20, color: "#71717a", marginBottom: 16 }}>
          /100
        </div>

        {/* Verdict */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: approved ? "#4ade80" : "#ef4444",
            marginBottom: 32,
          }}
        >
          {approved ? "APROBADO" : "NO APROBADO"}
        </div>

        {/* Agent verdicts */}
        <div style={{ display: "flex", gap: 32 }}>
          {evals.map((ev) => {
            const meta = AGENT_META[ev.agent_type] ?? { label: ev.agent_type, emoji: "" };
            return (
              <div
                key={ev.agent_type}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 28 }}>{meta.emoji}</div>
                <div style={{ fontSize: 16, color: "#a1a1aa" }}>{meta.label}</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: verdictColor(ev.verdict),
                  }}
                >
                  {ev.verdict}
                </div>
              </div>
            );
          })}
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: 18,
            color: "#52525b",
            fontWeight: 600,
          }}
        >
          Roast My Startup
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
