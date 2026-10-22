import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, Plus, Check, Target, Swords, Edit3, X, ArrowLeft, Table as TableIcon, LayoutList } from 'lucide-react';
import { GoalNote, UserSettings, GoalSessionLog, BattlePlanItem, GoalStatus } from './types';
import {
  loadStoredGoals,
  saveStoredGoals,
  loadStoredSettings,
  saveStoredSettings,
  recoverDurableGoals,
} from './utils/storage';
import { calculateConsistencyStats } from './utils/consistency';
import { THEME_CONFIGS } from './utils/theme';
import { NoteEditor } from './components/NoteEditor';
import { BattlePlanEditor } from './components/BattlePlanEditor';
import { TenXGoalEditor } from './components/TenXGoalEditor';
import { TenXGoalsView } from './components/TenXGoalsView';
import { TodaysGoalsView } from './components/TodaysGoalsView';
import { HamburgerMenu, ActiveDrawerTab } from './components/HamburgerMenu';
import { MainOverlayView } from './components/MainOverlayView';
import { BrandLogo } from './components/BrandLogo';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { auth, onAuthStateChanged, User, testFirestoreConnection } from './utils/firebase';
import {
  saveGoalToCloud,
  deleteGoalFromCloud,
  syncLocalGoalsToCloud,
  subscribeToCloudGoals,
  CloudSyncStatus,
} from './utils/cloudSync';
import { CloudSyncStatusBadge } from './components/CloudSyncStatus';

