export type ThemeMode = 'dark_charcoal' | 'light_notepad' | 'warm_sepia' | 'oled_black';
export type FontChoice = 'sans' | 'mono' | 'serif';
export type FolderViewMode = 'tabular' | 'list';
export type GoalStatus = 'in_progress' | 'achieved' | 'on_track' | 'needs_attention';
export type DocumentType = 'goal' | 'battle_plan';

export type DayConsistencyStatus = 'absent' | 'once' | 'target_met'; // absent (red), 1 time (orange), 2+ times (green)

export interface GoalSessionLog {
  timestamp: string; // ISO string
  sessionType: 'morning' | 'evening' | 'review' | 'custom';
  note?: string;
}

export interface BattlePlanTimer {
  type: 'countdown' | 'countup';
  durationSeconds: number; // e.g. 1500 (25 min) for countdown
  remainingSeconds: number;
  elapsedSeconds: number; // for countup or tracking actual time spent
  isRunning: boolean;
  lastTickTimestamp?: number;
}

export interface BattlePlanItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  timer?: BattlePlanTimer;
}

export interface GoalNote {
  id: string;
  type?: DocumentType; // 'goal' or 'battle_plan' (defaults to 'goal')
  title: string;
  contentHtml: string;
  plainText: string;
  month: string; // e.g. "October 2026"
  monthKey: string; // e.g. "2026-10" for sorting
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  targetDate?: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  status: GoalStatus;
  category: string;
  sessionsLog: GoalSessionLog[]; // all recorded write-in sessions
  isPinned?: boolean;
  deletedAt?: string | null; // ISO string if in trash

  // Battle Plan specific fields
  battlePlanItems?: BattlePlanItem[];
  batchTimer?: BattlePlanTimer;
}

export interface UserSettings {
  theme: ThemeMode;
  fontFamily: FontChoice;
  fontSize: number; // in pixels (14, 16, 18, 20)
  consistencyDailyTarget: number; // default 2 (times per day)
  autoSave: boolean;
}

export interface ConsistencyStats {
  consistencyRate: number; // percentage (0 - 100)
  currentStreak: number; // days in a row target met
  todaySessionsCount: number; // sessions recorded today
  targetSessionsPerDay: number; // from settings (e.g. 2)
  isTargetMetToday: boolean;
  last7Days: {
    date: string; // YYYY-MM-DD
    dayName: string; // Mon, Tue, etc.
    count: number;
    met: boolean;
  }[];
  totalSessionsAllTime: number;
}
