import React, { useState } from 'react';
import {
  Settings,
  Trash2,
  Palette,
  Target,
  Type,
  RotateCcw,
  Check,
  Info,
  BookOpen,
  Download,
  Upload,
  ShieldCheck,
  Copy,
  ExternalLink,
  Plus,
  Smartphone,
} from 'lucide-react';
import { GoalNote, UserSettings, ThemeMode, FontChoice } from '../types';
import { ThemeStyles } from '../utils/theme';
import { DOCUMENTATION_TEMPLATES, exportGoalsBackupJSON } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: UserSettings;
  theme: ThemeStyles;
  deletedGoals: GoalNote[];
  allGoals: GoalNote[];
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRestoreGoal: (goalId: string) => void;
  onPermanentlyDeleteGoal: (goalId: string) => void;
  onEmptyTrash: () => void;
  onApplyTemplate?: (title: string, contentHtml: string, type: 'goal' | 'battle_plan') => void;
  onImportBackup?: (goals: GoalNote[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  theme,
  deletedGoals,
  allGoals,
  onUpdateSettings,
  onRestoreGoal,
  onPermanentlyDeleteGoal,
  onEmptyTrash,
  onApplyTemplate,
  onImportBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'consistency' | 'documentation' | 'trash'>('appearance');
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const THEMES: { id: ThemeMode; name: string; desc: string; previewBg: string; previewText: string }[] = [
    {
      id: 'dark_charcoal',
      name: 'Dark Charcoal',
      desc: 'Windows Notepad modern dark interface (#1f1f1f)',
      previewBg: 'bg-[#1f1f1f]',
      previewText: 'text-[#f3f4f6]',
    },
    {
      id: 'light_notepad',
      name: 'Notepad Light',
      desc: 'Crisp, high-contrast clean white canvas',
      previewBg: 'bg-white',
      previewText: 'text-slate-900',
    },
    {
      id: 'warm_sepia',
      name: 'Warm Paper Sepia',
      desc: 'Gentle warm background reminiscent of fine journal paper',
      previewBg: 'bg-[#fbf7f0]',
      previewText: 'text-[#292524]',
    },
    {
      id: 'oled_black',
      name: 'OLED Midnight Black',
      desc: 'Pure pitch black for zero light bleed',
      previewBg: 'bg-black',
      previewText: 'text-[#fafafa]',
    },
  ];

  const handleDownloadBackup = () => {
    const jsonStr = exportGoalsBackupJSON(allGoals, settings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objectivenote_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.goals) && onImportBackup) {
          onImportBackup(parsed.goals);
          alert('Backup restored successfully!');
        } else if (Array.isArray(parsed) && onImportBackup) {
          onImportBackup(parsed);
          alert('Backup restored successfully!');
        }
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyTemplate = (tpl: typeof DOCUMENTATION_TEMPLATES[0]) => {
    navigator.clipboard.writeText(tpl.contentHtml);
    setCopyFeedback(tpl.id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme.bgSurface}`}>
      {/* Top Header */}
      <div className={`p-4 border-b ${theme.border} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <Settings className={`w-5 h-5 ${theme.accent}`} />
          <h2 className={`font-semibold text-base ${theme.textPrimary}`}>Settings &amp; Documentation</h2>
        </div>

        {/* Tab switcher: Added Documentation tab requested by user */}
        <div className={`flex flex-wrap items-center border ${theme.border} rounded p-0.5 ${theme.bgSubtle} text-xs`}>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'appearance' ? `${theme.bgSurface} ${theme.textPrimary} shadow-xs` : theme.textMuted
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'consistency' ? `${theme.bgSurface} ${theme.textPrimary} shadow-xs` : theme.textMuted
            }`}
          >
            Consistency
          </button>
          <button
            onClick={() => setActiveTab('documentation')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'documentation' ? `${theme.bgSurface} text-blue-400 font-semibold shadow-xs` : theme.textMuted
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation</span>
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'trash' ? `${theme.bgSurface} text-red-400 shadow-xs` : theme.textMuted
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Trash Bin</span>
            {deletedGoals.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-red-500/20 text-red-400 rounded-full font-bold">
                {deletedGoals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl">
        {/* DOCUMENTATION & TEMPLATES TAB (Requested by user) */}
        {activeTab === 'documentation' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Guide Overview */}
            <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle}`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className={`text-base font-bold ${theme.textPrimary}`}>
                  10X RESULTS System Guide &amp; Documentation
                </h3>
              </div>
              <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                This documentation is locked here in settings so you can refer to the methodology, feature blueprints, and structured templates whenever needed while keeping your main writing interface 100% clean and distraction-free.
              </p>

              {/* Core Feature Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-500/15">
                <div className={`p-3 rounded-lg border border-neutral-500/15 ${theme.bgSurface}`}>
                  <h4 className={`text-xs font-semibold ${theme.textPrimary} mb-1 flex items-center gap-1.5`}>
                    <span>🎯 2x Daily Goal Writing Practice</span>
                  </h4>
                  <p className={`text-[11px] ${theme.textMuted} leading-normal`}>
                    Writing goals down twice daily (upon waking and before sleep) turns abstract ambition into automatic focus and decisive execution.
                  </p>
                </div>

                <div className={`p-3 rounded-lg border border-neutral-500/15 ${theme.bgSurface}`}>
                  <h4 className={`text-xs font-semibold ${theme.textPrimary} mb-1 flex items-center gap-1.5`}>
                    <span>⚔️ Battle Plan Checklists</span>
                  </h4>
                  <p className={`text-[11px] ${theme.textMuted} leading-normal`}>
                    Checklists operate like bullet points. The fixated footer progress bar smoothly changes from Red to Green as you check off items.
                  </p>
                </div>

                <div className={`p-3 rounded-lg border border-neutral-500/15 ${theme.bgSurface}`}>
                  <h4 className={`text-xs font-semibold ${theme.textPrimary} mb-1 flex items-center gap-1.5`}>
                    <span>📅 Calendar Color Codes</span>
                  </h4>
                  <p className={`text-[11px] ${theme.textMuted} leading-normal`}>
                    Green circle (2+ goal writes daily), Orange circle (1 write), Red circle (absent day). Browse years and months freely.
                  </p>
                </div>

                <div className={`p-3 rounded-lg border border-neutral-500/15 ${theme.bgSurface}`}>
                  <h4 className={`text-xs font-semibold ${theme.textPrimary} mb-1 flex items-center gap-1.5`}>
                    <span>🛡️ Permanent Local Persistence</span>
                  </h4>
                  <p className={`text-[11px] ${theme.textMuted} leading-normal`}>
                    Every keystroke, goal, and battle plan is permanently stored in your browser. Closing the window never deletes your work.
                  </p>
                </div>
              </div>
            </div>

            {/* Permanent Storage & Backup Utilities */}
            <div className={`p-5 rounded-xl border ${theme.border} ${theme.bgSubtle}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>
                    Permanent Storage &amp; Local Backup
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/15">
                  ✓ Active &amp; Synced
                </span>
              </div>
              <p className={`text-xs ${theme.textMuted} mb-4`}>
                All goals and battle plans remain saved permanently in your browser localStorage. For extra safety, you can export a full JSON backup to your computer at any time.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup File (JSON)</span>
                </button>

                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.bgSurface} ${theme.textSecondary} hover:${theme.textPrimary} text-xs font-medium cursor-pointer transition-colors`}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Reference Templates Locked in Documentation */}
            <div>
              <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-2`}>
                Reference Templates Library
              </h3>
              <p className={`text-xs ${theme.textMuted} mb-4`}>
                You can copy any of these templates into your notes or create a new document with them:
              </p>

              <div className="space-y-4">
                {DOCUMENTATION_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} space-y-3`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                          {tpl.category}
                        </span>
                        <h4 className={`text-sm font-semibold ${theme.textPrimary}`}>
                          {tpl.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyTemplate(tpl)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded border ${theme.border} ${theme.bgSurface} text-xs ${theme.textSecondary} hover:${theme.textPrimary}`}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copyFeedback === tpl.id ? 'Copied HTML!' : 'Copy Template'}</span>
                        </button>

                        {onApplyTemplate && (
                          <button
                            onClick={() =>
                              onApplyTemplate(
                                tpl.title,
                                tpl.contentHtml,
                                tpl.id.includes('battle-plan') ? 'battle_plan' : 'goal'
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Create Document With This</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs ${theme.textMuted}`}>{tpl.description}</p>

                    {/* Preview box */}
                    <div
                      className={`p-3 rounded-lg border border-neutral-500/15 ${theme.bgSurface} text-xs prose max-w-none max-h-40 overflow-y-auto leading-relaxed ${theme.textSecondary}`}
                      dangerouslySetInnerHTML={{ __html: tpl.contentHtml }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${theme.textPrimary}`}>
                <Palette className="w-4 h-4 text-blue-400" />
                Background &amp; Interface Theme
              </h3>
              <p className={`text-xs mb-4 ${theme.textMuted}`}>
                Select between Windows Notepad dark charcoal, clean white, or warm paper aesthetics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const isSelected = settings.theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onUpdateSettings({ ...settings, theme: t.id })}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? `border-blue-500 ring-2 ring-blue-500/30 ${theme.bgHover}`
                          : `border-neutral-500/20 hover:border-neutral-500/40 ${theme.bgSubtle}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold text-sm ${theme.textPrimary}`}>{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                      </div>
                      <p className={`text-xs mb-3 ${theme.textMuted}`}>{t.desc}</p>

                      {/* Mini preview card */}
                      <div className={`p-2.5 rounded border border-neutral-500/20 ${t.previewBg}`}>
                        <div className={`text-[11px] font-mono ${t.previewText} opacity-90`}>
                          Windows Notepad - Goal.txt
                        </div>
                        <div className={`text-[10px] mt-1 ${t.previewText} opacity-60`}>
                          Review morning &amp; evening objectives...
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typography options */}
            <div className={`pt-6 border-t ${theme.borderSubtle}`}>
              <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${theme.textPrimary}`}>
                <Type className="w-4 h-4 text-indigo-400" />
                Notepad Font &amp; Sizing
              </h3>
              <p className={`text-xs mb-4 ${theme.textMuted}`}>
                Customize typography to match your reading preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Font family */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${theme.textSecondary}`}>
                    Typeface
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'sans', label: 'Clean Sans' },
                        { id: 'mono', label: 'Monospace (Notepad)' },
                        { id: 'serif', label: 'Editorial Serif' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateSettings({ ...settings, fontFamily: f.id as FontChoice })}
                        className={`flex-1 py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                          settings.fontFamily === f.id
                            ? `${theme.border} ${theme.bgHover} font-bold text-blue-400`
                            : `border-neutral-500/20 ${theme.textMuted} hover:${theme.textSecondary}`
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${theme.textSecondary}`}>
                    Font Size: <span className="tabular-nums font-bold">{settings.fontSize}px</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="13"
                      max="22"
                      step="1"
                      value={settings.fontSize}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, fontSize: Number(e.target.value) })
                      }
                      className="w-full cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PWA App Installation & Offline Support */}
            <div className={`pt-6 border-t ${theme.borderSubtle}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme.textPrimary}`}>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  App Installation &amp; Offline PWA
                </h3>
                <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/15">
                  Offline Ready
                </span>
              </div>
              <p className={`text-xs mb-3.5 ${theme.textMuted}`}>
                Install 10X RESULTS directly to your home screen or desktop for instant full-screen distraction-free writing, even when completely offline.
              </p>
              <div className="max-w-xs">
                <PWAInstallButton variant="full" />
              </div>
            </div>
          </div>
        )}

        {/* CONSISTENCY GOAL TAB */}
        {activeTab === 'consistency' && (
          <div className="space-y-6">
            <div>
              <h3 className={`text-sm font-semibold mb-1 flex items-center gap-2 ${theme.textPrimary}`}>
                <Target className="w-4 h-4 text-emerald-400" />
                Daily Writing Consistency Target
              </h3>
              <p className={`text-xs mb-4 ${theme.textMuted}`}>
                Configure how many times per day you commit to writing and reviewing your goals.
              </p>

              <div className={`p-4 rounded-lg border ${theme.border} ${theme.bgSubtle} space-y-4`}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className={`font-semibold ${theme.textPrimary}`}>The 2x Daily Rule:</span>
                    <p className={`mt-0.5 ${theme.textMuted}`}>
                      Writing your goals down upon waking primes your subconscious for the day’s high-value choices.
                      Writing them before sleep allows your mind to organize solutions overnight.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-2 ${theme.textPrimary}`}>
                    Required Daily Sessions Target:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((count) => {
                      const isSelected = settings.consistencyDailyTarget === count;
                      return (
                        <button
                          key={count}
                          onClick={() =>
                            onUpdateSettings({ ...settings, consistencyDailyTarget: count })
                          }
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isSelected
                              ? `border-emerald-500 bg-emerald-500/10 font-bold text-emerald-400 ring-1 ring-emerald-500/30`
                              : `border-neutral-500/20 ${theme.bgSurface} ${theme.textSecondary} hover:border-neutral-500/40`
                          }`}
                        >
                          <div className="text-lg font-mono tabular-nums">{count}x</div>
                          <div className="text-[10px] mt-0.5 opacity-80">
                            {count === 1
                              ? 'Once Daily'
                              : count === 2
                              ? 'Twice Daily (Standard)'
                              : `${count} times / day`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRASH BIN TAB */}
        {activeTab === 'trash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme.textPrimary}`}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Trash Bin (Recover Deleted Items)
                </h3>
                <p className={`text-xs mt-0.5 ${theme.textMuted}`}>
                  Goals deleted from monthly folders can be restored here or permanently removed.
                </p>
              </div>

              {deletedGoals.length > 0 && (
                <div>
                  {confirmEmptyTrash ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                      <button
                        onClick={() => {
                          onEmptyTrash();
                          setConfirmEmptyTrash(false);
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                      >
                        Yes, Empty All
                      </button>
                      <button
                        onClick={() => setConfirmEmptyTrash(false)}
                        className={`px-2 py-1 text-xs ${theme.textMuted}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmEmptyTrash(true)}
                      className="px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
                    >
                      Empty Trash
                    </button>
                  )}
                </div>
              )}
            </div>

            {deletedGoals.length === 0 ? (
              <div className={`p-12 text-center border ${theme.borderSubtle} rounded-lg ${theme.bgSubtle}`}>
                <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-neutral-400" />
                <h4 className={`text-sm font-medium ${theme.textPrimary}`}>Trash Bin is Empty</h4>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>
                  No deleted goals or notes found. Items you delete will appear here so you can recover them.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {deletedGoals.map((g) => (
                  <div
                    key={g.id}
                    className={`p-3.5 rounded-lg border ${theme.border} ${theme.bgSubtle} flex flex-wrap items-center justify-between gap-3`}
                  >
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs line-through opacity-70 ${theme.textPrimary}`}>
                          {g.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${theme.border} ${theme.textMuted}`}>
                          Folder: {g.month}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                        <span>Progress was: {g.progress}%</span>
                        <span>·</span>
                        <span>Deleted on: {g.deletedAt ? new Date(g.deletedAt).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestoreGoal(g.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium transition-colors`}
                        title="Restore goal back to its monthly folder"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => onPermanentlyDeleteGoal(g.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
