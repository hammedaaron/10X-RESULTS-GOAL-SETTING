import React, { useState } from 'react';
import {
  Folder,
  Settings,
  X,
  Target,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Trash2,
  FileText,
} from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';
import { GoalFoldersView } from './GoalFoldersView';
import { SettingsView } from './SettingsView';

interface NavigationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'editor' | 'folders' | 'settings';
  setActiveView: (view: 'editor' | 'folders' | 'settings') => void;
  goals: GoalNote[];
  activeGoalId: string | null;
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: (month?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, newProgress: number) => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRestoreGoal: (goalId: string) => void;
  onPermanentlyDeleteGoal: (goalId: string) => void;
  onEmptyTrash: () => void;
}

export const NavigationDropdown: React.FC<NavigationDropdownProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  goals,
  activeGoalId,
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
}) => {
  if (!isOpen) return null;

  const deletedGoals = goals.filter((g) => !!g.deletedAt);
  const activeGoalsCount = goals.filter((g) => !g.deletedAt).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Top Overlay Header / Click-outside dismiss strip */}
      <div className="w-full flex justify-end p-2 sm:p-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/80 text-white text-xs hover:bg-neutral-800 transition-colors border border-white/10"
        >
          <X className="w-4 h-4" />
          <span>Close Panel (Esc)</span>
        </button>
      </div>

      {/* Main Drawer Container */}
      <div
        className={`w-full max-w-6xl mx-auto flex-1 flex flex-col rounded-t-xl overflow-hidden border-t border-x ${theme.border} ${theme.bgApp} shadow-2xl`}
      >
        {/* KPI Consistency Rate Banner (Requested right on the dropdown menu) */}
        <div
          className={`p-4 md:px-6 border-b ${theme.border} ${theme.bgSurface} flex flex-wrap items-center justify-between gap-4`}
        >
          {/* Consistency Rate KPI */}
          <div className="flex items-center gap-4">
            {/* Circular Gauge / Percentage badge */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-neutral-500/20"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  stroke="currentColor"
                  strokeWidth="5"
                  className={
                    consistencyStats.consistencyRate >= 80
                      ? 'text-emerald-500'
                      : consistencyStats.consistencyRate >= 50
                      ? 'text-blue-500'
                      : 'text-amber-500'
                  }
                  strokeDasharray={144.5}
                  strokeDashoffset={144.5 - (144.5 * consistencyStats.consistencyRate) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xs font-bold tabular-nums ${theme.textPrimary}`}>
                  {consistencyStats.consistencyRate}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${theme.textPrimary}`}>
                  Overall Consistency Rate
                </h3>
                {consistencyStats.isTargetMetToday && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Target Met Today!
                  </span>
                )}
              </div>
              <p className={`text-xs ${theme.textMuted}`}>
                Objective rule: Write goals down at least {settings.consistencyDailyTarget}x per day.
              </p>
            </div>
          </div>

          {/* Quick Metrics: Today count & Streak */}
          <div className="flex items-center gap-3 text-xs">
            {/* Today status */}
            <div className={`p-2.5 rounded-lg border ${theme.border} ${theme.bgSubtle} text-center min-w-[110px]`}>
              <div className="flex items-center justify-center gap-1 text-neutral-400 mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Log</span>
              </div>
              <div
                className={`font-mono font-bold text-sm tabular-nums ${
                  consistencyStats.isTargetMetToday ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {consistencyStats.todaySessionsCount} / {settings.consistencyDailyTarget} writes
              </div>
            </div>

            {/* Streak */}
            <div className={`p-2.5 rounded-lg border ${theme.border} ${theme.bgSubtle} text-center min-w-[95px]`}>
              <div className="flex items-center justify-center gap-1 text-neutral-400 mb-0.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Streak</span>
              </div>
              <div className={`font-mono font-bold text-sm tabular-nums ${theme.textPrimary}`}>
                {consistencyStats.currentStreak} {consistencyStats.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* 7-Day Dots */}
            <div className={`hidden sm:flex flex-col justify-center p-2.5 rounded-lg border ${theme.border} ${theme.bgSubtle}`}>
              <span className={`text-[10px] ${theme.textMuted} mb-1`}>Last 7 Days (Target: {settings.consistencyDailyTarget}x/day)</span>
              <div className="flex items-center gap-1.5">
                {consistencyStats.last7Days.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-0.5" title={`${day.date}: ${day.count} writes`}>
                    <div
                      className={`w-3.5 h-3.5 rounded-sm ${
                        day.met
                          ? 'bg-emerald-500'
                          : day.count > 0
                          ? 'bg-amber-500/70'
                          : 'bg-neutral-500/20'
                      }`}
                    />
                    <span className="text-[9px] text-neutral-400">{day.dayName.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Goal Folders, Settings & Trash Bin, Back to Editor) */}
        <div className={`px-4 md:px-6 pt-3 border-b ${theme.border} ${theme.bgSurface} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('folders')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                activeView === 'folders'
                  ? `${theme.bgApp} ${theme.border} ${theme.textPrimary} border-b-transparent -mb-[1px]`
                  : `border-transparent ${theme.textMuted} hover:${theme.textPrimary}`
              }`}
            >
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Goal Folders</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-500/20 tabular-nums">
                {activeGoalsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                activeView === 'settings'
                  ? `${theme.bgApp} ${theme.border} ${theme.textPrimary} border-b-transparent -mb-[1px]`
                  : `border-transparent ${theme.textMuted} hover:${theme.textPrimary}`
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Settings &amp; Trash Bin</span>
              {deletedGoals.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold tabular-nums">
                  {deletedGoals.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setActiveView('editor');
              onClose();
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded ${theme.bgHover} ${theme.textSecondary} mb-1`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Notepad Editor</span>
          </button>
        </div>

        {/* Panel Main Body */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'folders' ? (
            <GoalFoldersView
              goals={goals}
              activeGoalId={activeGoalId}
              settings={settings}
              theme={theme}
              onSelectGoal={(id) => {
                onSelectGoal(id);
                onClose();
              }}
              onCreateGoal={(month) => {
                onCreateGoal(month);
                onClose();
              }}
              onDeleteGoal={onDeleteGoal}
              onUpdateGoalProgress={onUpdateGoalProgress}
            />
          ) : (
            <SettingsView
              settings={settings}
              theme={theme}
              deletedGoals={deletedGoals}
              allGoals={goals}
              onUpdateSettings={onUpdateSettings}
              onRestoreGoal={onRestoreGoal}
              onPermanentlyDeleteGoal={onPermanentlyDeleteGoal}
              onEmptyTrash={onEmptyTrash}
            />
          )}
        </div>
      </div>
    </div>
  );
};
