import { GoalNote, UserSettings, GoalSessionLog, BattlePlanItem } from '../types';
import { idbGet, idbSet, requestPersistentStorage } from './indexedDb';

const STORAGE_KEY_GOALS = 'objectivenote_goals_v2';
const STORAGE_KEY_SETTINGS = 'objectivenote_settings_v2';
const STORAGE_KEY_INITIALIZED = 'objectivenote_initialized_v2';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark_charcoal',
  fontFamily: 'sans',
  fontSize: 16,
  consistencyDailyTarget: 2, // at least 2x per day as requested
  autoSave: true,
};

// Request durable browser storage permissions on load
if (typeof window !== 'undefined') {
  requestPersistentStorage().catch(() => {});
}

// Deeply sanitize and serialize a single GoalNote, stripping any DOM nodes, events, or non-primitives
export function sanitizeGoal(raw: unknown): GoalNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;

  // Ensure id is clean string
  const id =
    typeof g.id === 'string' && g.id.trim()
      ? g.id.trim()
      : `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Type definition
  const type =
    g.type === 'battle_plan' || g.type === 'tenx_goal' ? g.type : 'goal';

  // Title: strictly string, never an object or element
  let title = 'Untitled Goal';
  if (typeof g.title === 'string' && g.title.trim()) {
    title = g.title.trim();
  } else if (type === 'tenx_goal') {
    title = '10X Moonshot Target';
  } else if (type === 'battle_plan') {
    title = "Today's Battle Plan";
  } else {
    title = "Today's Goal Objective";
  }

  // Month and target date: strictly strings
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const month =
    typeof g.month === 'string' && g.month.trim() ? g.month.trim() : defaultMonth;
  const monthKey =
    typeof g.monthKey === 'string' && g.monthKey.trim() ? g.monthKey.trim() : defaultMonthKey;
  const targetDate =
    typeof g.targetDate === 'string' && g.targetDate.trim() ? g.targetDate.trim() : undefined;

  const createdAt =
    typeof g.createdAt === 'string' && g.createdAt.trim()
      ? g.createdAt.trim()
      : now.toISOString();
  const updatedAt =
    typeof g.updatedAt === 'string' && g.updatedAt.trim()
      ? g.updatedAt.trim()
      : now.toISOString();

  const progress =
    typeof g.progress === 'number' && !isNaN(g.progress)
      ? Math.max(0, Math.min(100, Math.round(g.progress)))
      : 0;

  const status =
    g.status === 'achieved' || g.status === 'needs_attention' || g.status === 'in_progress'
      ? g.status
      : 'in_progress';

  const category =
    typeof g.category === 'string' && g.category.trim() ? g.category.trim() : 'General';
  const contentHtml =
    typeof g.contentHtml === 'string' ? g.contentHtml : '';
  const plainText =
    typeof g.plainText === 'string' ? g.plainText : '';
  const deletedAt =
    typeof g.deletedAt === 'string' && g.deletedAt.trim() ? g.deletedAt.trim() : null;
  const isMoonshot = Boolean(g.isMoonshot || type === 'tenx_goal');

  // Sanitize sessionsLog
  const sessionsLog: GoalSessionLog[] = [];
  if (Array.isArray(g.sessionsLog)) {
    for (const item of g.sessionsLog) {
      if (item && typeof item === 'object') {
        const s = item as Record<string, unknown>;
        sessionsLog.push({
          timestamp: typeof s.timestamp === 'string' ? s.timestamp : now.toISOString(),
          sessionType: s.sessionType === 'morning' || s.sessionType === 'evening' ? s.sessionType : 'morning',
          note: typeof s.note === 'string' ? s.note : '',
        });
      }
    }
  }

  // Sanitize battlePlanItems
  let battlePlanItems: BattlePlanItem[] | undefined;
  if (Array.isArray(g.battlePlanItems)) {
    battlePlanItems = [];
    for (const item of g.battlePlanItems) {
      if (item && typeof item === 'object') {
        const b = item as Record<string, unknown>;
        const planItem: BattlePlanItem = {
          id: typeof b.id === 'string' ? b.id : `bpi-${Math.random().toString(36).slice(2, 7)}`,
          text: typeof b.text === 'string' ? b.text : '',
          completed: Boolean(b.completed),
        };
        if (typeof b.completedAt === 'string' && b.completedAt.trim()) {
          planItem.completedAt = b.completedAt.trim();
        }
        battlePlanItems.push(planItem);
      }
    }
  }

  const clean: GoalNote = {
    id,
    type,
    title,
    month,
    monthKey,
    createdAt,
    updatedAt,
    progress,
    status,
    category,
    sessionsLog,
    contentHtml,
    plainText,
    deletedAt,
    isMoonshot,
  };

  if (targetDate) clean.targetDate = targetDate;
  if (battlePlanItems) clean.battlePlanItems = battlePlanItems;

  return clean;
}

// Clean and sanitize an array of goals safely
export function sanitizeGoals(rawGoals: unknown[]): GoalNote[] {
  if (!Array.isArray(rawGoals)) return [];
  const results: GoalNote[] = [];
  for (const item of rawGoals) {
    const cleaned = sanitizeGoal(item);
    if (cleaned) {
      results.push(cleaned);
    }
  }
  return results;
}

// Clean fresh starter goal (no prefilled templated wordings, ready for user writing)
export function createCleanInitialGoal(): GoalNote {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    id: `goal-${Date.now()}`,
    type: 'goal',
    title: "Today's Goal Objective",
    month: currentMonth,
    monthKey: currentMonthKey,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    progress: 0,
    status: 'in_progress',
    category: 'General',
    sessionsLog: [],
    contentHtml: '',
    plainText: '',
    deletedAt: null,
    isMoonshot: false,
  };
}

// Full Reference Templates (Preserved for Documentation tab in Settings)
export const DOCUMENTATION_TEMPLATES = [
  {
    id: 'doc-template-smart-goal',
    title: 'SMART Goal & 2x Daily Affirmation',
    category: 'Goal Setting Blueprint',
    description: 'Structured framework for writing core objectives twice daily (Morning & Evening).',
    contentHtml: `<h2>🎯 Primary Objective Statement</h2>
