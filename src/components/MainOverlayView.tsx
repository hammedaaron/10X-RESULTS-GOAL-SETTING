import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Target,
  Table as TableIcon,
  LayoutList,
  Plus,
} from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';
import { CalendarView } from './CalendarView';
import { TenXGoalsView } from './TenXGoalsView';
import { TenXGoalEditor } from './TenXGoalEditor';
import { TodaysGoalsView } from './TodaysGoalsView';
import { KpiTabView } from './KpiTabView';
import { SettingsView } from './SettingsView';
import { ActiveDrawerTab } from './HamburgerMenu';

interface MainOverlayViewProps {
  activeTab: ActiveDrawerTab;
  onClose: () => void;
  goals: GoalNote[];
  activeGoal: GoalNote | null;
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  onSelectGoal: (goalId: string) => void;
  onUpdateGoal?: (updatedGoal: GoalNote) => void;
  onCreateGoal: (monthStr?: string, targetDateStr?: string) => void;
  onCreateTenXGoal?: () => void;
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
  settings,
  theme,
  consistencyStats,
  onSelectGoal,
  onUpdateGoal,
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
  // Navigation states
  const [tenXSelectedGoalId, setTenXSelectedGoalId] = useState<string | null>(null);
  const [tenXViewMode, setTenXViewMode] = useState<'tabular' | 'list'>('tabular');
  const [todaysGoalViewMode, setTodaysGoalViewMode] = useState<'tabular' | 'list'>('tabular');

  // Reset 10X selected goal on tab change
  useEffect(() => {
    setTenXSelectedGoalId(null);
  }, [activeTab]);

  if (!activeTab) return null;

  const deletedGoals = goals.filter((g) => !!g.deletedAt);

  // Filter ONLY today's regular goals (exclude 10X Moonshot goals and exclude past days)
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const today = new Date();
  const todaysGoals = goals.filter((g) => {
    if (g.deletedAt) return false;
    // 10x moonshot goals must NOT appear as a list under today's goals
    if (g.type === 'tenx_goal' || g.isMoonshot) return false;
    // Only today's goals appear (not yesterday or any other day)
    const created = new Date(g.createdAt);
    return isSameDay(created, today);
  });

  // Selected 10X Moonshot Goal
  const tenXSelectedGoal = tenXSelectedGoalId
    ? goals.find((g) => g.id === tenXSelectedGoalId && !g.deletedAt)
    : null;

  // Single Master Backward Navigation: works in succession
  const handleMasterBack = () => {
    if (activeTab === 'tenx_goal' && tenXSelectedGoalId) {
      // Step back in succession: first go back to the 10X Moonshot list page
      setTenXSelectedGoalId(null);
      return;
    }
    // Then click again to go back
    onClose();
  };

  // Create new 10X Moonshot goal and open it
  const handleCreateNewTenXGoal = () => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newId = `tenx-${Date.now()}`;

    const newGoal: GoalNote = {
      id: newId,
      type: 'tenx_goal',
      isMoonshot: true,
      title: '',
      month: defaultMonth,
      monthKey: yearMonthKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      progress: 0,
      status: 'in_progress',
      category: '10X Moonshot',
      sessionsLog: [],
      contentHtml: '',
      plainText: '',
      deletedAt: null,
    };

