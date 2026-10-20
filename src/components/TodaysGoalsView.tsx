import React from 'react';
import { Target, Plus } from 'lucide-react';
import { GoalNote } from '../types';
import { ThemeStyles } from '../utils/theme';

interface TodaysGoalsViewProps {
  goals: GoalNote[];
  theme: ThemeStyles;
  viewMode: 'tabular' | 'list';
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: () => void;
}

export const TodaysGoalsView: React.FC<TodaysGoalsViewProps> = ({
  goals,
  theme,
  viewMode,
  onSelectGoal,
  onCreateGoal,
}) => {
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const today = new Date();

  // Filter ONLY today's regular goals (exclude 10X Moonshot goals and exclude other dates)
  const todaysGoals = goals.filter((g) => {
    if (g.deletedAt) return false;
    if (g.type === 'tenx_goal' || g.isMoonshot) return false;
    const created = new Date(g.createdAt);
    return isSameDay(created, today);
  });

  if (todaysGoals.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center h-full">
        <div className="max-w-xs mx-auto text-center py-24 px-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 text-blue-400 shadow-md">
            <Target className="w-6 h-6" />
          </div>
          <button
            onClick={onCreateGoal}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Write Today's Goal"
            aria-label="Write Today's Goal"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'tabular') {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 h-full">
        <div className={`border ${theme.border} rounded-xl overflow-hidden shadow-xs ${theme.bgSubtle}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${theme.border} ${theme.bgSurface} text-neutral-400 uppercase tracking-wider font-semibold text-[11px]`}>
                  <th className="py-3 px-4">Today's Goal</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {todaysGoals.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => onSelectGoal(g.id)}
                    className={`cursor-pointer transition-colors ${theme.bgHover} group`}
                  >
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold text-sm block truncate group-hover:text-blue-400 transition-colors ${theme.textPrimary}`}>
                        {g.title || 'Untitled Goal'}
                      </span>
                      {g.plainText && (
                        <span className={`text-[11px] ${theme.textMuted} truncate block max-w-xs sm:max-w-md`}>
                          {g.plainText}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-blue-500"
                            style={{ width: `${g.progress || 0}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs tabular-nums text-blue-400 shrink-0">
                          {g.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectGoal(g.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {todaysGoals.map((g) => (
          <div
            key={g.id}
            onClick={() => onSelectGoal(g.id)}
            className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between`}
          >
            <div>
              <h4 className={`font-bold text-sm group-hover:text-blue-400 transition-colors ${theme.textPrimary} line-clamp-1 mb-1.5`}>
                {g.title || 'Untitled Goal'}
              </h4>
              {g.plainText && (
                <p className={`text-xs ${theme.textMuted} line-clamp-2 mb-3 leading-relaxed`}>
                  {g.plainText}
                </p>
              )}
            </div>
            <div className="pt-2 border-t border-neutral-500/15">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-400">Progress</span>
                <span className="font-mono font-bold text-blue-400">
                  {g.progress || 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-blue-500"
                  style={{ width: `${g.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
