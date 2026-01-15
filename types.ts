
export enum MissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Situation {
  id: string;
  description: string;
  question: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  situations: Situation[];
  status: MissionStatus;
  score: number;
  icon: string;
  color: string;
}

export interface AIResponse {
  score: number;
  feedback: string;
  consequence: string;
  suggestion: string;
  isAppropriate: boolean;
}

export type ViewState = 'DASHBOARD' | 'PLAYING' | 'SUMMARY' | 'QA' | 'FINISHED';

export interface GameState {
  currentMissionIndex: number | null;
  currentSituationIndex: number;
  totalStars: number;
  missions: Mission[];
  view: ViewState;
}