<p>I will [specific objective] by [target date] because [compelling personal reason].</p>

<h3>Core Affirmation:</h3>
<p><strong>I write this goal down twice daily because relentless clarity and daily repetition condition my subconscious for decisive execution.</strong></p>

<h3>Three Non-Negotiable Action Milestones:</h3>
<ol>
  <li><strong>First Priority:</strong> Action step to execute in week 1.</li>
  <li><strong>Second Priority:</strong> Action step to execute in week 2.</li>
  <li><strong>Third Priority:</strong> Quality review and audit.</li>
</ol>

<h3>Daily Protocol (2x Per Day):</h3>
<ul>
  <li><em>Morning Intention:</em> Re-read objective upon waking and mentally rehearse high-leverage actions.</li>
  <li><em>Evening Reflection:</em> Audit the day's execution, celebrate progress, and commit tomorrow's focus.</li>
</ul>`,
  },
  {
    id: 'doc-template-battle-plan',
    title: 'High-Stakes Daily Battle Plan',
    category: 'Battle Plan Checklist',
    description: 'Actionable daily checklist format that powers the single-line progress bar (Red to Green).',
    contentHtml: `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Morning priority objective review and alignment</span></p><p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Deep work sprint #1 on core technical deliverable</span></p><p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Execution audit and client milestone review</span></p><p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Evening reflection against written goals and prepare tomorrow</span></p>`,
  },
  {
    id: 'doc-template-health-vitality',
    title: 'Physical Health & Vitality Protocol',
    category: 'Health & Endurance',
    description: 'Endurance, aerobic base, nutrition, and recovery routines.',
    contentHtml: `<h2>🏃 Endurance & Physical Vitality Protocol</h2>
<p>Build peak cardiovascular foundation and sustain high energy throughout the day.</p>

<h3>Weekly Protocol:</h3>
<ul>
  <li><strong>Aerobic Base:</strong> 3x weekly Zone-2 runs or cardio sessions at easy conversational pace.</li>
  <li><strong>Strength & Mobility:</strong> 2x weekly functional resistance training.</li>
  <li><strong>Rest & Recovery:</strong> 1x weekly active recovery walk and dynamic stretching.</li>
</ul>

<h3>Daily Non-Negotiables:</h3>
<ol>
  <li><em>Hydration:</em> 500ml water with electrolytes immediately upon waking.</li>
  <li><u>Sleep target:</u> 7.5 hours minimum per night with zero screens 45 minutes before sleep.</li>
</ol>`,
  },
];

// Persistent synchronous load from localStorage with sanitization
export function loadStoredGoals(): GoalNote[] {
  try {
    const isInitialized = localStorage.getItem(STORAGE_KEY_INITIALIZED);
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return sanitizeGoals(parsed);
      }
    }

    // First time ever opening app: initialize with 1 clean empty goal
    if (!isInitialized) {
      const cleanStarter = [createCleanInitialGoal()];
      saveStoredGoals(cleanStarter);
      return cleanStarter;
    }

    // User previously emptied their goals: respect empty array
    return [];
  } catch (err) {
    console.error('Error loading stored goals', err);
    return [createCleanInitialGoal()];
  }
}

// Durable recovery: inspects IndexedDB in case localStorage was wiped or cleared by the browser
export async function recoverDurableGoals(): Promise<GoalNote[] | null> {
  try {
    const fromIdb = await idbGet<unknown[]>(STORAGE_KEY_GOALS);
    if (Array.isArray(fromIdb) && fromIdb.length > 0) {
      const cleaned = sanitizeGoals(fromIdb);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Failed to recover from durable IndexedDB storage:', err);
  }
  return null;
}

// Guaranteed dual-write persistence: saves to localStorage immediately and IndexedDB for durable recovery
export function saveStoredGoals(goals: GoalNote[]): void {
  try {
    const cleanList = sanitizeGoals(goals);
    const serialized = JSON.stringify(cleanList);
    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEY_GOALS, serialized);

    // Asynchronously save to IndexedDB durable backup store
    idbSet(STORAGE_KEY_GOALS, cleanList).catch((err) => {
      console.warn('IndexedDB async backup save warning:', err);
    });
  } catch (err) {
    console.error('Failed to save goals to storage', err);
  }
}

export function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    const clean = {
      theme: settings.theme || DEFAULT_SETTINGS.theme,
      fontFamily: settings.fontFamily || DEFAULT_SETTINGS.fontFamily,
      fontSize: typeof settings.fontSize === 'number' ? settings.fontSize : DEFAULT_SETTINGS.fontSize,
      consistencyDailyTarget:
        typeof settings.consistencyDailyTarget === 'number'
          ? settings.consistencyDailyTarget
          : DEFAULT_SETTINGS.consistencyDailyTarget,
      autoSave: Boolean(settings.autoSave),
    };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(clean));
    idbSet(STORAGE_KEY_SETTINGS, clean).catch(() => {});
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

// Export backup to JSON file
export function exportGoalsBackupJSON(goals: GoalNote[], settings: UserSettings): string {
  const cleanList = sanitizeGoals(goals);
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      goals: cleanList,
      settings,
    },
    null,
    2
  );
}