    if (onUpdateGoal) {
      onUpdateGoal(newGoal);
    }
    setTenXSelectedGoalId(newId);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* SINGLE MASTER TOP NAVIGATION BAR (no duplicate sub-bars anywhere) */}
      <div className={`h-12 border-b ${theme.border} ${theme.bgSurface} px-4 flex items-center justify-between shrink-0 select-none`}>
        {/* Left: Master Backward Arrow + Logo/Title */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMasterBack}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textPrimary} hover:opacity-80 transition-colors flex items-center justify-center cursor-pointer`}
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {activeTab === 'tenx_goal' && (
            <div className="w-7 h-7 rounded-md bg-black border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <span className="font-black text-xs">
                <span className="text-white">10</span>
                <span className="text-emerald-400">X</span>
              </span>
            </div>
          )}

          {activeTab === 'todays_goal' && (
            <span className={`text-sm font-bold ${theme.textPrimary}`}>
              Today's Goals
            </span>
          )}

          {activeTab === 'calendar' && (
            <span className={`text-xs font-semibold ${theme.textPrimary}`}>
              Goal Calendar &amp; Consistency
            </span>
          )}

          {activeTab === 'kpi' && (
            <span className={`text-xs font-semibold ${theme.textPrimary}`}>
              Consistency Rate KPI
            </span>
          )}

          {activeTab === 'settings' && (
            <span className={`text-xs font-semibold ${theme.textPrimary}`}>
              Settings &amp; Trash Bin
            </span>
          )}
        </div>

        {/* Right: Clean, un-cluttered controls */}
        <div className="flex items-center gap-2">
          {/* Controls for 10X Goals List (when not in editor) */}
          {activeTab === 'tenx_goal' && !tenXSelectedGoalId && (
            <>
              <div className={`flex items-center border ${theme.border} rounded-lg p-0.5 ${theme.bgSubtle}`}>
                <button
                  onClick={() => setTenXViewMode('tabular')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    tenXViewMode === 'tabular'
                      ? 'bg-neutral-500/20 text-emerald-400'
                      : `${theme.textMuted} hover:${theme.textPrimary}`
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTenXViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    tenXViewMode === 'list'
                      ? 'bg-neutral-500/20 text-emerald-400'
                      : `${theme.textMuted} hover:${theme.textPrimary}`
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleCreateNewTenXGoal}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="New 10X Goal"
                aria-label="New 10X Goal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Controls for Today's Goals (Grid/List toggle + Plus button) */}
          {activeTab === 'todays_goal' && (
            <>
              <div className={`flex items-center border ${theme.border} rounded-lg p-0.5 ${theme.bgSubtle}`}>
                <button
                  onClick={() => setTodaysGoalViewMode('tabular')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    todaysGoalViewMode === 'tabular'
                      ? 'bg-neutral-500/20 text-blue-400'
                      : `${theme.textMuted} hover:${theme.textPrimary}`
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTodaysGoalViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    todaysGoalViewMode === 'list'
                      ? 'bg-neutral-500/20 text-blue-400'
                      : `${theme.textMuted} hover:${theme.textPrimary}`
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  onCreateGoal();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Write Today's Goal"
                aria-label="Write Today's Goal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className={`p-1.5 rounded-md hover:bg-neutral-500/10 ${theme.textSecondary} cursor-pointer`}
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className={`flex-1 overflow-hidden ${theme.bgSurface} flex flex-col`}>
        {/* TAB 1: TODAY'S GOAL */}
        {activeTab === 'todays_goal' && (
          <TodaysGoalsView
            goals={goals}
            theme={theme}
            viewMode={todaysGoalViewMode}
            onSelectGoal={(id) => {
              onSelectGoal(id);
              onClose();
            }}
            onCreateGoal={() => {
              onCreateGoal();
              onClose();
            }}
          />
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

        {/* TAB: 10X MOONSHOT GOALS (Single navigation bar, works in succession) */}
        {activeTab === 'tenx_goal' && (
          tenXSelectedGoal ? (
            <TenXGoalEditor
              goal={tenXSelectedGoal}
              settings={settings}
              theme={theme}
              onUpdateGoal={onUpdateGoal || (() => {})}
              isOverlayOpen={true}
              onRecordSession={onRecordSession}
            />
          ) : (
            <TenXGoalsView
              goals={goals}
              settings={settings}
              theme={theme}
              viewMode={tenXViewMode}
              onSelectGoal={(id) => setTenXSelectedGoalId(id)}
              onCreateTenXGoal={handleCreateNewTenXGoal}
              onSelectMainCanvas={(id) => {
                onSelectGoal(id);
                onClose();
              }}
            />
          )
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
