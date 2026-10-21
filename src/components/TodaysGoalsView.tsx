import React, { useState } from 'react';
import { Target, Plus, Search, Edit2, Check, X } from 'lucide-react';
import { GoalNote } from '../types';
import { ThemeStyles } from '../utils/theme';

interface TodaysGoalsViewProps {
  goals: GoalNote[];
  theme: ThemeStyles;
  viewMode: 'tabular' | 'list';
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: () => void;
  onUpdateGoal?: (updatedGoal: GoalNote) => void;
}

export const TodaysGoalsView: React.FC<TodaysGoalsViewProps> = ({
  goals,
  theme,
  viewMode,
  onSelectGoal,
  onCreateGoal,
  onUpdateGoal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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

  // Filter by search query across title and notes
  const filteredGoals = todaysGoals.filter((g) => {
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
    const updatedTitle = editingTitle.trim() || 'Untitled Goal';
    if (onUpdateGoal) {
      onUpdateGoal({
        ...goal,
        title: updatedTitle,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingGoalId(null);
  };

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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 h-full flex flex-col">
      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`relative flex items-center border ${theme.border} rounded-lg px-3 py-1.5 ${theme.bgSubtle} w-full sm:w-72 max-w-md`}>
          <Search className={`w-4 h-4 mr-2 ${theme.textMuted} shrink-0`} />
          <input
            type="text"
            placeholder="Search today's goals..."
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
            No today's goals match "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-blue-400 hover:underline cursor-pointer"
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
                  <th className="py-3 px-4">Today's Goal</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {filteredGoals.map((g) => {
                  const isEditing = editingGoalId === g.id;

                  return (
                    <tr
                      key={g.id}
                      onClick={() => !isEditing && onSelectGoal(g.id)}
                      className={`cursor-pointer transition-colors ${theme.bgHover} group`}
                    >
                      <td className="py-3.5 px-4">
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
                                if (e.key === 'Enter') saveEditing(g, e);
                                if (e.key === 'Escape') cancelEditing(e);
                              }}
                              autoFocus
                              placeholder="Goal title..."
                              className={`flex-1 px-2.5 py-1 text-sm font-semibold rounded border border-blue-500 bg-black/40 outline-none ${theme.textPrimary}`}
                            />
                            <button
                              onClick={(e) => saveEditing(g, e)}
                              className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                              title="Save Title (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className={`p-1.5 rounded ${theme.bgSubtle} ${theme.textSecondary} hover:${theme.textPrimary} cursor-pointer`}
                              title="Cancel (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 max-w-md">
                            <span className={`font-semibold text-sm truncate group-hover:text-blue-400 transition-colors ${theme.textPrimary}`}>
                              {g.title || 'Untitled Goal'}
                            </span>
                            <button
                              onClick={(e) => startEditing(g, e)}
                              className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-500/20 ${theme.textSecondary} hover:text-blue-400 transition-all cursor-pointer shrink-0`}
                              title="Change Goal Title"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {!isEditing && g.plainText && (
                          <span className={`text-[11px] ${theme.textMuted} truncate block max-w-xs sm:max-w-md mt-0.5`}>
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
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => startEditing(g, e)}
                            className={`p-1.5 rounded ${theme.bgHover} ${theme.textSecondary} hover:text-blue-400 transition-colors cursor-pointer`}
                            title="Edit Title"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectGoal(g.id)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                          >
                            Open
                          </button>
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
        /* GRID / LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((g) => {
            const isEditing = editingGoalId === g.id;

            return (
              <div
                key={g.id}
                onClick={() => !isEditing && onSelectGoal(g.id)}
                className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(g, e);
                            if (e.key === 'Escape') cancelEditing(e);
                          }}
                          autoFocus
                          placeholder="Goal title..."
                          className={`flex-1 px-2 py-1 text-sm font-bold rounded border border-blue-500 bg-black/40 outline-none ${theme.textPrimary}`}
                        />
                        <button
                          onClick={(e) => saveEditing(g, e)}
                          className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shrink-0"
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
                      <>
                        <h4 className={`font-bold text-sm group-hover:text-blue-400 transition-colors ${theme.textPrimary} line-clamp-1`}>
                          {g.title || 'Untitled Goal'}
                        </h4>
                        <button
                          onClick={(e) => startEditing(g, e)}
                          className={`p-1 rounded hover:bg-neutral-500/20 ${theme.textSecondary} hover:text-blue-400 transition-colors cursor-pointer shrink-0`}
                          title="Change Goal Title"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                  {!isEditing && g.plainText && (
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
            );
          })}
        </div>
      )}
    </div>
  );
};
