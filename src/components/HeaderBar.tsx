import React from 'react';
import {
  Menu,
  ChevronDown,
  Folder,
  Settings,
  Plus,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';

interface HeaderBarProps {
  activeGoal: GoalNote | null;
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onOpenFolders: () => void;
  onOpenSettings: () => void;
  onCreateGoal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeGoal,
  settings,
  theme,
  consistencyStats,
  isMenuOpen,
  onToggleMenu,
  onOpenFolders,
  onOpenSettings,
  onCreateGoal,
}) => {
  return (
    <header
      className={`h-12 border-b ${theme.border} ${theme.bgSurface} px-4 flex items-center justify-between gap-4 select-none transition-colors shrink-0`}
    >
      {/* Zone 1: Brand Wordmark + The Navigation Dropdown Menu Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`font-bold tracking-tight text-sm ${theme.textPrimary} whitespace-nowrap`}>
            10X RESULTS
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${theme.border} ${theme.textMuted} hidden sm:inline`}>
            Windows Notepad Style
          </span>
        </div>

        {/* Primary Navigation Dropdown Menu Toggle */}
        <button
          onClick={onToggleMenu}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all text-xs font-medium ${
            isMenuOpen
              ? `${theme.accentBg} text-white shadow-xs`
              : `${theme.border} ${theme.bgSubtle} ${theme.textPrimary} hover:border-neutral-400`
          }`}
          title="Toggle Navigation Menu: Goal Folders, Consistency KPI, Settings, and Trash Bin"
        >
          <Menu className="w-3.5 h-3.5" />
          <span className="font-semibold">Menu &amp; Goals</span>

          {/* Consistency indicator inside the button */}
          <span
            className={`px-1.5 py-0.2 rounded text-[11px] font-mono tabular-nums font-bold ${
              isMenuOpen
                ? 'bg-black/20 text-white'
                : consistencyStats.consistencyRate >= 80
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {consistencyStats.consistencyRate}% KPI
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Zone 2: Active Goal Context Title */}
      <div className="hidden md:flex items-center gap-2 text-xs truncate max-w-md">
        {activeGoal ? (
          <>
            <span className={theme.textMuted}>📁 {activeGoal.month}</span>
            <span className={theme.textMuted}>/</span>
            <span className={`font-medium truncate ${theme.textPrimary}`}>
              {activeGoal.title}
            </span>
          </>
        ) : (
          <span className={theme.textMuted}>No goal open</span>
        )}
      </div>

      {/* Zone 3: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Goal Folders direct jump */}
        <button
          onClick={onOpenFolders}
          title="View Goal Folders by Month"
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${theme.border} ${theme.textSecondary} ${theme.bgHover} transition-colors`}
        >
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span>Folders</span>
        </button>

        {/* Quick Settings direct jump */}
        <button
          onClick={onOpenSettings}
          title="Open Settings & Trash Bin"
          className={`p-1.5 rounded border ${theme.border} ${theme.textSecondary} ${theme.bgHover} transition-colors`}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* New Goal */}
        <button
          onClick={onCreateGoal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white ${theme.accentBg} hover:opacity-90 shadow-xs transition-opacity`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>
    </header>
  );
};
