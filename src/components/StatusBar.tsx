import React from 'react';
import { Check, ShieldCheck, PenTool } from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';

interface StatusBarProps {
  goal: GoalNote | null;
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  lastSavedAt: Date | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  goal,
  settings,
  theme,
  consistencyStats,
  lastSavedAt,
}) => {
  const text = goal?.plainText || '';
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 1;

  const themeDisplayNames = {
    dark_charcoal: 'Dark Charcoal',
    light_notepad: 'Notepad Light',
    warm_sepia: 'Warm Sepia',
    oled_black: 'OLED Black',
  };

  return (
    <footer
      className={`h-6 text-[11px] border-t ${theme.border} ${theme.statusBg} px-4 flex items-center justify-between select-none ${theme.textMuted} transition-colors shrink-0`}
    >
      {/* Left: Notepad line/col & words */}
      <div className="flex items-center gap-4">
        <span className="tabular-nums">Ln {lines}, Col {Math.min(charCount, 1)}</span>
        <span>·</span>
        <span className="tabular-nums">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span>·</span>
        <span className="tabular-nums">{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
      </div>

      {/* Center: Consistency Reminder Status */}
      <div className="hidden md:flex items-center gap-2">
        <PenTool className="w-3 h-3 text-blue-400" />
        <span>
          Daily Goal Writes:{' '}
          <strong
            className={`font-mono tabular-nums ${
              consistencyStats.isTargetMetToday ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {consistencyStats.todaySessionsCount} of {settings.consistencyDailyTarget}
          </strong>{' '}
          {consistencyStats.isTargetMetToday ? '(Target Met)' : '(Write down at least 2x/day)'}
        </span>
      </div>

      {/* Right: Theme & Auto-save Status */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">UTF-8</span>
        <span>·</span>
        <span className="hidden sm:inline">{themeDisplayNames[settings.theme]}</span>
        <span>·</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Check className="w-3 h-3" />
          <span>Saved</span>
        </span>
      </div>
    </footer>
  );
};
