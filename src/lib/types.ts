export type Vertical =
  | "AI"
  | "Fintech"
  | "SaaS"
  | "Crypto"
  | "Marketplace"
  | "Edtech"
  | "Healthtech"
  | "Climate/Energy"
  | "Otra vertical";

export type Founders = "solo" | "duo" | "small_team" | "full_team";

export type LookingFor =
  | "feedback"
  | "investment"
  | "cofounders"
  | "customers"
  | "just_roast";

export type Stage = "Idea" | "Pre-seed" | "Seed" | "Series A+";

export type AgentType = "skeptic" | "builder" | "strategist";

export type Verdict = "INVEST" | "PASS" | "MORE_INFO";

export interface Pitch {
  id: string;
  startup_name: string;
  oneliner: string;
  problem: string;
  solution: string;
  founders: Founders;
  target_user: string;
  vertical: Vertical;
  stage: Stage;
  looking_for: LookingFor | null;
  business_model: string;
  metrics: string;
  competitors: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  pitch_id: string;
  agent_type: AgentType;
  verdict: Verdict;
  roast: string;
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
  killer_quote: string;
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
  founders: Founders | "";
  target_user: string;
  vertical: Vertical | "";
  stage: Stage | "";
  looking_for: LookingFor | "";
  business_model: string;
  metrics: string;
  competitors: string;
}

export interface Question {
  id: string;
  pitch_id: string;
  agent_type: AgentType;
  question: string;
  answer: string | null;
  created_at: string;
}
