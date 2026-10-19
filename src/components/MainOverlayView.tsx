import React from 'react';
import { X, ArrowLeft, Target, Calendar, BarChart3, Settings } from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';
import { CalendarView } from './CalendarView';
import { KpiTabView } from './KpiTabView';
import { SettingsView } from './SettingsView';
import { ActiveDrawerTab } from './HamburgerMenu';
import { getTodayKey } from '../utils/consistency';

interface MainOverlayViewProps {
  activeTab: ActiveDrawerTab;
  onClose: () => void;
  goals: GoalNote[];
  activeGoal: GoalNote | null;
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: (monthStr?: string, targetDateStr?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, newProgress: number) => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRestoreGoal: (goalId: string) => void;
  onPermanentlyDeleteGoal: (goalId: string) => void;
  onEmptyTrash: () => void;
  onRecordSession: (goalId: string, sessionType: 'morning' | 'evening') => void;
  onSelectTab?: (tab: ActiveDrawerTab) => void;
  onApplyTemplate?: (title: string, contentHtml: string, type: 'goal' | 'battle_plan') => void;
  onImportBackup?: (goals: GoalNote[]) => void;
}

export const MainOverlayView: React.FC<MainOverlayViewProps> = ({
  activeTab,
  onClose,
  goals,
  activeGoal,
  settings,
  theme,
  consistencyStats,
  onSelectGoal,
  onCreateGoal,
  onDeleteGoal,
  onUpdateGoalProgress,
  onUpdateSettings,
  onRestoreGoal,
  onPermanentlyDeleteGoal,
  onEmptyTrash,
  onRecordSession,
  onSelectTab,
  onApplyTemplate,
  onImportBackup,
}) => {
  if (!activeTab) return null;

  const todayKey = getTodayKey();
  const deletedGoals = goals.filter((g) => !!g.deletedAt);
  const activeGoals = goals.filter((g) => !g.deletedAt);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Top Bar for Overlay */}
      <div className={`h-12 border-b ${theme.border} ${theme.bgSurface} px-4 flex items-center justify-between`}>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textPrimary} hover:opacity-80 transition-colors flex items-center justify-center`}
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`text-xs font-semibold ${theme.textPrimary}`}>
          {activeTab === 'todays_goal' && "Today's Goal Writing"}
          {activeTab === 'calendar' && 'Goal Calendar & Consistency'}
          {activeTab === 'kpi' && 'Consistency Rate KPI'}
          {activeTab === 'settings' && 'Settings & Trash Bin'}
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-md hover:bg-neutral-500/10 ${theme.textSecondary}`}
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main View Area */}
      <div className={`flex-1 overflow-hidden ${theme.bgSurface}`}>
        {/* TAB 1: TODAY'S GOAL */}
        {activeTab === 'todays_goal' && (
          <div className="flex-1 h-full overflow-y-auto p-6 max-w-4xl mx-auto">
            {/* Header Card */}
            <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bgSubtle} mb-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">
                    Today's Commitment · {todayKey}
                  </span>
                  <h2 className={`text-2xl font-bold mt-1 ${theme.textPrimary}`}>
                    Write Down Your Goals (At Least 2x Daily)
                  </h2>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    Morning session clarifies focus; Evening session audits execution and commits tomorrow’s priorities.
                  </p>
                </div>

                {/* Today's KPI badge */}
                <div className={`p-3 rounded-xl border ${theme.border} ${theme.bgSurface} text-center min-w-[140px]`}>
                  <div className="text-xs text-neutral-400">Today's Writes</div>
                  <div
                    className={`text-2xl font-mono font-bold tabular-nums ${
                      consistencyStats.isTargetMetToday ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {consistencyStats.todaySessionsCount} / {settings.consistencyDailyTarget}
                  </div>
                  <div className="text-[10px] mt-0.5 text-neutral-400">
                    {consistencyStats.isTargetMetToday ? '✓ Target Met' : 'Session remaining'}
                  </div>
                </div>
              </div>

              {/* Action buttons to quickly log morning / evening writes */}
              {activeGoal && (
                <div className="mt-6 pt-4 border-t border-neutral-500/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className={theme.textMuted}>Active Objective: </span>
                    <strong className={theme.textPrimary}>{activeGoal.title}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRecordSession(activeGoal.id, 'morning')}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      Log Morning Write-In
                    </button>
                    <button
                      onClick={() => onRecordSession(activeGoal.id, 'evening')}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                    >
                      Log Evening Write-In
                    </button>
                    <button
                      onClick={onClose}
                      className={`px-3.5 py-2 rounded-lg border ${theme.border} ${theme.textSecondary} text-xs font-semibold hover:${theme.textPrimary}`}
                    >
                      Write in Notepad ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Today's Objectives */}
            <h3 className={`text-sm font-semibold mb-3 ${theme.textPrimary}`}>
              Your Active Objectives
            </h3>

            <div className="space-y-3">
              {activeGoals.map((g) => {
                const isSelected = activeGoal?.id === g.id;
                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? `border-blue-500 ring-2 ring-blue-500/20 ${theme.bgSubtle}`
                        : `border-neutral-500/20 ${theme.bgSurface}`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className={`font-semibold text-sm ${theme.textPrimary}`}>{g.title}</h4>
                        <p className={`text-xs ${theme.textMuted} mt-1 line-clamp-1`}>
                          {g.plainText || 'No description added.'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectGoal(g.id);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${theme.accentBg} text-white hover:opacity-90`}
                      >
                        Open &amp; Edit
                      </button>
                    </div>

                    {/* Progress tracking visual for this goal */}
                    <div className="mt-3 pt-3 border-t border-neutral-500/10 flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-3">
                        <span className={`text-xs font-bold tabular-nums ${g.progress === 100 ? 'text-emerald-400' : theme.accent}`}>
                          {g.progress}%
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-neutral-500/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              g.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </div>

                      <span className="text-[11px] text-neutral-400">
                        {g.sessionsLog?.length || 0} total sessions logged
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR */}
        {activeTab === 'calendar' && (
          <CalendarView
            goals={goals}
            settings={settings}
            theme={theme}
            onSelectGoal={(id) => {
              onSelectGoal(id);
              onClose();
            }}
            onCreateGoal={(m, t) => {
              onCreateGoal(m, t);
              onClose();
            }}
            onDeleteGoal={onDeleteGoal}
            onUpdateGoalProgress={onUpdateGoalProgress}
          />
        )}

        {/* TAB 3: KPI TAB */}
        {activeTab === 'kpi' && (
          <KpiTabView
            goals={goals}
            settings={settings}
            theme={theme}
            consistencyStats={consistencyStats}
            onOpenSettings={() => {
              if (onSelectTab) onSelectTab('settings');
            }}
            onSelectGoal={(id) => {
              onSelectGoal(id);
              onClose();
            }}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            theme={theme}
            deletedGoals={deletedGoals}
            allGoals={goals}
            onUpdateSettings={onUpdateSettings}
            onRestoreGoal={onRestoreGoal}
            onPermanentlyDeleteGoal={onPermanentlyDeleteGoal}
            onEmptyTrash={onEmptyTrash}
            onApplyTemplate={(title, html, type) => {
              if (onApplyTemplate) {
                onApplyTemplate(title, html, type);
                onClose();
              }
            }}
            onImportBackup={onImportBackup}
          />
        )}
      </div>
    </div>
  );
};
