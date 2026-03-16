import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const [pitchRes, resultRes] = await Promise.all([
    supabase.from("pitches").select("startup_name").eq("id", id).single(),
    supabase
      .from("results")
      .select("killer_quote, final_score")
      .eq("pitch_id", id)
      .single(),
  ]);

  const name = pitchRes.data?.startup_name ?? "Una startup";
  const quote = resultRes.data?.killer_quote || "Los inversores no se contuvieron.";
  const score = resultRes.data?.final_score ?? null;

  // Truncar quote si es muy largo para que entre en la imagen
  const displayQuote =
    quote.length > 140 ? quote.slice(0, 137) + "..." : quote;

  // Color hint basado en score (sin revelar el numero)
  const accentColor =
    score === null ? "#facc15" : score < 40 ? "#ef4444" : score < 70 ? "#facc15" : "#4ade80";

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
          padding: "60px 80px",
        }}
      >
        {/* Startup name + intro */}
        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {name} fue al roast...
        </div>

        {/* Killer quote */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            fontStyle: "italic",
            color: accentColor,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 40,
            maxWidth: "90%",
          }}
        >
          {"\u201C"}{displayQuote}{"\u201D"}
        </div>

        {/* CTA */}
        <div
          style={{
            fontSize: 22,
            color: "#71717a",
            fontWeight: 600,
          }}
        >
          Mira como le fue {"\u2192"}
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: 18,
            color: "#3f3f46",
            fontWeight: 600,
          }}
        >
          Pichear
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
