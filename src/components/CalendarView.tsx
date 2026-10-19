import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { GoalNote, GoalSessionLog, UserSettings } from '../types';
import { ThemeStyles } from '../utils/theme';
import { formatDateKey } from '../utils/consistency';

interface CalendarViewProps {
  goals: GoalNote[];
  settings: UserSettings;
  theme: ThemeStyles;
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: (monthStr?: string, targetDateStr?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, newProgress: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  goals,
  settings,
  theme,
  onSelectGoal,
  onCreateGoal,
  onDeleteGoal,
  onUpdateGoalProgress,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Month names
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map of date string "YYYY-MM-DD" -> count of sessions written that day across goals
  const activeGoals = goals.filter((g) => !g.deletedAt);

  const dateSessionCounts: Record<string, number> = {};
  const dateGoalMap: Record<string, GoalNote[]> = {};

  activeGoals.forEach((goal) => {
    (goal.sessionsLog || []).forEach((session: GoalSessionLog) => {
      try {
        const d = new Date(session.timestamp);
        if (!isNaN(d.getTime())) {
          const key = formatDateKey(d);
          dateSessionCounts[key] = (dateSessionCounts[key] || 0) + 1;
        }
      } catch {
        // ignore
      }
    });

    // Also map goals targeted for this date
    if (goal.targetDate) {
      if (!dateGoalMap[goal.targetDate]) dateGoalMap[goal.targetDate] = [];
      dateGoalMap[goal.targetDate].push(goal);
    }
  });

  // Calculate days for the selected month
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDayKey(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDayKey(null);
  };

  // Color code calculation according to user prompt:
  // Absent day (0 times): red dot
  // 1 time a day: orange dot
  // 2 times a day: green dot
  // any more than that: green dot
  const getDayStatusColor = (count: number, isFuture: boolean) => {
    if (isFuture) return null;
    if (count === 0) {
      return {
        bg: 'bg-red-500',
        text: 'text-red-400',
        label: '0 writes (Absent)',
      };
    } else if (count === 1) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-400',
        label: '1 write',
      };
    } else {
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-400',
        label: `${count} writes (Goal Target Met)`,
      };
    }
  };

  // Goals associated with the selected month
  const currentMonthString = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const monthGoals = activeGoals.filter((g) => {
    if (g.month === currentMonthString) return true;
    if (g.monthKey === `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`) return true;
    return false;
  });

  // Available years to toggle
  const availableYears = [selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2];

  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme.bgSurface}`}>
      {/* Calendar Header Bar */}
      <div className={`p-4 border-b ${theme.border} flex flex-wrap items-center justify-between gap-3`}>
        {/* Month & Year Title with Dropdown Selector */}
        <div className="flex items-center gap-3">
          <CalendarIcon className={`w-5 h-5 ${theme.accent}`} />
          
          <div className="relative">
            <button
              onClick={() => setYearPickerOpen(!yearPickerOpen)}
              className={`flex items-center gap-1.5 font-bold text-base md:text-lg ${theme.textPrimary} hover:opacity-80 transition-opacity`}
            >
              <span>{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Year & Month Selection Popover */}
            {yearPickerOpen && (
              <div
                className={`absolute top-full left-0 mt-2 p-3 rounded-lg border shadow-xl z-30 ${theme.bgSurface} ${theme.border} min-w-[280px]`}
              >
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-500/20">
                  <span className={`text-xs font-semibold ${theme.textPrimary}`}>Select Year</span>
                  <div className="flex items-center gap-1">
                    {availableYears.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`px-2 py-0.5 rounded text-xs tabular-nums ${
                          selectedYear === yr
                            ? 'bg-blue-600 text-white font-bold'
                            : `${theme.textMuted} hover:${theme.textPrimary}`
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {MONTH_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedMonth(idx);
                        setYearPickerOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded text-xs font-medium text-left transition-colors ${
                        selectedMonth === idx
                          ? 'bg-blue-600 text-white font-bold'
                          : `${theme.bgHover} ${theme.textSecondary}`
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Month Prev/Next Steppers */}
          <div className="flex items-center gap-1 border border-neutral-500/20 rounded-md">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className={`p-1.5 rounded-l-md hover:bg-neutral-500/10 ${theme.textSecondary}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className={`p-1.5 rounded-r-md hover:bg-neutral-500/10 ${theme.textSecondary}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend for Color Codes requested by user */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className={theme.textMuted}>2+ writes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className={theme.textMuted}>1 write</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className={theme.textMuted}>Absent (0)</span>
          </div>

          <button
            onClick={() => onCreateGoal(currentMonthString)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Split View (Calendar Grid on Left/Top, Month/Day Goals on Right/Bottom) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Wide Grid (8 columns on desktop) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} shadow-xs`}>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className={`text-xs font-semibold py-1.5 ${theme.textMuted}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding days */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 md:h-20 rounded-lg opacity-10" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const cellDate = new Date(selectedYear, selectedMonth, dayNum);
                const isToday = formatDateKey(currentDate) === dateKey;
                const isFuture = cellDate > currentDate;
                const count = dateSessionCounts[dateKey] || 0;
                const status = getDayStatusColor(count, isFuture);
                const isSelected = selectedDayKey === dateKey;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDayKey(dateKey === selectedDayKey ? null : dateKey)}
                    className={`h-16 md:h-20 p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgSurface}`
                        : isToday
                        ? `border-blue-400/50 ${theme.bgSurface}`
                        : `border-neutral-500/10 ${theme.bgSurface} hover:border-neutral-500/30`
                    }`}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]'
                            : theme.textPrimary
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* Color-coded consistency dot & write count indicator */}
                    <div className="flex items-center justify-between text-[10px] mt-auto">
                      {status ? (
                        <div className="flex items-center gap-1.5" title={status.label}>
                          {/* Requested color circle */}
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${status.bg} ring-2 ring-black/20 shrink-0`}
                          />
                          <span className={`tabular-nums font-semibold ${status.text}`}>
                            {count}x
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day / Month Goals List & Progress Visuals (5 columns on desktop) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} flex-1 flex flex-col`}>
            {/* Header for Day or Month */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-500/15 mb-3">
              <div>
                <h3 className={`font-semibold text-sm ${theme.textPrimary}`}>
                  {selectedDayKey
                    ? `Goals & Logs for ${selectedDayKey}`
                    : `${MONTH_NAMES[selectedMonth]} ${selectedYear} Goals`}
                </h3>
                <p className={`text-xs ${theme.textMuted}`}>
                  {selectedDayKey
                    ? `${dateSessionCounts[selectedDayKey] || 0} write-ins recorded on this day`
                    : `${monthGoals.length} total objectives in this month`}
                </p>
              </div>

              {selectedDayKey && (
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className={`text-xs ${theme.accent} hover:underline`}
                >
                  View All Month
                </button>
              )}
            </div>

            {/* Goals List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {monthGoals.length === 0 ? (
                <div className="py-8 text-center">
                  <p className={`text-xs ${theme.textMuted}`}>No goals logged for this month.</p>
                  <button
                    onClick={() => onCreateGoal(currentMonthString)}
                    className="mt-2 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create a goal for {MONTH_NAMES[selectedMonth]}</span>
                  </button>
                </div>
              ) : (
                monthGoals.map((g) => {
                  return (
                    <div
                      key={g.id}
                      onClick={() => onSelectGoal(g.id)}
                      className={`p-3 rounded-lg border border-neutral-500/20 ${theme.bgSurface} hover:border-neutral-500/40 cursor-pointer transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className={`text-xs font-semibold line-clamp-1 ${theme.textPrimary}`}>
                          {g.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGoal(g.id);
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Progress tracking visual for each individual goal */}
                      <div className="space-y-1 my-2">
                        <div className="flex justify-between text-[11px]">
                          <span className={theme.textMuted}>Progress</span>
                          <span className={`font-bold tabular-nums ${g.progress === 100 ? 'text-emerald-400' : theme.accent}`}>
                            {g.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-500/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              g.progress === 100
                                ? 'bg-emerald-500'
                                : g.progress >= 60
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Sessions count & jump */}
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-500/10">
                        <span>{g.sessionsLog?.length || 0} write sessions</span>
                        <span className={`flex items-center gap-1 ${theme.accent}`}>
                          <span>Open in Notepad</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
