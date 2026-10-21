import React, { useState } from 'react';
import { Plus, ExternalLink, Search, Edit2, Check, X } from 'lucide-react';
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
  onUpdateGoal?: (updatedGoal: GoalNote) => void;
}

export const TenXGoalsView: React.FC<TenXGoalsViewProps> = ({
  goals,
  theme,
  viewMode,
  onSelectGoal,
  onCreateTenXGoal,
  onSelectMainCanvas,
  onUpdateGoal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter 10X goals (active, non-deleted, with type === 'tenx_goal' or isMoonshot)
  const tenXGoals = goals.filter(
    (g) => !g.deletedAt && (g.type === 'tenx_goal' || g.isMoonshot)
  );

  // Search filtering
  const filteredGoals = tenXGoals.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (g.title || '').toLowerCase().includes(q);
    const textMatch = (g.plainText || '').toLowerCase().includes(q);
    return titleMatch || textMatch;
  });

  const startEditing = (goal: GoalNote, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setEditingGoalId(goal.id);
    setEditingTitle(goal.title || '');
  };

  const cancelEditing = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setEditingGoalId(null);
    setEditingTitle('');
  };

  const saveEditing = (goal: GoalNote, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const updatedTitle = editingTitle.trim() || 'Untitled 10X Goal';
    if (onUpdateGoal) {
      onUpdateGoal({
        ...goal,
        title: updatedTitle,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingGoalId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 h-full flex flex-col">
      {tenXGoals.length === 0 ? (
        /* Empty State: Zero Clutter, Just 10X Logo and Plus Button */
        <div className="max-w-xs mx-auto text-center py-24 px-4 flex flex-col items-center justify-center m-auto">
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
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className={`relative flex items-center border ${theme.border} rounded-lg px-3 py-1.5 ${theme.bgSubtle} w-full sm:w-72 max-w-md`}>
              <Search className={`w-4 h-4 mr-2 ${theme.textMuted} shrink-0`} />
              <input
                type="text"
                placeholder="Search 10X goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-xs outline-none w-full ${theme.textPrimary} placeholder:opacity-40`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`p-0.5 hover:text-white ${theme.textMuted}`}
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className={`text-xs ${theme.textMuted} tabular-nums hidden sm:inline`}>
              {filteredGoals.length} {filteredGoals.length === 1 ? 'goal' : 'goals'} found
            </span>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <p className={`text-xs ${theme.textMuted} mb-3`}>
                No 10X goals match "{searchQuery}".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Clear Search
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
                    {filteredGoals.map((goal) => {
                      const isEditing = editingGoalId === goal.id;

                      return (
                        <tr
                          key={goal.id}
                          onClick={() => !isEditing && onSelectGoal(goal.id)}
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
                              <div className="min-w-0 flex-1">
                                {isEditing ? (
                                  <div
                                    className="flex items-center gap-2 max-w-md"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditing(goal, e);
                                        if (e.key === 'Escape') cancelEditing(e);
                                      }}
                                      autoFocus
                                      placeholder="10X Goal title..."
                                      className={`flex-1 px-2.5 py-1 text-sm font-semibold rounded border border-emerald-500 bg-black/40 outline-none ${theme.textPrimary}`}
                                    />
                                    <button
                                      onClick={(e) => saveEditing(goal, e)}
                                      className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shrink-0"
                                      title="Save Title (Enter)"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className={`p-1.5 rounded ${theme.bgSubtle} ${theme.textSecondary} hover:${theme.textPrimary} cursor-pointer shrink-0`}
                                      title="Cancel (Esc)"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 max-w-md">
                                    <span className={`font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors ${theme.textPrimary}`}>
                                      {goal.title || 'Untitled 10X Goal'}
                                    </span>
                                    <button
                                      onClick={(e) => startEditing(goal, e)}
                                      className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-500/20 ${theme.textSecondary} hover:text-emerald-400 transition-all cursor-pointer shrink-0`}
                                      title="Change Goal Title"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                {!isEditing && goal.plainText && (
                                  <span className={`text-[11px] ${theme.textMuted} truncate block max-w-xs sm:max-w-md mt-0.5`}>
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
                                onClick={(e) => startEditing(goal, e)}
                                className={`p-1.5 rounded ${theme.bgHover} ${theme.textSecondary} hover:text-emerald-400 transition-colors cursor-pointer`}
                                title="Edit Title"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.map((goal) => {
                const isEditing = editingGoalId === goal.id;

                return (
                  <div
                    key={goal.id}
                    onClick={() => !isEditing && onSelectGoal(goal.id)}
                    className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded bg-black border border-emerald-500/40 flex items-center justify-center shrink-0">
                            <span className="font-black text-[10px]">
                              <span className="text-white">10</span>
                              <span className="text-emerald-400">X</span>
                            </span>
                          </div>
                          {isEditing ? (
                            <div
                              className="flex items-center gap-1.5 flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditing(goal, e);
                                  if (e.key === 'Escape') cancelEditing(e);
                                }}
                                autoFocus
                                placeholder="10X Goal title..."
                                className={`flex-1 px-2 py-1 text-sm font-bold rounded border border-emerald-500 bg-black/40 outline-none ${theme.textPrimary}`}
                              />
                              <button
                                onClick={(e) => saveEditing(goal, e)}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shrink-0"
                                title="Save Title"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className={`p-1 rounded ${theme.bgSubtle} ${theme.textSecondary} cursor-pointer shrink-0`}
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h4 className={`font-bold text-sm group-hover:text-emerald-400 transition-colors ${theme.textPrimary} line-clamp-1`}>
                              {goal.title || 'Untitled 10X Goal'}
                            </h4>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            onClick={(e) => startEditing(goal, e)}
                            className={`p-1 rounded hover:bg-neutral-500/20 ${theme.textSecondary} hover:text-emerald-400 transition-colors cursor-pointer shrink-0`}
                            title="Change Goal Title"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {!isEditing && goal.plainText && (
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
