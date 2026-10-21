import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  CheckSquare,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { GoalNote, UserSettings, BattlePlanItem } from '../types';
import { ThemeStyles, getFontClass } from '../utils/theme';
import { FloatingFormatMenu } from './FloatingFormatMenu';

interface BattlePlanEditorProps {
  plan: GoalNote;
  settings: UserSettings;
  theme: ThemeStyles;
  onUpdatePlan: (updatedPlan: GoalNote) => void;
  onOpenMenu: () => void;
  isOverlayOpen?: boolean;
}

export const BattlePlanEditor: React.FC<BattlePlanEditorProps> = ({
  plan,
  settings,
  theme,
  onUpdatePlan,
  onOpenMenu,
  isOverlayOpen = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(plan.title);
  const [showReportTable, setShowReportTable] = useState(false);
  const [progress, setProgress] = useState(plan.progress || 0);
  const [checklistReport, setChecklistReport] = useState<{ text: string; completed: boolean }[]>([]);

  // Default initial battle plan HTML with checklist bullet points if empty
  const getDefaultContent = () => {
    return `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Morning priority objective review and alignment</span></p><p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Deep work sprint on core milestone without distractions</span></p><p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">Evening audit against written goals and prepare tomorrow</span></p>`;
  };

  // Extract checklist items and calculate progress
  const analyzeContent = () => {
    if (!contentRef.current) return { progress: 0, items: [] };

    const checkboxes = contentRef.current.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    const items: { text: string; completed: boolean }[] = [];
    let checkedCount = 0;

    checkboxes.forEach((cb) => {
      const isChecked = cb.checked;
      if (isChecked) checkedCount++;

      // Find task text in sibling span
      let text = '';
      const span = cb.nextElementSibling;
      if (span) {
        text = span.textContent?.trim() || '';
      } else if (cb.parentElement) {
        text = cb.parentElement.textContent?.trim() || '';
      }

      if (text) {
        items.push({ text, completed: isChecked });
      }
    });

    const total = checkboxes.length;
    const calculatedProgress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    return { progress: calculatedProgress, items };
  };

  // Sync internal state when plan changes
  useEffect(() => {
    setTitle(plan.title);
    if (contentRef.current) {
      if (!plan.contentHtml || plan.contentHtml.trim() === '') {
        contentRef.current.innerHTML = getDefaultContent();
      } else if (contentRef.current.innerHTML !== plan.contentHtml) {
        contentRef.current.innerHTML = plan.contentHtml;
      }
      const { progress: calcProg, items } = analyzeContent();
      setProgress(calcProg);
      setChecklistReport(items);
    }
  }, [plan.id, plan.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdatePlan({
      ...plan,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleContentInput = () => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    const text = contentRef.current.innerText || '';
    const { progress: calcProg, items } = analyzeContent();

    setProgress(calcProg);
    setChecklistReport(items);

    // Also update battlePlanItems for reporting
    const battlePlanItems: BattlePlanItem[] = items.map((it, idx) => ({
      id: `bpi-${idx}`,
      text: it.text,
      completed: it.completed,
      completedAt: it.completed ? new Date().toISOString() : undefined,
    }));

    onUpdatePlan({
      ...plan,
      title,
      contentHtml: html,
      plainText: text,
      progress: calcProg,
      status: calcProg === 100 ? 'achieved' : calcProg > 0 ? 'in_progress' : 'needs_attention',
      battlePlanItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Event handler for clicking checkboxes in contentEditable
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const cb = target as HTMLInputElement;
      if (cb.checked) {
        cb.setAttribute('checked', 'true');
        if (cb.nextElementSibling) {
          (cb.nextElementSibling as HTMLElement).style.textDecoration = 'line-through';
          (cb.nextElementSibling as HTMLElement).style.opacity = '0.6';
        }
      } else {
        cb.removeAttribute('checked');
        if (cb.nextElementSibling) {
          (cb.nextElementSibling as HTMLElement).style.textDecoration = 'none';
          (cb.nextElementSibling as HTMLElement).style.opacity = '1';
        }
      }
      handleContentInput();
    }
  };

  // Keyboard navigation: Enter creates next checklist bullet, Backspace on empty line removes it
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        document.execCommand('bold', false);
        handleContentInput();
        return;
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.execCommand('italic', false);
        handleContentInput();
        return;
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        document.execCommand('underline', false);
        handleContentInput();
        return;
      } else if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          document.execCommand('redo', false);
        } else {
          e.preventDefault();
          document.execCommand('undo', false);
        }
        handleContentInput();
        return;
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        document.execCommand('redo', false);
        handleContentInput();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode;
        let checkItem: HTMLElement | null = null;

        while (node && node !== contentRef.current) {
          if (
            node.nodeType === 1 &&
            (node as HTMLElement).classList?.contains('checklist-item')
          ) {
            checkItem = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }

        if (checkItem) {
          e.preventDefault();
          const span = checkItem.querySelector('span');

          // If current item is empty, exit checklist into a normal paragraph
          if (span && (!span.textContent || span.textContent.trim() === '')) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            checkItem.parentNode?.replaceChild(p, checkItem);
            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleContentInput();
            return;
          }

          // Continue checklist like a bulleted list!
          const newItem = document.createElement('p');
          newItem.className = 'checklist-item';
          newItem.style.cssText =
            'display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;';
          newItem.innerHTML =
            '<input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;"><br></span>';

          checkItem.after(newItem);
          const newSpan = newItem.querySelector('span');
          if (newSpan) {
            const range = document.createRange();
            range.setStart(newSpan, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          handleContentInput();
        }
      }
    } else if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        let node: Node | null = selection.anchorNode;
        let checkItem: HTMLElement | null = null;

        while (node && node !== contentRef.current) {
          if (
            node.nodeType === 1 &&
            (node as HTMLElement).classList?.contains('checklist-item')
          ) {
            checkItem = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }

        if (checkItem) {
          const span = checkItem.querySelector('span');
          if (span && (!span.textContent || span.textContent.trim() === '')) {
            e.preventDefault();
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            checkItem.parentNode?.replaceChild(p, checkItem);
            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            handleContentInput();
          }
        }
      }
    }
  };

  const handleFloatingCommand = (cmd: string, val?: string) => {
    if (cmd === 'insertChecklist') {
      insertChecklistItem();
      return;
    }
    document.execCommand(cmd, false, val);
    handleContentInput();
  };

  const insertChecklistItem = () => {
    const itemHtml = `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">New checklist item</span></p>`;
    document.execCommand('insertHTML', false, itemHtml);
    handleContentInput();
  };

  // Single line progress bar color (Red -> Yellow -> Green)
  const getProgressBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-emerald-400';
    if (pct >= 40) return 'bg-amber-400';
    if (pct > 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const totalTasks = checklistReport.length;
  const completedTasks = checklistReport.filter((i) => i.completed).length;

  return (
    <div
      className={`flex-1 flex flex-col h-full w-full overflow-hidden ${theme.editorBg} transition-colors select-text relative`}
    >
      {/* Floating format bubble on highlight (strictly identical to goal page) */}
      <FloatingFormatMenu
        containerRef={contentRef}
        onCommand={handleFloatingCommand}
        isActive={!isOverlayOpen}
      />

      {/* Clean Distraction-Free Text Canvas (Same as Goal Page, edge-to-edge text flow) */}
      <div
        className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 pb-28 cursor-text w-full max-w-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            contentRef.current?.focus();
          }
        }}
      >
        {/* Document Title & Report Toggle Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-neutral-500/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Click to name your battle plan..."
              className={`w-full text-2xl md:text-3xl font-bold bg-transparent outline-none ${theme.textPrimary} placeholder:opacity-30 border-b border-transparent hover:border-neutral-500/30 focus:border-blue-500 transition-colors pb-1`}
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReportTable(!showReportTable);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${theme.border} ${theme.bgSubtle} ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}
              title="Toggle daily tabular report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>{showReportTable ? 'Hide Daily Report' : 'Daily Report Table'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                insertChecklistItem();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              title="Insert checklist bullet point"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>+ Checklist</span>
            </button>
          </div>
        </div>

        {/* Tabular Daily Report (Toggleable in page) */}
        {showReportTable && (
          <div
            className={`mb-8 p-4 rounded-xl border ${theme.border} ${theme.bgSubtle} shadow-xs animate-fadeIn`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-500/15">
              <h3 className={`font-semibold text-xs uppercase tracking-wider ${theme.textPrimary}`}>
                Battle Plan Daily Report · {new Date().toLocaleDateString()}
              </h3>
              <span className={`text-xs tabular-nums ${theme.textMuted}`}>
                {completedTasks} of {totalTasks} Completed ({progress}%)
              </span>
            </div>

            {checklistReport.length === 0 ? (
              <p className={`text-xs ${theme.textMuted} py-2`}>
                No checklist bullet points found in this battle plan yet. Type your checklist items below.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-500/15">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${theme.border} text-neutral-400 ${theme.bgSurface}`}>
                      <th className="py-2.5 px-3 font-semibold w-36">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Checklist Task</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-500/10">
                    {checklistReport.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-500/5 transition-colors">
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

                        {/* Right: Checklist Task Text */}
                        <td
                          className={`py-2.5 px-3 break-words ${
                            item.completed ? 'line-through opacity-70' : theme.textPrimary
                          }`}
                        >
                          {item.text || 'Untitled task'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pure Text Writing Area with Checklist Bullet Points (No text blocks, no delete buttons!) */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleContainerClick}
          onInput={handleContentInput}
          onKeyDown={handleKeyDown}
          className={`min-h-[75vh] w-full outline-none leading-relaxed transition-all ${getFontClass(
            settings.fontFamily
          )} ${theme.textPrimary} prose max-w-none focus:outline-none`}
          style={{
            fontSize: `${settings.fontSize}px`,
          }}
        />
      </div>

      {/* SINGLE LINE PROGRESS BAR FIXATED AT FOOTER SECTION (Red -> Yellow -> Green) */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 border-t ${theme.border} ${theme.bgSurface} backdrop-blur-md px-6 py-2.5 flex flex-col justify-center select-none shadow-lg`}
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className={`font-semibold ${theme.textPrimary}`}>
            Battle Plan Progress
          </span>

          <span
            className={`font-bold tabular-nums ${
              progress === 100 ? 'text-emerald-400' : theme.textPrimary
            }`}
          >
            {completedTasks}/{totalTasks} Completed ({progress}%)
          </span>
        </div>

        {/* The single-line color progress bar (going from red to green) */}
        <div className="w-full h-1.5 rounded-full bg-neutral-500/20 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(
              progress
            )}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </footer>
    </div>
  );
};