export type AppMainView = 'todays_goals' | 'today_editor' | 'tenx_goals' | 'tenx_editor';

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
  const [currentMainView, setCurrentMainView] = useState<AppMainView>('todays_goals');
  const [homeViewMode, setHomeViewMode] = useState<'tabular' | 'list'>('tabular');
  const [tenXViewMode, setTenXViewMode] = useState<'tabular' | 'list'>('tabular');
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('unauthenticated');

  // Test Firestore connection on app mount
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
  }, []);

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setCloudSyncStatus('syncing');
      } else {
        setCloudSyncStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time cloud sync when authenticated
  useEffect(() => {
    if (!currentUser) return;

    let isInitial = true;
    const unsubscribe = subscribeToCloudGoals(
      currentUser,
      (cloudGoals) => {
        setCloudSyncStatus('synced');
        if (isInitial && cloudGoals.length === 0) {
          syncLocalGoalsToCloud(currentUser, goals).catch(() => {});
          isInitial = false;
          return;
        }

        isInitial = false;
        setGoals((localGoals) => {
          const cloudIds = new Set(cloudGoals.map((g) => g.id));
          const merged = [...cloudGoals];
          for (const local of localGoals) {
            if (!cloudIds.has(local.id)) {
              merged.push(local);
              saveGoalToCloud(currentUser, local).catch(() => {});
            }
          }
          saveStoredGoals(merged);
          return merged;
        });
      },
      () => {
        setCloudSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

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

  // Attempt durable recovery from IndexedDB on startup if localStorage was cleared
  useEffect(() => {
    recoverDurableGoals().then((recovered) => {
      if (recovered && recovered.length > 0) {
        setGoals((current) => {
          const isOnlyDefaultStarter =
            current.length === 1 &&
            (current[0].title === "Today's Goal Objective" || current[0].title === 'My First Goal Objective') &&
            !current[0].contentHtml;
          if (current.length === 0 || isOnlyDefaultStarter) {
            saveStoredGoals(recovered);
            const firstActive = recovered.find((g) => !g.deletedAt);
            if (firstActive) setActiveGoalId(firstActive.id);
            return recovered;
          }
          return current;
        });
      }
    });
  }, []);

  // Sync header title draft only when not actively editing in header
  useEffect(() => {
    if (activeGoal && !isEditingHeaderTitle) {
      setHeaderTitleDraft(activeGoal.title);
    }
  }, [activeGoal?.id, activeGoal?.title, isEditingHeaderTitle]);

  // Handlers
  const handleUpdateGoal = useCallback(
    (updatedGoal: GoalNote) => {
      setGoals((prev) => {
        const exists = prev.some((g) => g.id === updatedGoal.id);
        const next = exists
          ? prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
          : [updatedGoal, ...prev];
        saveStoredGoals(next);
        return next;
      });

      if (currentUser) {
        saveGoalToCloud(currentUser, updatedGoal).catch(() => {});
      }

      setLastSavedNotice(true);
      setTimeout(() => setLastSavedNotice(false), 2000);
    },
    [currentUser]
  );

  // Clean goal creation: clean empty sheet, ready for user writing
  const handleCreateGoal = useCallback(
    (monthStr?: unknown, targetDateStr?: unknown) => {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      const targetMonth =
        typeof monthStr === 'string' && monthStr.trim() ? monthStr.trim() : defaultMonth;
      const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const validTargetDate =
        typeof targetDateStr === 'string' && targetDateStr.trim() ? targetDateStr.trim() : undefined;

      const newGoalId = `goal-${Date.now()}`;
      const newGoal: GoalNote = {
        id: newGoalId,
        type: 'goal',
        title: "Today's Goal Objective",
        month: targetMonth,
        monthKey: yearMonthKey,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        targetDate: validTargetDate,
        progress: 0,
        status: 'in_progress',
        category: 'General',
        sessionsLog: [],
        contentHtml: '',
        plainText: '',
        deletedAt: null,
        isMoonshot: false,
      };

      setGoals((prev) => {
        const next = [newGoal, ...prev];
        saveStoredGoals(next);
        return next;
      });

      if (currentUser) {
        saveGoalToCloud(currentUser, newGoal).catch(() => {});
      }

      setActiveGoalId(newGoalId);
      setCurrentMainView('today_editor');
      setActiveOverlayTab(null);
      setIsHamburgerOpen(false);
    },
    [currentUser]
  );

  // Clean battle plan creation: clean empty checklist sheet, ready for user tasks
  const handleCreateBattlePlan = useCallback(
    (monthStr?: unknown, targetDateStr?: unknown) => {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      const targetMonth =
        typeof monthStr === 'string' && monthStr.trim() ? monthStr.trim() : defaultMonth;
      const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const validTargetDate =
        typeof targetDateStr === 'string' && targetDateStr.trim()
          ? targetDateStr.trim()
          : new Date().toISOString().split('T')[0];

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
        targetDate: validTargetDate,
        progress: 0,
        status: 'in_progress',
        category: 'Battle Plan',
        sessionsLog: [],
        contentHtml: initialChecklistHtml,
        plainText: '',
        deletedAt: null,
        isMoonshot: false,
      };

      setGoals((prev) => {
        const next = [newPlan, ...prev];
        saveStoredGoals(next);
        return next;
      });

      if (currentUser) {
        saveGoalToCloud(currentUser, newPlan).catch(() => {});
      }

      setActiveGoalId(newPlanId);
      setCurrentMainView('today_editor');
      setActiveOverlayTab(null);
      setIsHamburgerOpen(false);
    },
    [currentUser]
  );

  // Clean 10X Moonshot goal creation
  const handleCreateTenXGoal = useCallback(() => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const defaultMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newId = `tenx-${Date.now()}`;
    const newTenXGoal: GoalNote = {
      id: newId,
      type: 'tenx_goal',
      isMoonshot: true,
      title: '10X Moonshot Target',
      month: defaultMonth,
      monthKey: yearMonthKey,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      progress: 0,
      status: 'in_progress',
      category: '10X Moonshot',
      sessionsLog: [],
      contentHtml: '',
      plainText: '',
      battlePlanItems: [
        {
          id: 'bpi-0',
          text: 'Define 10X moonshot vision and non-negotiable standards',
          completed: false,
        },
        {
          id: 'bpi-1',
          text: 'Execute initial bold action towards objective',
          completed: false,
        },
      ],
      deletedAt: null,
    };

    setGoals((prev) => {
      const next = [newTenXGoal, ...prev];
      saveStoredGoals(next);
      return next;
    });

    if (currentUser) {
      saveGoalToCloud(currentUser, newTenXGoal).catch(() => {});
    }

    setActiveGoalId(newId);
    setCurrentMainView('tenx_editor');
    setActiveOverlayTab(null);
    setIsHamburgerOpen(false);
  }, [currentUser]);

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

      if (currentUser) {
        saveGoalToCloud(currentUser, newDoc).catch(() => {});
      }

      setActiveGoalId(newId);
      setCurrentMainView('today_editor');
      setActiveOverlayTab(null);
    },
    [currentUser]
  );

  const handleImportBackup = useCallback(
    (importedGoals: GoalNote[]) => {
      if (Array.isArray(importedGoals)) {
        setGoals(importedGoals);
        saveStoredGoals(importedGoals);
        if (currentUser) {
          syncLocalGoalsToCloud(currentUser, importedGoals).catch(() => {});
        }
        const first = importedGoals.find((g) => !g.deletedAt);
        if (first) setActiveGoalId(first.id);
      }
    },
    [currentUser]
  );

  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      setGoals((prev) => {
        const next = prev.map((g) => {
          if (g.id === goalId) {
            const updated = { ...g, deletedAt: new Date().toISOString() };
            if (currentUser) {
              saveGoalToCloud(currentUser, updated).catch(() => {});
            }
            return updated;
          }
          return g;
        });
        saveStoredGoals(next);
        return next;
      });
    },
    [currentUser]
  );

  const handleRestoreGoal = useCallback(
    (goalId: string) => {
      setGoals((prev) => {
        const next = prev.map((g) => {
          if (g.id === goalId) {
            const updated = { ...g, deletedAt: null };
            if (currentUser) {
              saveGoalToCloud(currentUser, updated).catch(() => {});
            }
            return updated;
          }
          return g;
        });
        saveStoredGoals(next);
        return next;
      });
    },
    [currentUser]
  );

  const handlePermanentlyDeleteGoal = useCallback(
    (goalId: string) => {
      setGoals((prev) => {
        const next = prev.filter((g) => g.id !== goalId);
        saveStoredGoals(next);
        return next;
      });
      if (currentUser) {
        deleteGoalFromCloud(currentUser, goalId).catch(() => {});
      }
    },
    [currentUser]
  );

  const handleEmptyTrash = useCallback(() => {
    setGoals((prev) => {
      const toDelete = prev.filter((g) => !!g.deletedAt);
      const next = prev.filter((g) => !g.deletedAt);
      saveStoredGoals(next);
      if (currentUser) {
        for (const item of toDelete) {
          deleteGoalFromCloud(currentUser, item.id).catch(() => {});
        }
      }
      return next;
    });
  }, [currentUser]);

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
      setLastSavedNotice(true);
      setTimeout(() => setLastSavedNotice(false), 2000);
    },
    []
  );

  const handleSaveHeaderTitle = () => {
    if (activeGoal) {
      const trimmed = headerTitleDraft.trim();
      const fallback =
        activeGoal.type === 'tenx_goal' || activeGoal.isMoonshot
          ? '10X Moonshot Target'
          : "Today's Goal Objective";
      const finalTitle = trimmed || fallback;
      handleUpdateGoal({
        ...activeGoal,
        title: finalTitle,
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingHeaderTitle(false);
  };

  // Esc key closes hamburger/overlay/editor rename; Ctrl+S triggers synchronous save
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveStoredGoals(goals);
        saveStoredSettings(settings);
        setLastSavedNotice(true);
        setTimeout(() => setLastSavedNotice(false), 2000);
        return;
      }
      if (e.key === 'Escape') {
        if (isEditingHeaderTitle) {
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
  }, [isEditingHeaderTitle, activeOverlayTab, isHamburgerOpen, goals, settings]);

  const isOverlayOpen = activeOverlayTab !== null || isHamburgerOpen;

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden select-none ${currentTheme.bgApp} ${currentTheme.textPrimary} transition-colors duration-150 relative`}
    >
      {/* Single Clean Top Navigation Bar */}
      <header
        className={`h-11 px-4 flex items-center justify-between border-b ${currentTheme.border} ${currentTheme.bgSurface} shrink-0 select-none z-20`}
      >
        {currentMainView === 'todays_goals' ? (
          <>
            {/* Left: Hamburger Menu Button + Brand Logo + Title */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsHamburgerOpen(true)}
                className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors flex items-center gap-2 cursor-pointer`}
                title="Menu"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <BrandLogo size="sm" showText={true} />

              <span className={`text-xs font-semibold ${currentTheme.textMuted} border-l ${currentTheme.border} pl-2.5 ml-1 hidden sm:inline`}>
                Today's Goals
              </span>
            </div>

            {/* Right: Cloud Sync Badge + PWA Install + View Mode Toggle (Grid/List) + Plus Button */}
            <div className="flex items-center gap-2">
              <CloudSyncStatusBadge
                user={currentUser}
                authLoading={authLoading}
                syncStatus={cloudSyncStatus}
                theme={currentTheme}
              />
              <PWAInstallButton variant="compact" />

              <div className={`flex items-center border ${currentTheme.border} rounded-lg p-0.5 ${currentTheme.bgSubtle}`}>
                <button
                  onClick={() => setHomeViewMode('tabular')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    homeViewMode === 'tabular'
                      ? 'bg-neutral-500/20 text-blue-400'
                      : `${currentTheme.textMuted} hover:${currentTheme.textPrimary}`
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHomeViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    homeViewMode === 'list'
                      ? 'bg-neutral-500/20 text-blue-400'
                      : `${currentTheme.textMuted} hover:${currentTheme.textPrimary}`
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleCreateGoal()}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Write Today's Goal"
                aria-label="Write Today's Goal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : currentMainView === 'today_editor' ? (
          <>
            {/* Left: Single Backward Arrow to return to Today's Goals + Brand */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentMainView('todays_goals')}
                className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors flex items-center justify-center cursor-pointer`}
                title="Back to Today's Goals"
                aria-label="Back to Today's Goals"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <BrandLogo size="sm" showText={false} />

              <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-md">
                {isEditingHeaderTitle ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={headerTitleDraft}
                      onChange={(e) => setHeaderTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveHeaderTitle();
                        if (e.key === 'Escape') setIsEditingHeaderTitle(false);
                      }}
                      onBlur={handleSaveHeaderTitle}
                      autoFocus
                      placeholder="Goal title..."
                      className={`text-xs font-semibold px-2 py-0.5 rounded border border-blue-500 bg-black/40 outline-none ${currentTheme.textPrimary} max-w-[150px] sm:max-w-[260px]`}
                    />
                    <button
                      onMouseDown={handleSaveHeaderTitle}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                      title="Save Title (Enter)"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onMouseDown={() => setIsEditingHeaderTitle(false)}
                      className={`p-1 rounded ${currentTheme.bgSubtle} ${currentTheme.textSecondary} cursor-pointer`}
                      title="Cancel (Esc)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setHeaderTitleDraft(activeGoal?.title || '');
                      setIsEditingHeaderTitle(true);
                    }}
                    className={`flex items-center gap-1.5 text-xs ${currentTheme.textMuted} hover:${currentTheme.textPrimary} truncate font-semibold py-1 px-1.5 rounded hover:bg-neutral-500/10 cursor-pointer text-left`}
                    title="Click to rename goal"
                  >
                    <span className="truncate">
                      {activeGoal?.title || 'Untitled Goal (Click to name)'}
                    </span>
                    <Edit3 className="w-3 h-3 opacity-60 hover:opacity-100 shrink-0 text-blue-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Cloud Sync + Saved Indicator + Menu */}
            <div className="flex items-center gap-2.5">
              <CloudSyncStatusBadge
                user={currentUser}
                authLoading={authLoading}
                syncStatus={cloudSyncStatus}
                theme={currentTheme}
              />
              {lastSavedNotice && (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}

              <button
                onClick={() => setIsHamburgerOpen(true)}
                className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors cursor-pointer`}
                title="Menu"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : currentMainView === 'tenx_goals' ? (
          <>
            {/* Left: Single Backward Arrow (returns to Today's Goals main page) + 10X Logo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentMainView('todays_goals')}
                className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors flex items-center justify-center cursor-pointer`}
                title="Back to Today's Goals"
                aria-label="Back to Today's Goals"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-7 h-7 rounded-md bg-black border border-emerald-500/40 flex items-center justify-center shadow-xs">
                <span className="font-black text-xs">
                  <span className="text-white">10</span>
                  <span className="text-emerald-400">X</span>
                </span>
              </div>
            </div>

            {/* Right: Cloud Sync + Grid/List Toggle + Plus Button */}
            <div className="flex items-center gap-2">
              <CloudSyncStatusBadge
                user={currentUser}
                authLoading={authLoading}
                syncStatus={cloudSyncStatus}
                theme={currentTheme}
              />
              <div className={`flex items-center border ${currentTheme.border} rounded-lg p-0.5 ${currentTheme.bgSubtle}`}>
                <button
                  onClick={() => setTenXViewMode('tabular')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    tenXViewMode === 'tabular'
                      ? 'bg-neutral-500/20 text-emerald-400'
                      : `${currentTheme.textMuted} hover:${currentTheme.textPrimary}`
                  }`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTenXViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    tenXViewMode === 'list'
                      ? 'bg-neutral-500/20 text-emerald-400'
                      : `${currentTheme.textMuted} hover:${currentTheme.textPrimary}`
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleCreateTenXGoal()}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="New 10X Goal"
                aria-label="New 10X Goal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* currentMainView === 'tenx_editor': ONLY ONE BACKWARD NAVIGATION PANE, IN SUCCESSION TO 10X LIST */
          <>
            {/* Left: Backward Arrow returning to 10X Goals List Page + 10X Logo (Zero Clutter) */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentMainView('tenx_goals')}
                className={`p-1.5 rounded-md hover:bg-neutral-500/15 ${currentTheme.textPrimary} transition-colors flex items-center justify-center cursor-pointer`}
                title="Back to 10X Goals"
                aria-label="Back to 10X Goals"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-7 h-7 rounded-md bg-black border border-emerald-500/40 flex items-center justify-center shadow-xs">
                <span className="font-black text-xs">
                  <span className="text-white">10</span>
                  <span className="text-emerald-400">X</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-md">
                {isEditingHeaderTitle ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={headerTitleDraft}
                      onChange={(e) => setHeaderTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveHeaderTitle();
                        if (e.key === 'Escape') setIsEditingHeaderTitle(false);
                      }}
                      onBlur={handleSaveHeaderTitle}
                      autoFocus
                      placeholder="10X Goal title..."
                      className={`text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500 bg-black/40 outline-none ${currentTheme.textPrimary} max-w-[150px] sm:max-w-[260px]`}
                    />
                    <button
                      onMouseDown={handleSaveHeaderTitle}
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      title="Save Title (Enter)"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onMouseDown={() => setIsEditingHeaderTitle(false)}
                      className={`p-1 rounded ${currentTheme.bgSubtle} ${currentTheme.textSecondary} cursor-pointer`}
                      title="Cancel (Esc)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setHeaderTitleDraft(activeGoal?.title || '');
                      setIsEditingHeaderTitle(true);
                    }}
                    className={`flex items-center gap-1.5 text-xs ${currentTheme.textMuted} hover:${currentTheme.textPrimary} truncate font-semibold py-1 px-1.5 rounded hover:bg-neutral-500/10 cursor-pointer text-left`}
                    title="Click to rename 10X goal"
                  >
                    <span className="truncate">
                      {activeGoal?.title || 'Untitled 10X Goal (Click to name)'}
                    </span>
                    <Edit3 className="w-3 h-3 opacity-60 hover:opacity-100 shrink-0 text-emerald-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Cloud Sync + subtle saved checkmark */}
            <div className="flex items-center gap-2.5">
              <CloudSyncStatusBadge
                user={currentUser}
                authLoading={authLoading}
                syncStatus={cloudSyncStatus}
                theme={currentTheme}
              />
              {lastSavedNotice && (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </>
        )}
      </header>

      {/* Main Interface: Today's Goals list as default home, or writing views, or 10X Goals views */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {currentMainView === 'todays_goals' ? (
          <TodaysGoalsView
            goals={goals}
            theme={currentTheme}
            viewMode={homeViewMode}
            onSelectGoal={(id) => {
              setActiveGoalId(id);
              setCurrentMainView('today_editor');
            }}
            onCreateGoal={() => handleCreateGoal()}
            onUpdateGoal={handleUpdateGoal}
            onSwitchToTenX={() => setCurrentMainView('tenx_goals')}
          />
        ) : currentMainView === 'today_editor' ? (
          activeGoal?.type === 'battle_plan' ? (
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
              onRecordSession={handleRecordSession}
            />
          )
        ) : currentMainView === 'tenx_goals' ? (
          <TenXGoalsView
            goals={goals}
            settings={settings}
            theme={currentTheme}
            viewMode={tenXViewMode}
            onSelectGoal={(id) => {
              setActiveGoalId(id);
              setCurrentMainView('tenx_editor');
            }}
            onCreateTenXGoal={() => handleCreateTenXGoal()}
            onUpdateGoal={handleUpdateGoal}
            onSwitchToTodaysGoals={() => setCurrentMainView('todays_goals')}
          />
        ) : currentMainView === 'tenx_editor' && activeGoal ? (
          <TenXGoalEditor
            goal={activeGoal}
            settings={settings}
            theme={currentTheme}
            onUpdateGoal={handleUpdateGoal}
            onRecordSession={handleRecordSession}
            isOverlayOpen={isOverlayOpen}
            onBackToList={() => setCurrentMainView('tenx_goals')}
          />
        ) : (
          <TodaysGoalsView
            goals={goals}
            theme={currentTheme}
            viewMode={homeViewMode}
            onSelectGoal={(id) => {
              setActiveGoalId(id);
              setCurrentMainView('today_editor');
            }}
            onCreateGoal={() => handleCreateGoal()}
            onUpdateGoal={handleUpdateGoal}
            onSwitchToTenX={() => setCurrentMainView('tenx_goals')}
          />
        )}
      </main>

      {/* Hamburger Menu Drawer */}
      <HamburgerMenu
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        activeTab={activeOverlayTab}
        onSelectTab={(tab) => {
          if (tab === 'todays_goal') {
            setCurrentMainView('todays_goals');
            setActiveOverlayTab(null);
            setIsHamburgerOpen(false);
            return;
          }
          if (tab === 'tenx_goal') {
            setCurrentMainView('tenx_goals');
            setActiveOverlayTab(null);
            setIsHamburgerOpen(false);
            return;
          }
          setActiveOverlayTab(tab);
          setIsHamburgerOpen(false);
        }}
        goals={goals}
        settings={settings}
        theme={currentTheme}
        consistencyStats={consistencyStats}
      />

      {/* Overlay Modal for Sections: Calendar, KPI Tab, Settings */}
      <MainOverlayView
        activeTab={activeOverlayTab}
        onClose={() => setActiveOverlayTab(null)}
        goals={goals}
        activeGoal={activeGoal}
        settings={settings}
        theme={currentTheme}
        consistencyStats={consistencyStats}
        user={currentUser}
        authLoading={authLoading}
        syncStatus={cloudSyncStatus}
        onSelectGoal={(id) => {
          setActiveGoalId(id);
          const clickedGoal = goals.find((g) => g.id === id);
          if (clickedGoal?.type === 'tenx_goal' || clickedGoal?.isMoonshot) {
            setCurrentMainView('tenx_editor');
          } else {
            setCurrentMainView('today_editor');
          }
          setActiveOverlayTab(null);
        }}
        onUpdateGoal={handleUpdateGoal}
        onCreateGoal={() => {
          handleCreateGoal();
          setActiveOverlayTab(null);
        }}
        onCreateTenXGoal={() => {
          handleCreateTenXGoal();
          setActiveOverlayTab(null);
        }}
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

      {/* Offline Mode Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
