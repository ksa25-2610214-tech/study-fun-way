export interface Avatar {
  id: string;
  name: string;
  x: number;
  y: number;
  isSeated: boolean;
  seatId: string | null;
  studyTime: string;
  avatarEmoji: string;
  status: string;
  message: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  isCompleted: boolean;
  progress: string;
  category: "all" | "timer" | "attendance" | "homework";
  streakCount?: number;
}

export interface StudyMethod {
  id: string;
  title: string;
  timeInfo: string;
  pros: string;
  steps: string[];
  emoji: string;
  tags: string[];
  category?: string;
}

export interface LiveChat {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface BattleOpponent {
  id: string;
  name: string;
  score: number;
  avatarEmoji: string;
  grade: string;
  preferredSport: string;
}

export interface BattleSport {
  id: string;
  name: string;
  emoji: string;
  description: string;
  miniGameRule: string;
  baseWinRate: number; // 0.1 ~ 0.9
}
