import React from 'react';
import {
  X,
  Target,
  Calendar as CalendarIcon,
  BarChart3,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';
import { BrandLogo } from './BrandLogo';

export type ActiveDrawerTab = 'todays_goal' | 'calendar' | 'kpi' | 'settings' | null;

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveDrawerTab;
  onSelectTab: (tab: ActiveDrawerTab) => void;
  goals: GoalNote[];
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  goals,
  settings,
  theme,
  consistencyStats,
}) => {
  if (!isOpen) return null;

  const deletedGoalsCount = goals.filter((g) => !!g.deletedAt).length;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Slide-out Sidebar Drawer */}
      <div
        className={`w-80 sm:w-88 h-full flex flex-col border-r ${theme.border} ${theme.bgSurface} shadow-2xl transition-all`}
      >
        {/* Drawer Header */}
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <BrandLogo size="md" showText={true} />

          <button
            onClick={onClose}
            className={`p-1.5 rounded-md hover:bg-neutral-500/10 ${theme.textSecondary} transition-colors`}
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The 4 Core Clean Navigation Items ONLY */}
        <div className="p-4 space-y-2.5 flex-1 overflow-y-auto">
          {/* 1. Today's Goal */}
          <button
            onClick={() => onSelectTab('todays_goal')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'todays_goal'
                ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgSubtle}`
                : `border-transparent hover:border-neutral-500/20 ${theme.bgHover}`
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-semibold text-sm ${theme.textPrimary}`}>
                  Today's Goal
                </span>
                <span className={`text-xs ${theme.textMuted}`}>
                  {consistencyStats.todaySessionsCount}/{settings.consistencyDailyTarget} writes completed
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                consistencyStats.isTargetMetToday
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {consistencyStats.todaySessionsCount}/{settings.consistencyDailyTarget}
            </span>
          </button>

          {/* 2. Calendar (changed from Goal folders) */}
          <button
            onClick={() => onSelectTab('calendar')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'calendar'
                ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgSubtle}`
                : `border-transparent hover:border-neutral-500/20 ${theme.bgHover}`
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-semibold text-sm ${theme.textPrimary}`}>
                  Calendar
                </span>
                <span className={`text-xs ${theme.textMuted}`}>
                  Year &amp; month overview with consistency dots
                </span>
              </div>
            </div>
          </button>

          {/* 3. KPI Tab */}
          <button
            onClick={() => onSelectTab('kpi')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'kpi'
                ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgSubtle}`
                : `border-transparent hover:border-neutral-500/20 ${theme.bgHover}`
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-semibold text-sm ${theme.textPrimary}`}>
                  KPI Tab
                </span>
                <span className={`text-xs ${theme.textMuted}`}>
                  Consistency rate &amp; streak tracking
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                consistencyStats.consistencyRate >= 80
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {consistencyStats.consistencyRate}%
            </span>
          </button>

          {/* 4. Settings */}
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'settings'
                ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgSubtle}`
                : `border-transparent hover:border-neutral-500/20 ${theme.bgHover}`
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-500/10 text-neutral-400">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-semibold text-sm ${theme.textPrimary}`}>
                  Settings
                </span>
                <span className={`text-xs ${theme.textMuted}`}>
                  Background, consistency target, trash bin
                </span>
              </div>
            </div>

            {deletedGoalsCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletedGoalsCount}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop click to dismiss */}
      <div className="flex-1 h-full cursor-pointer" onClick={onClose} />
    </div>
  );
};
