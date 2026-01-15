
export enum MissionStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  icon: string;
  status: MissionStatus;
  starsEarned: number;
  totalStars: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  starsAwarded?: number;
}

export interface AIResponse {
  evaluation?: {
    score: number;
    stars: number;
    comment: string;
    explanation: string;
    suggestion?: string;
  };
  narrative: string;
  nextQuestion?: string;
  isRetryPrompt: boolean;
  isMissionEnd: boolean;
}

export interface Achievement {
  minStars: number;
  label: string;
  badge: string;
  color: string;
  description: string;
}
