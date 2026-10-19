import { GoalNote, UserSettings } from '../types';

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
    title: 'My First Goal Objective',
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

// Persistent load: never resurrects deleted items once user is active
export function loadStoredGoals(): GoalNote[] {
  try {
    const isInitialized = localStorage.getItem(STORAGE_KEY_INITIALIZED);
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // First time ever opening app: initialize with 1 clean empty goal
    if (!isInitialized) {
      const cleanStarter = [createCleanInitialGoal()];
      localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(cleanStarter));
      return cleanStarter;
    }

    // User previously emptied their goals: respect empty array
    return [];
  } catch (err) {
    console.error('Error loading stored goals', err);
    return [createCleanInitialGoal()];
  }
}

// Persistent save: guarantees immediate synchronous persistence
export function saveStoredGoals(goals: GoalNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals to localStorage', err);
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
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

// Export backup to JSON file
export function exportGoalsBackupJSON(goals: GoalNote[], settings: UserSettings): string {
  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    goals,
    settings,
  }, null, 2);
}
