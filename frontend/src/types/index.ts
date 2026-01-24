// Simulation types
export interface SimulationConfig {
  version: string;
  engine: 'cannon' | 'ammo' | 'gpu';
  scene: {
    background: string;
    cameraPosition: [number, number, number];
  };
  bodies: SimulationBody[];
  controls?: {
    allowMassChange?: boolean;
    allowVelocityChange?: boolean;
    allowAddRemove?: boolean;
  };
  tutorial?: {
    enabled: boolean;
    steps: string[];
  };
}

export interface SimulationBody {
  id: string;
  type: 'sphere' | 'box' | 'plane' | 'cylinder';
  radius?: number;
  width?: number;
  height?: number;
  depth?: number;
  mass: number;
  position: [number, number, number];
  velocity?: [number, number, number];
  material: {
    color?: string;
    emissive?: string;
    texture?: string;
  };
}

export interface Simulation {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  physics_engine: 'cannon' | 'ammo' | 'gpu';
  is_premium: boolean;
  allow_parameter_control: boolean;
  simulation_config: string; // JSON string
  play_count: number;
  avg_session_duration: number;
  categories: string[];
  difficulty_level: string;
}

// Blueprint types
export interface Blueprint {
  id: number;
  title: string;
  slug: string;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  blueprint_config: string; // JSON string
  base_simulation_id: number;
  visibility: 'public' | 'private' | 'unlisted';
  vote_count: number;
  fork_count: number;
  forked_from?: number;
  created_at: string;
}

// Challenge types
export interface Challenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  challenge_config: string; // JSON string
  success_criteria: string; // JSON string
  start_date: string;
  end_date: string;
  completion_count: number;
  attempt_count: number;
  difficulty_level: string;
  reward?: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  subscriptionStatus: string;
  remainingSimulations: number;
}

export interface UserStats {
  user_id: number;
  is_premium: boolean;
  subscription_status: string;
  blueprints_created: number;
  challenges_completed: number;
  simulations_today: number;
  remaining_today: number;
  total_votes: number;
}

// API Response types
export interface AccessCheckResponse {
  can_access: boolean;
  reason: string;
  is_premium: boolean;
  is_user_premium: boolean;
  remaining_simulations: number;
}

export interface TrackResponse {
  success: boolean;
  remaining_simulations: number;
}

export interface VoteResponse {
  success: boolean;
  vote_count: number;
  user_vote: string | null;
}

export interface ForkResponse {
  success: boolean;
  forked_id: number;
  edit_url: string;
}

export interface ChallengeSubmitResponse {
  success: boolean;
  completed: boolean;
  result_data: any;
}

// Theme types
export type Theme = 'dark-cosmic' | 'light-playful' | 'science-light' | 'science-dark';

// Physics engine types
export type PhysicsEngine = 'cannon' | 'ammo' | 'gpu';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
