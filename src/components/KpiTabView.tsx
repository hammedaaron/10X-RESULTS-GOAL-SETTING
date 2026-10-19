import React, { useState } from 'react';
import {
  Flame,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Check,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { GoalNote, UserSettings, ConsistencyStats } from '../types';
import { ThemeStyles } from '../utils/theme';
import { formatDateKey } from '../utils/consistency';

interface KpiTabViewProps {
  goals: GoalNote[];
  settings: UserSettings;
  theme: ThemeStyles;
  consistencyStats: ConsistencyStats;
  onOpenSettings: () => void;
  onSelectGoal?: (goalId: string) => void;
}

export const KpiTabView: React.FC<KpiTabViewProps> = ({
  goals,
  settings,
  theme,
  consistencyStats,
  onOpenSettings,
  onSelectGoal,
}) => {
  const activeGoals = goals.filter((g) => !g.deletedAt);
  const battlePlans = activeGoals.filter((g) => g.type === 'battle_plan' || (g.battlePlanItems && g.battlePlanItems.length > 0));

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    battlePlans[0]?.id || ''
  );

  const activePlan = battlePlans.find((p) => p.id === selectedPlanId) || battlePlans[0];

  // Aggregate daily counts across all active goals for statistics
  const dateCounts: Record<string, number> = {};

  activeGoals.forEach((goal) => {
    (goal.sessionsLog || []).forEach((session) => {
      try {
        const d = new Date(session.timestamp);
        if (!isNaN(d.getTime())) {
          const key = formatDateKey(d);
          dateCounts[key] = (dateCounts[key] || 0) + 1;
        }
      } catch {
        // ignore
      }
    });
  });

  // Calculate day categories for past 30 days
  let greenDays = 0; // 2+ writes
  let orangeDays = 0; // 1 write
  let redDays = 0; // 0 writes

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const count = dateCounts[key] || 0;
    if (count >= settings.consistencyDailyTarget) {
      greenDays++;
    } else if (count === 1) {
      orangeDays++;
    } else {
      redDays++;
    }
  }

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto ${theme.bgSurface}`}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-500/15 mb-6">
        <div>
          <h2 className={`text-xl font-bold ${theme.textPrimary}`}>
            Key Performance Indicator (KPI)
          </h2>
          <p className={`text-xs ${theme.textMuted} mt-0.5`}>
            Goal consistency analytics based on writing down objectives at least {settings.consistencyDailyTarget}x per day.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className={`text-xs px-3 py-1.5 rounded border ${theme.border} ${theme.bgSubtle} ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}
        >
          Change Daily Target in Settings
        </button>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Overall Consistency Rate */}
        <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle} flex flex-col items-center text-center`}>
          <div className="relative w-24 h-24 mb-3">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-neutral-500/20"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className={
                  consistencyStats.consistencyRate >= 80
                    ? 'text-emerald-500'
                    : consistencyStats.consistencyRate >= 50
                    ? 'text-blue-500'
                    : 'text-amber-500'
                }
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * consistencyStats.consistencyRate) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold tabular-nums ${theme.textPrimary}`}>
                {consistencyStats.consistencyRate}%
              </span>
            </div>
          </div>

          <h3 className={`font-semibold text-sm ${theme.textPrimary}`}>Overall Consistency Rate</h3>
          <p className={`text-xs ${theme.textMuted} mt-1`}>
            Target evaluated over the last 14 active days
          </p>
        </div>

        {/* Current Streak */}
        <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle} flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Consecutive Streak</span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>

          <div className="my-3">
            <div className={`text-4xl font-mono font-bold tabular-nums ${theme.textPrimary}`}>
              {consistencyStats.currentStreak}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>
              {consistencyStats.currentStreak === 1 ? 'Day' : 'Days'} reaching {settings.consistencyDailyTarget}x target
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Habit momentum active</span>
          </div>
        </div>

        {/* Today's Goal Sessions */}
        <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle} flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Today's Progress</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>

          <div className="my-3">
            <div
              className={`text-4xl font-mono font-bold tabular-nums ${
                consistencyStats.isTargetMetToday ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {consistencyStats.todaySessionsCount} / {settings.consistencyDailyTarget}
            </div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>
              Goal write-ins recorded today
            </div>
          </div>

          <div className="text-[11px] font-medium">
            {consistencyStats.isTargetMetToday ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Target met for today!
              </span>
            ) : (
              <span className="text-amber-400">
                {settings.consistencyDailyTarget - consistencyStats.todaySessionsCount} write-in remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BATTLE PLAN DAILY REPORT TABLE (Requested by user) */}
      <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle} mb-8 shadow-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-neutral-500/15">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <h3 className={`font-semibold text-sm ${theme.textPrimary}`}>
              Battle Plan Daily Reports (Tabular)
            </h3>
          </div>

          {battlePlans.length > 1 && (
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${theme.border} ${theme.bgSurface} ${theme.textPrimary} outline-none cursor-pointer`}
            >
              {battlePlans.map((bp) => (
                <option key={bp.id} value={bp.id}>
                  {bp.title} ({bp.progress}%)
                </option>
              ))}
            </select>
          )}
        </div>

        {activePlan && activePlan.battlePlanItems && activePlan.battlePlanItems.length > 0 ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className={`font-medium ${theme.textPrimary}`}>
                {activePlan.title}
              </span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                {activePlan.battlePlanItems.filter((i) => i.completed).length} of{' '}
                {activePlan.battlePlanItems.length} Tasks Completed ({activePlan.progress}%)
              </span>
            </div>

            {/* Tabular Form Report */}
            <div className="overflow-x-auto rounded-lg border border-neutral-500/15">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${theme.border} text-neutral-400 ${theme.bgSurface}`}>
                    <th className="py-2.5 px-3 font-semibold w-36">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Checklist Task</th>
                    <th className="py-2.5 px-3 font-semibold w-32 text-right">Completion Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-500/10">
                  {activePlan.battlePlanItems.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-500/5 transition-colors">
                      {/* Left: Completed vs Incomplete */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.completed ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-neutral-400">
                            <span className="w-2 h-2 rounded-full bg-neutral-500/40" />
                            Incomplete
                          </span>
                        )}
                      </td>

                      {/* Right: Checklist Task Title (natural wrap) */}
                      <td className={`py-2.5 px-3 break-words ${item.completed ? 'line-through opacity-70' : theme.textPrimary}`}>
                        {item.text || 'Untitled task'}
                      </td>

                      {/* Completion Time */}
                      <td className="py-2.5 px-3 text-right text-[11px] tabular-nums text-neutral-400 whitespace-nowrap">
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-neutral-400">
            No battle plans created yet. Click the + button in the header and choose "Battle Plan" to begin tracking.
          </div>
        )}
      </div>

      {/* 30-Day Day Distribution (Green, Orange, Red) */}
      <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle} mb-6`}>
        <h4 className={`text-sm font-semibold mb-1 ${theme.textPrimary}`}>
          30-Day Performance Breakdown
        </h4>
        <p className={`text-xs ${theme.textMuted} mb-4`}>
          Distribution of days according to your goal write-in frequency.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Green Days */}
          <div className={`p-3 rounded-lg border border-emerald-500/20 ${theme.bgSurface} flex items-center gap-3`}>
            <span className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <div className="text-base font-bold text-emerald-400 tabular-nums">
                {greenDays} Days
              </div>
              <div className="text-[11px] text-neutral-400">
                2+ writes / day (Target Met)
              </div>
            </div>
          </div>

          {/* Orange Days */}
          <div className={`p-3 rounded-lg border border-amber-500/20 ${theme.bgSurface} flex items-center gap-3`}>
            <span className="w-4 h-4 rounded-full bg-amber-500 shrink-0" />
            <div>
              <div className="text-base font-bold text-amber-400 tabular-nums">
                {orangeDays} Days
              </div>
              <div className="text-[11px] text-neutral-400">
                1 write / day (Partial)
              </div>
            </div>
          </div>

          {/* Red Days */}
          <div className={`p-3 rounded-lg border border-red-500/20 ${theme.bgSurface} flex items-center gap-3`}>
            <span className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
            <div>
              <div className="text-base font-bold text-red-400 tabular-nums">
                {redDays} Days
              </div>
              <div className="text-[11px] text-neutral-400">
                0 writes (Absent)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Consistency Visualization */}
      <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle}`}>
        <h4 className={`text-sm font-semibold mb-3 ${theme.textPrimary}`}>
          Last 7 Days Activity
        </h4>

        <div className="grid grid-cols-7 gap-2 text-center">
          {consistencyStats.last7Days.map((d, i) => (
            <div key={i} className={`p-3 rounded-lg border border-neutral-500/10 ${theme.bgSurface}`}>
              <div className={`text-xs font-semibold mb-1 ${theme.textPrimary}`}>{d.dayName}</div>
              <div className="my-1 flex justify-center">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    d.count >= settings.consistencyDailyTarget
                      ? 'bg-emerald-500'
                      : d.count === 1
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
              <div className="text-[10px] tabular-nums text-neutral-400">
                {d.count}x
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
