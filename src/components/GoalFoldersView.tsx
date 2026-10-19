import React, { useState } from 'react';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Table as TableIcon,
  LayoutList,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  Tag,
  PenTool,
} from 'lucide-react';
import { GoalNote, FolderViewMode, GoalStatus, UserSettings } from '../types';
import { ThemeStyles } from '../utils/theme';
import { getTodayKey } from '../utils/consistency';

interface GoalFoldersViewProps {
  goals: GoalNote[];
  activeGoalId: string | null;
  settings: UserSettings;
  theme: ThemeStyles;
  onSelectGoal: (goalId: string) => void;
  onCreateGoal: (month?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoalProgress: (goalId: string, newProgress: number) => void;
}

export const GoalFoldersView: React.FC<GoalFoldersViewProps> = ({
  goals,
  activeGoalId,
  settings,
  theme,
  onSelectGoal,
  onCreateGoal,
  onDeleteGoal,
  onUpdateGoalProgress,
}) => {
  const [viewMode, setViewMode] = useState<FolderViewMode>('tabular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [newMonthInput, setNewMonthInput] = useState('');
  const [showAddMonth, setShowAddMonth] = useState(false);

  // Filter non-deleted goals
  const activeGoals = goals.filter((g) => !g.deletedAt);

  // Group goals by month
  const monthsMap = activeGoals.reduce((acc, goal) => {
    const m = goal.month || 'Unsorted';
    if (!acc[m]) acc[m] = [];
    acc[m].push(goal);
    return acc;
  }, {} as Record<string, GoalNote[]>);

  // Sort months chronologically if possible or preserve keys
  const sortedMonths = Object.keys(monthsMap).sort((a, b) => {
    const keyA = monthsMap[a][0]?.monthKey || a;
    const keyB = monthsMap[b][0]?.monthKey || b;
    return keyB.localeCompare(keyA); // latest month first
  });

  const toggleMonth = (month: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const handleAddNewMonth = () => {
    if (!newMonthInput.trim()) return;
    onCreateGoal(newMonthInput.trim());
    setNewMonthInput('');
    setShowAddMonth(false);
  };

  const todayKey = getTodayKey();

  const getSessionsTodayForGoal = (goal: GoalNote) => {
    return (goal.sessionsLog || []).filter((s) => {
      try {
        const d = new Date(s.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === todayKey;
      } catch {
        return false;
      }
    }).length;
  };

  // Helper status color
  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'achieved':
        return <span className="text-emerald-500 font-medium">Achieved</span>;
      case 'on_track':
        return <span className="text-blue-400 font-medium">On Track</span>;
      case 'needs_attention':
        return <span className="text-amber-400 font-medium">Needs Attention</span>;
      case 'in_progress':
      default:
        return <span className="text-neutral-400 font-medium">In Progress</span>;
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme.bgSurface}`}>
      {/* Header Bar within panel */}
      <div className={`p-4 border-b ${theme.border} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <Folder className={`w-5 h-5 ${theme.accent}`} />
          <h2 className={`font-semibold text-base ${theme.textPrimary}`}>Goal Folders by Month</h2>
          <span className={`text-xs ${theme.textMuted} tabular-nums`}>
            ({activeGoals.length} total)
          </span>
        </div>

        {/* Controls: Search, View Mode Toggle, New Goal */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={`relative flex items-center border ${theme.border} rounded px-2 py-1 ${theme.bgSubtle}`}>
            <Search className={`w-3.5 h-3.5 mr-1.5 ${theme.textMuted}`} />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent text-xs outline-none w-28 md:w-40 ${theme.textPrimary}`}
            />
          </div>

          {/* View Mode Toggle: Tabular vs List */}
          <div className={`flex items-center border ${theme.border} rounded p-0.5 ${theme.bgSubtle}`}>
            <button
              onClick={() => setViewMode('tabular')}
              title="Tabular View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'tabular' ? `${theme.bgSurface} ${theme.accent} shadow-xs` : theme.textMuted
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? `${theme.bgSurface} ${theme.accent} shadow-xs` : theme.textMuted
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Goal Button */}
          <button
            onClick={() => onCreateGoal()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white ${theme.accentBg} hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">New Goal</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className={`px-4 py-2 border-b ${theme.borderSubtle} flex items-center justify-between text-xs`}>
        <div className="flex items-center gap-2">
          <span className={theme.textMuted}>Status:</span>
          {(['all', 'in_progress', 'on_track', 'needs_attention', 'achieved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-2 py-0.5 rounded capitalize transition-colors ${
                selectedStatusFilter === st
                  ? `${theme.bgHover} font-semibold ${theme.textPrimary}`
                  : `${theme.textMuted} hover:${theme.textSecondary}`
              }`}
            >
              {st === 'all' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Add custom month folder */}
        <div>
          {showAddMonth ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="e.g. December 2026"
                value={newMonthInput}
                onChange={(e) => setNewMonthInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewMonth()}
                className={`border ${theme.border} rounded px-2 py-0.5 text-xs bg-transparent ${theme.textPrimary}`}
              />
              <button
                onClick={handleAddNewMonth}
                className={`px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-medium`}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddMonth(false)}
                className={`px-1.5 text-xs ${theme.textMuted}`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddMonth(true)}
              className={`text-xs ${theme.accent} hover:underline flex items-center gap-1`}
            >
              <Plus className="w-3 h-3" />
              New Month Folder
            </button>
          )}
        </div>
      </div>

      {/* Folders List and Goals */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-12">
            <Folder className={`w-12 h-12 mx-auto mb-3 opacity-30 ${theme.textMuted}`} />
            <p className={`text-sm ${theme.textMuted}`}>No active goals found.</p>
            <button
              onClick={() => onCreateGoal()}
              className={`mt-3 px-3 py-1.5 rounded text-xs text-white ${theme.accentBg}`}
            >
              Create your first goal
            </button>
          </div>
        ) : (
          sortedMonths.map((month) => {
            const rawMonthGoals = monthsMap[month] || [];
            const filteredGoals = rawMonthGoals.filter((g) => {
              const matchesSearch =
                !searchQuery ||
                g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.plainText && g.plainText.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase()));

              const matchesStatus =
                selectedStatusFilter === 'all' || g.status === selectedStatusFilter;

              return matchesSearch && matchesStatus;
            });

            if (filteredGoals.length === 0 && searchQuery) {
              return null; // hide month if no matches during search
            }

            const isCollapsed = collapsedMonths[month];
            const avgProgress = Math.round(
              rawMonthGoals.reduce((sum, g) => sum + g.progress, 0) / (rawMonthGoals.length || 1)
            );

            return (
              <div
                key={month}
                className={`border ${theme.border} rounded-lg overflow-hidden ${theme.bgSubtle}`}
              >
                {/* Month Folder Bar */}
                <div
                  onClick={() => toggleMonth(month)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer ${theme.bgSurface} ${theme.bgHover} border-b ${theme.borderSubtle} select-none transition-colors`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? (
                      <ChevronRight className={`w-4 h-4 ${theme.textMuted}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${theme.textMuted}`} />
                    )}
                    <Folder className={`w-4 h-4 ${theme.accent}`} />
                    <span className={`font-semibold text-sm ${theme.textPrimary}`}>{month}</span>
                    <span className={`text-xs ${theme.textMuted} tabular-nums`}>
                      ({rawMonthGoals.length} {rawMonthGoals.length === 1 ? 'goal' : 'goals'})
                    </span>
                  </div>

                  {/* Folder progress & quick add */}
                  <div className="flex items-center gap-4 text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className={theme.textMuted}>Folder Avg:</span>
                      <span className={`font-bold tabular-nums ${theme.textPrimary}`}>{avgProgress}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-neutral-500/20 overflow-hidden">
                        <div
                          className={`h-full ${avgProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onCreateGoal(month)}
                      title={`Add goal to ${month}`}
                      className={`p-1 rounded border ${theme.border} hover:bg-neutral-500/10 ${theme.textSecondary}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content: Tabular or List View */}
                {!isCollapsed && (
                  <div>
                    {filteredGoals.length === 0 ? (
                      <div className={`p-4 text-center text-xs ${theme.textMuted}`}>
                        No goals matching filters in this folder.
                      </div>
                    ) : viewMode === 'tabular' ? (
                      /* TABULAR VIEW */
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`border-b ${theme.borderSubtle} text-neutral-400 ${theme.bgSubtle}`}>
                              <th className="py-2.5 px-4 font-medium">Goal Objective</th>
                              <th className="py-2.5 px-3 font-medium">Category</th>
                              <th className="py-2.5 px-3 font-medium">Target Date</th>
                              <th className="py-2.5 px-3 font-medium">Today's Writes</th>
                              <th className="py-2.5 px-3 font-medium min-w-[150px]">Progress Visual</th>
                              <th className="py-2.5 px-3 font-medium">Status</th>
                              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-500/10">
                            {filteredGoals.map((g) => {
                              const writesToday = getSessionsTodayForGoal(g);
                              const isSelected = g.id === activeGoalId;

                              return (
                                <tr
                                  key={g.id}
                                  onClick={() => onSelectGoal(g.id)}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected
                                      ? `${theme.bgHover} font-medium`
                                      : `hover:bg-neutral-500/5`
                                  }`}
                                >
                                  {/* Title */}
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-2">
                                      {g.progress === 100 ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <div
                                          className={`w-2 h-2 rounded-full shrink-0 ${
                                            g.progress > 50 ? 'bg-blue-400' : 'bg-neutral-400'
                                          }`}
                                        />
                                      )}
                                      <span
                                        className={`font-medium truncate max-w-xs md:max-w-md ${theme.textPrimary}`}
                                      >
                                        {g.title}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Category */}
                                  <td className={`py-2.5 px-3 ${theme.textSecondary}`}>
                                    {g.category || 'General'}
                                  </td>

                                  {/* Target Date */}
                                  <td className={`py-2.5 px-3 tabular-nums ${theme.textMuted}`}>
                                    {g.targetDate ? g.targetDate : '—'}
                                  </td>

                                  {/* Today's writes */}
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`tabular-nums px-2 py-0.5 rounded text-[11px] font-semibold ${
                                        writesToday >= settings.consistencyDailyTarget
                                          ? 'bg-emerald-500/15 text-emerald-400'
                                          : 'bg-amber-500/15 text-amber-400'
                                      }`}
                                    >
                                      {writesToday}/{settings.consistencyDailyTarget}
                                    </span>
                                  </td>

                                  {/* Progress Tracking Visual */}
                                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 rounded-full bg-neutral-500/20 overflow-hidden">
                                        <div
                                          className={`h-full transition-all duration-200 rounded-full ${
                                            g.progress === 100
                                              ? 'bg-emerald-500'
                                              : g.progress >= 60
                                              ? 'bg-blue-500'
                                              : g.progress >= 30
                                              ? 'bg-amber-500'
                                              : 'bg-indigo-500'
                                          }`}
                                          style={{ width: `${g.progress}%` }}
                                        />
                                      </div>
                                      <span className={`w-8 text-right font-bold tabular-nums ${theme.textPrimary}`}>
                                        {g.progress}%
                                      </span>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {getStatusBadge(g.status)}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => onSelectGoal(g.id)}
                                        title="Open in Notepad editor"
                                        className={`p-1 rounded hover:bg-neutral-500/10 ${theme.textSecondary}`}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteGoal(g.id)}
                                        title="Move to Trash"
                                        className="p-1 rounded hover:bg-red-500/10 text-red-400"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* LIST VIEW */
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredGoals.map((g) => {
                          const writesToday = getSessionsTodayForGoal(g);
                          const isSelected = g.id === activeGoalId;

                          return (
                            <div
                              key={g.id}
                              onClick={() => onSelectGoal(g.id)}
                              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? `${theme.border} ${theme.bgHover} shadow-sm ring-1 ring-blue-500/30`
                                  : `border-neutral-500/15 ${theme.bgSurface} hover:border-neutral-500/30`
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className={`font-semibold text-sm leading-snug line-clamp-1 ${theme.textPrimary}`}>
                                  {g.title}
                                </h4>
                                <span className="text-xs shrink-0">{getStatusBadge(g.status)}</span>
                              </div>

                              <p className={`text-xs line-clamp-2 mb-3 ${theme.textMuted}`}>
                                {g.plainText || 'No notes added yet.'}
                              </p>

                              {/* Progress bar visual */}
                              <div className="space-y-1 mb-3">
                                <div className="flex justify-between text-[11px]">
                                  <span className={theme.textMuted}>Progress</span>
                                  <span className={`font-bold tabular-nums ${theme.textPrimary}`}>
                                    {g.progress}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-neutral-500/20 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      g.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${g.progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Bottom metadata */}
                              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-500/10">
                                <span className="flex items-center gap-1 text-neutral-400">
                                  <Calendar className="w-3 h-3" />
                                  {g.targetDate || 'No deadline'}
                                </span>

                                <span
                                  className={`tabular-nums px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    writesToday >= settings.consistencyDailyTarget
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-400'
                                  }`}
                                >
                                  {writesToday}/{settings.consistencyDailyTarget} writes today
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
