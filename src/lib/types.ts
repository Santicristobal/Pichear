export type Vertical =
  | "Crypto"
  | "AI"
  | "Fintech"
  | "Biotech"
  | "SaaS"
  | "Hardware"
  | "Otro";

export type Stage = "Idea" | "Pre-seed" | "Seed" | "Series A+";

export type AgentType = "skeptic" | "builder" | "strategist";

export type Verdict = "INVEST" | "PASS" | "MORE_INFO";

export interface Pitch {
  id: string;
  startup_name: string;
  oneliner: string;
  problem: string;
  solution: string;
  team: string;
  vertical: Vertical;
  stage: Stage;
  country: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  pitch_id: string;
  agent_type: AgentType;
  verdict: Verdict;
  justification: string;
  dimension_scores: Record<string, number>;
  created_at: string;
}

export interface Result {
  id: string;
  pitch_id: string;
  final_score: number;
  approved: boolean;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  email: string | null;
  og_image_url: string | null;
  share_url: string;
  created_at: string;
}

export interface PitchFormData {
  startup_name: string;
  oneliner: string;
  problem: string;
  solution: string;
  team: string;
  vertical: Vertical | "";
  stage: Stage | "";
  country: string;
}
