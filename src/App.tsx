import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Plus, Check, Target, Swords, Edit3, X } from 'lucide-react';
import { GoalNote, UserSettings, GoalSessionLog, BattlePlanItem, GoalStatus } from './types';
import {
  loadStoredGoals,
  saveStoredGoals,
  loadStoredSettings,
  saveStoredSettings,
} from './utils/storage';
import { calculateConsistencyStats } from './utils/consistency';
import { THEME_CONFIGS } from './utils/theme';
import { NoteEditor } from './components/NoteEditor';
import { BattlePlanEditor } from './components/BattlePlanEditor';
import { HamburgerMenu, ActiveDrawerTab } from './components/HamburgerMenu';
import { MainOverlayView } from './components/MainOverlayView';
import { BrandLogo } from './components/BrandLogo';

export default function App() {
  const [goals, setGoals] = useState<GoalNote[]>(() => loadStoredGoals());
  const [settings, setSettings] = useState<UserSettings>(() => loadStoredSettings());
  const [activeGoalId, setActiveGoalId] = useState<string | null>(() => {
    const loaded = loadStoredGoals();
    const firstActive = loaded.find((g) => !g.deletedAt);
    return firstActive ? firstActive.id : null;
  });

  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [activeOverlayTab, setActiveOverlayTab] = useState<ActiveDrawerTab>(null);
  const [lastSavedNotice, setLastSavedNotice] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState('');

  // Permanent Storage Persistence: sync synchronously on every change
  useEffect(() => {
    saveStoredGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Flush state immediately on window unload or pagehide so no data can ever be lost
  useEffect(() => {
    const flushData = () => {
      saveStoredGoals(goals);
      saveStoredSettings(settings);
    };
    window.addEventListener('beforeunload', flushData);
    window.addEventListener('pagehide', flushData);
    return () => {
      window.removeEventListener('beforeunload', flushData);
      window.removeEventListener('pagehide', flushData);
    };
  }, [goals, settings]);

  // Current theme styles
  const currentTheme = THEME_CONFIGS[settings.theme] || THEME_CONFIGS.dark_charcoal;

  // Consistency stats calculation
  const consistencyStats = useMemo(() => {
    return calculateConsistencyStats(goals, settings.consistencyDailyTarget, 14);
  }, [goals, settings.consistencyDailyTarget]);

  // Active goal object
  const activeGoal = useMemo(() => {
    return goals.find((g) => g.id === activeGoalId && !g.deletedAt) || null;
  }, [goals, activeGoalId]);

  // Fallback if active goal was deleted or missing
  useEffect(() => {
    if (!activeGoal) {
      const firstActive = goals.find((g) => !g.deletedAt);
      if (firstActive) {
        setActiveGoalId(firstActive.id);
      } else {
        setActiveGoalId(null);
      }
    }
  }, [goals, activeGoal]);

  // Sync header title draft
  useEffect(() => {
    if (activeGoal) {
      setHeaderTitleDraft(activeGoal.title);
    }
  }, [activeGoal?.id, activeGoal?.title]);

  // Handlers
  const handleUpdateGoal = useCallback((updatedGoal: GoalNote) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
      saveStoredGoals(next);
      return next;
    });
    setLastSavedNotice(true);
    setTimeout(() => setLastSavedNotice(false), 2000);
  }, []);

  // Clean goal creation: clean empty sheet, ready for user writing
  const handleCreateGoal = useCallback((monthStr?: string, targetDateStr?: string) => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const targetMonth = monthStr || defaultMonth;
    const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newGoalId = `goal-${Date.now()}`;
    const newGoal: GoalNote = {
      id: newGoalId,
      type: 'goal',
      title: 'Untitled Goal',
      month: targetMonth,
      monthKey: yearMonthKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      targetDate: targetDateStr,
      progress: 0,
      status: 'in_progress',
      category: 'General',
      sessionsLog: [],
      contentHtml: '',
      plainText: '',
      deletedAt: null,
    };

    setGoals((prev) => {
      const next = [newGoal, ...prev];
      saveStoredGoals(next);
      return next;
    });
    setActiveGoalId(newGoalId);
    setActiveOverlayTab(null);
    setIsHamburgerOpen(false);
    setShowNewMenu(false);
  }, []);

  // Clean battle plan creation: clean empty checklist sheet, ready for user tasks
  const handleCreateBattlePlan = useCallback((monthStr?: string, targetDateStr?: string) => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const targetMonth = monthStr || defaultMonth;
    const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newPlanId = `bp-${Date.now()}`;
    const initialChecklistHtml = `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;"><br></span></p>`;

    const newPlan: GoalNote = {
      id: newPlanId,
      type: 'battle_plan',
      title: "Today's Battle Plan",
      month: targetMonth,
      monthKey: yearMonthKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      targetDate: targetDateStr || new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'in_progress',
      category: 'Battle Plan',
      sessionsLog: [],
      contentHtml: initialChecklistHtml,
      plainText: '',
      deletedAt: null,
    };

    setGoals((prev) => {
      const next = [newPlan, ...prev];
      saveStoredGoals(next);
      return next;
    });
    setActiveGoalId(newPlanId);
    setActiveOverlayTab(null);
    setIsHamburgerOpen(false);
    setShowNewMenu(false);
  }, []);

  // Apply template from documentation in settings
  const handleApplyTemplate = useCallback(
    (title: string, contentHtml: string, type: 'goal' | 'battle_plan') => {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const newId = `${type === 'battle_plan' ? 'bp' : 'goal'}-${Date.now()}`;
      const newDoc: GoalNote = {
        id: newId,
        type,
        title,
        month: defaultMonth,
        monthKey: yearMonthKey,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        progress: 0,
        status: 'in_progress',
        category: type === 'battle_plan' ? 'Battle Plan' : 'General',
        sessionsLog: [],
        contentHtml,
        plainText: '',
        deletedAt: null,
      };

      setGoals((prev) => {
        const next = [newDoc, ...prev];
        saveStoredGoals(next);
        return next;
      });
      setActiveGoalId(newId);
      setActiveOverlayTab(null);
    },
    []
  );

  const handleImportBackup = useCallback((importedGoals: GoalNote[]) => {
    if (Array.isArray(importedGoals)) {
      setGoals(importedGoals);
      saveStoredGoals(importedGoals);
      const first = importedGoals.find((g) => !g.deletedAt);
      if (first) setActiveGoalId(first.id);
    }
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId ? { ...g, deletedAt: new Date().toISOString() } : g
      );
      saveStoredGoals(next);
      return next;
    });
  }, []);

  const handleRestoreGoal = useCallback((goalId: string) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === goalId ? { ...g, deletedAt: null } : g));
      saveStoredGoals(next);
      return next;
    });
  }, []);

  const handlePermanentlyDeleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== goalId);
      saveStoredGoals(next);
      return next;
    });
  }, []);

  const handleEmptyTrash = useCallback(() => {
    setGoals((prev) => {
      const next = prev.filter((g) => !g.deletedAt);
      saveStoredGoals(next);
      return next;
    });
  }, []);

  const handleUpdateGoalProgress = useCallback((goalId: string, newProgress: number) => {
    setGoals((prev) => {
      const next: GoalNote[] = prev.map((g) => {
        if (g.id === goalId) {
          const clamped = Math.max(0, Math.min(100, newProgress));
          const status: GoalStatus =
            clamped === 100 ? 'achieved' : clamped > 0 ? 'in_progress' : 'needs_attention';
          return {
            ...g,
            progress: clamped,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      });
      saveStoredGoals(next);
      return next;
    });
  }, []);

  const handleRecordSession = useCallback(
    (goalId: string, sessionType: 'morning' | 'evening') => {
      const now = new Date();
      const newSession: GoalSessionLog = {
        timestamp: now.toISOString(),
        sessionType,
        note: `Session recorded on ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };

      setGoals((prev) => {
        const next = prev.map((g) => {
          if (g.id === goalId) {
            return {
              ...g,
              sessionsLog: [newSession, ...(g.sessionsLog || [])],
              updatedAt: now.toISOString(),
            };
          }
          return g;
        });
        saveStoredGoals(next);
        return next;
      });
    },
    []
  );

  const handleSaveHeaderTitle = () => {
    if (activeGoal && headerTitleDraft.trim()) {
      handleUpdateGoal({
        ...activeGoal,
        title: headerTitleDraft.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingHeaderTitle(false);
  };

  // Esc key closes hamburger, overlay, or popover
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewMenu) {
          setShowNewMenu(false);
        } else if (isEditingHeaderTitle) {
          setIsEditingHeaderTitle(false);
        } else if (activeOverlayTab) {
          setActiveOverlayTab(null);
        } else if (isHamburgerOpen) {
          setIsHamburgerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showNewMenu, isEditingHeaderTitle, activeOverlayTab, isHamburgerOpen]);

  const isOverlayOpen = activeOverlayTab !== null || isHamburgerOpen;

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden select-none ${currentTheme.bgApp} ${currentTheme.textPrimary} transition-colors duration-150 relative`}
    >
      {/* Minimalist Top Strip: Just Hamburger Menu Button, Editable Title, & Plus Menu */}
      <header
        className={`h-10 px-4 flex items-center justify-between border-b ${currentTheme.border} ${currentTheme.bgSurface} shrink-0 select-none z-20`}
      >
        {/* Left: The Hamburger Menu Button + 10X Brand Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsHamburgerOpen(true)}
            className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors flex items-center gap-2`}
            title="Open Menu: Today's Goal, Calendar, KPI Tab, Settings"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Menu</span>
          </button>

          <button
            onClick={() => setIsHamburgerOpen(true)}
            className="hover:opacity-85 transition-opacity"
            title="10X RESULTS"
          >
            <BrandLogo size="sm" showText={false} />
          </button>

          {/* Editable Title in Header */}
          <div className="flex items-center gap-2">
            {isEditingHeaderTitle && activeGoal ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={headerTitleDraft}
                  onChange={(e) => setHeaderTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveHeaderTitle();
                    if (e.key === 'Escape') setIsEditingHeaderTitle(false);
                  }}
                  autoFocus
                  className={`text-xs px-2 py-0.5 rounded border border-blue-500 bg-transparent outline-none ${currentTheme.textPrimary}`}
                />
                <button
                  onClick={handleSaveHeaderTitle}
                  className="p-1 text-emerald-400 hover:bg-neutral-500/10 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsEditingHeaderTitle(false)}
                  className="p-1 text-neutral-400 hover:bg-neutral-500/10 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingHeaderTitle(true)}
                className={`text-xs ${currentTheme.textMuted} hover:${currentTheme.textPrimary} truncate max-w-[180px] sm:max-w-md flex items-center gap-1.5 group text-left transition-colors`}
                title="Click to edit title"
              >
                <span className="truncate">
                  {activeGoal ? activeGoal.title : '10X RESULTS'}
                </span>
                {activeGoal && (
                  <span
                    className={`text-[10px] px-1 rounded uppercase font-semibold ${
                      activeGoal.type === 'battle_plan'
                        ? 'text-amber-400 bg-amber-500/15'
                        : 'text-blue-400 bg-blue-500/15'
                    }`}
                  >
                    {activeGoal.type === 'battle_plan' ? 'Battle Plan' : 'Goal'}
                  </span>
                )}
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick subtle indicators + Plus Button with Popover */}
        <div className="flex items-center gap-3 text-xs relative">
          {lastSavedNotice && (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}

          {/* Plus Button with 2 Options: New Goal or Battle Plan */}
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className={`p-1.5 rounded flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-colors`}
              title="Create New Goal or Battle Plan"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">New</span>
            </button>

            {/* The 2-Option Popover Menu */}
            {showNewMenu && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl border shadow-2xl p-1.5 z-50 ${currentTheme.bgSurface} ${currentTheme.border} animate-fadeIn`}
              >
                <button
                  onClick={() => handleCreateGoal()}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg ${currentTheme.bgHover} ${currentTheme.textPrimary} text-left transition-colors`}
                >
                  <Target className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold">New Goal</div>
                    <div className="text-[10px] text-neutral-400">Clean text document</div>
                  </div>
                </button>

                <button
                  onClick={() => handleCreateBattlePlan()}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg ${currentTheme.bgHover} ${currentTheme.textPrimary} text-left transition-colors`}
                >
                  <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Battle Plan</div>
                    <div className="text-[10px] text-neutral-400">Interactive checklist objectives</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Interface: Pure Text Panel Alone (Goal Document) OR Battle Plan Interface */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {activeGoal?.type === 'battle_plan' ? (
          <BattlePlanEditor
            plan={activeGoal}
            settings={settings}
            theme={currentTheme}
            onUpdatePlan={handleUpdateGoal}
            onOpenMenu={() => setIsHamburgerOpen(true)}
            isOverlayOpen={isOverlayOpen}
          />
        ) : (
          <NoteEditor
            goal={activeGoal}
            settings={settings}
            theme={currentTheme}
            onUpdateGoal={handleUpdateGoal}
            onOpenMenu={() => setIsHamburgerOpen(true)}
            isOverlayOpen={isOverlayOpen}
          />
        )}
      </main>

      {/* Hamburger Menu Drawer: Strictly the 4 requested items */}
      <HamburgerMenu
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        activeTab={activeOverlayTab}
        onSelectTab={(tab) => {
          setActiveOverlayTab(tab);
          setIsHamburgerOpen(false);
        }}
        goals={goals}
        settings={settings}
        theme={currentTheme}
        consistencyStats={consistencyStats}
      />

      {/* Overlay Modal for the 4 Sections: Today's Goal, Calendar, KPI Tab, Settings */}
      <MainOverlayView
        activeTab={activeOverlayTab}
        onClose={() => setActiveOverlayTab(null)}
        goals={goals}
        activeGoal={activeGoal}
        settings={settings}
        theme={currentTheme}
        consistencyStats={consistencyStats}
        onSelectGoal={(id) => {
          setActiveGoalId(id);
          setActiveOverlayTab(null);
        }}
        onCreateGoal={handleCreateGoal}
        onDeleteGoal={handleDeleteGoal}
        onUpdateGoalProgress={handleUpdateGoalProgress}
        onUpdateSettings={setSettings}
        onRestoreGoal={handleRestoreGoal}
        onPermanentlyDeleteGoal={handlePermanentlyDeleteGoal}
        onEmptyTrash={handleEmptyTrash}
        onRecordSession={handleRecordSession}
        onSelectTab={setActiveOverlayTab}
        onApplyTemplate={handleApplyTemplate}
        onImportBackup={handleImportBackup}
      />
    </div>
  );
}
