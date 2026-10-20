import React from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { GoalNote, UserSettings } from '../types';
import { ThemeStyles } from '../utils/theme';

interface TenXGoalsViewProps {
  goals: GoalNote[];
  settings: UserSettings;
  theme: ThemeStyles;
  viewMode: 'tabular' | 'list';
  onSelectGoal: (goalId: string) => void;
  onCreateTenXGoal: () => void;
  onSelectMainCanvas?: (goalId: string) => void;
}

export const TenXGoalsView: React.FC<TenXGoalsViewProps> = ({
  goals,
  theme,
  viewMode,
  onSelectGoal,
  onCreateTenXGoal,
  onSelectMainCanvas,
}) => {
  // Filter 10X goals (active, non-deleted, with type === 'tenx_goal' or isMoonshot)
  const tenXGoals = goals.filter(
    (g) => !g.deletedAt && (g.type === 'tenx_goal' || g.isMoonshot)
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 h-full">
      {tenXGoals.length === 0 ? (
        /* Empty State: Zero Clutter, Just 10X Logo and Plus Button */
        <div className="max-w-xs mx-auto text-center py-24 px-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-black border border-emerald-500/40 flex items-center justify-center mb-6 shadow-md">
            <span className="font-black text-lg">
              <span className="text-white">10</span>
              <span className="text-emerald-400">X</span>
            </span>
          </div>
          <button
            onClick={onCreateTenXGoal}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Create 10X Goal"
            aria-label="Create 10X Goal"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ) : viewMode === 'tabular' ? (
        /* TABULAR VIEW */
        <div className={`border ${theme.border} rounded-xl overflow-hidden shadow-xs ${theme.bgSubtle}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${theme.border} ${theme.bgSurface} text-neutral-400 uppercase tracking-wider font-semibold text-[11px]`}>
                  <th className="py-3 px-4">Goal</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {tenXGoals.map((goal) => (
                  <tr
                    key={goal.id}
                    onClick={() => onSelectGoal(goal.id)}
                    className={`cursor-pointer transition-colors ${theme.bgHover} group`}
                  >
                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-black border border-emerald-500/40 flex items-center justify-center shrink-0">
                          <span className="font-black text-[10px]">
                            <span className="text-white">10</span>
                            <span className="text-emerald-400">X</span>
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className={`font-semibold text-sm block truncate group-hover:text-emerald-400 transition-colors ${theme.textPrimary}`}>
                            {goal.title || 'Untitled'}
                          </span>
                          {goal.plainText && (
                            <span className={`text-[11px] ${theme.textMuted} truncate block max-w-xs sm:max-w-md`}>
                              {goal.plainText}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${goal.progress || 0}%`,
                              background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold text-xs tabular-nums text-emerald-400 shrink-0">
                          {goal.progress || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                      {new Date(goal.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectGoal(goal.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                        {onSelectMainCanvas && (
                          <button
                            onClick={() => onSelectMainCanvas(goal.id)}
                            className={`p-1 rounded ${theme.bgHover} ${theme.textSecondary} hover:${theme.textPrimary} cursor-pointer`}
                            title="Open on main canvas"
                            aria-label="Open on main canvas"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenXGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => onSelectGoal(goal.id)}
              className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-black border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <span className="font-black text-[10px]">
                      <span className="text-white">10</span>
                      <span className="text-emerald-400">X</span>
                    </span>
                  </div>
                  <h4 className={`font-bold text-sm group-hover:text-emerald-400 transition-colors ${theme.textPrimary} line-clamp-1`}>
                    {goal.title || 'Untitled'}
                  </h4>
                </div>

                {goal.plainText && (
                  <p className={`text-xs ${theme.textMuted} line-clamp-2 mb-3 leading-relaxed`}>
                    {goal.plainText}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="pt-2 border-t border-neutral-500/15">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-400">Progress</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {goal.progress || 0}%
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700/50">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${goal.progress || 0}%`,
                      background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
