import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Check, Edit2, CheckSquare } from 'lucide-react';
import { GoalNote, UserSettings } from '../types';
import { ThemeStyles, getFontClass } from '../utils/theme';
import { FloatingFormatMenu } from './FloatingFormatMenu';

interface NoteEditorProps {
  goal: GoalNote | null;
  settings: UserSettings;
  theme: ThemeStyles;
  onUpdateGoal: (updatedGoal: GoalNote) => void;
  onOpenMenu: () => void;
  isOverlayOpen?: boolean;
  onRecordSession?: (goalId: string, sessionType: 'morning' | 'evening') => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  goal,
  settings,
  theme,
  onUpdateGoal,
  onOpenMenu,
  isOverlayOpen = false,
  onRecordSession,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isTitleFocusedRef = useRef(false);
  const [title, setTitle] = useState(goal?.title || '');
  const [sessionSuccessNotice, setSessionSuccessNotice] = useState<string | null>(null);

  // Sync internal title and content when goal ID changes
  useEffect(() => {
    if (goal) {
      if (!isTitleFocusedRef.current) {
        setTitle(goal.title || '');
      }
      if (contentRef.current && contentRef.current.innerHTML !== goal.contentHtml) {
        contentRef.current.innerHTML = goal.contentHtml || '';
        // Synchronize and harden all checkboxes in DOM
        contentRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
          cb.setAttribute('contenteditable', 'false');
          const isChecked = cb.hasAttribute('checked') || cb.checked;
          cb.checked = isChecked;
          const sibling = cb.nextElementSibling as HTMLElement | null;
          if (sibling) {
            sibling.style.textDecoration = isChecked ? 'line-through' : 'none';
            sibling.style.opacity = isChecked ? '0.6' : '1';
          }
        });
      }
    }
  }, [goal?.id]);

  // Sync title from outside updates (e.g. renamed in header) only if not currently focused
  useEffect(() => {
    if (goal && !isTitleFocusedRef.current && goal.title !== title) {
      setTitle(goal.title || '');
    }
  }, [goal?.title]);

  if (!goal) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 ${theme.editorBg} ${theme.textMuted}`}
      >
        <p className="text-sm">No goal selected.</p>
        <button
          onClick={onOpenMenu}
          className="mt-3 px-3 py-1.5 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
        >
          Open Menu to Select or Create Goal
        </button>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateGoal({
      ...goal,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTitleBlur = () => {
    isTitleFocusedRef.current = false;
    const trimmed = title.trim();
    const finalTitle = trimmed || 'Untitled Goal';
    if (finalTitle !== title) {
      setTitle(finalTitle);
    }
    onUpdateGoal({
      ...goal,
      title: finalTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleContentInput = () => {
    if (!contentRef.current || !goal) return;
    const html = contentRef.current.innerHTML;
    const text = contentRef.current.innerText || '';

    // Calculate progress if checklist items exist
    const checkboxes = contentRef.current.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    let newProgress = goal.progress;
    let newStatus = goal.status;
    if (checkboxes.length > 0) {
      let checkedCount = 0;
      checkboxes.forEach((cb) => {
        if (cb.checked) checkedCount++;
      });
      newProgress = Math.round((checkedCount / checkboxes.length) * 100);
      newStatus = newProgress === 100 ? 'achieved' : newProgress > 0 ? 'in_progress' : goal.status;
    }

    onUpdateGoal({
      ...goal,
      contentHtml: html,
      plainText: text,
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCheckboxToggle = (cb: HTMLInputElement) => {
    const isChecked = cb.checked;
    if (isChecked) {
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
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      handleCheckboxToggle(target as HTMLInputElement);
    }
  };

  const handleContainerChange = (e: React.FormEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      handleCheckboxToggle(target as HTMLInputElement);
    }
  };

  const insertChecklistItem = () => {
    const itemHtml = `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" contenteditable="false" style="width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; margin-top: 3px;" /><span style="flex: 1; outline: none;">New checklist item</span></p>`;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && contentRef.current?.contains(sel.anchorNode)) {
      document.execCommand('insertHTML', false, itemHtml);
    } else if (contentRef.current) {
      contentRef.current.innerHTML += itemHtml;
    }
    contentRef.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      cb.setAttribute('contenteditable', 'false');
    });
    handleContentInput();
  };

  const handleTriggerSession = (type: 'morning' | 'evening') => {
    if (onRecordSession) {
      onRecordSession(goal.id, type);
      setSessionSuccessNotice(`${type === 'morning' ? 'Morning' : 'Evening'} write session recorded!`);
      setTimeout(() => setSessionSuccessNotice(null), 2500);
    }
  };

  // Keyboard shortcut handler for Bold/Italic/Underline/Undo/Redo/Save & Checklist navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleContentInput();
        return;
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        document.execCommand('bold', false);
        handleContentInput();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.execCommand('italic', false);
        handleContentInput();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        document.execCommand('underline', false);
        handleContentInput();
      } else if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          document.execCommand('redo', false);
          handleContentInput();
        } else {
          e.preventDefault();
          document.execCommand('undo', false);
          handleContentInput();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        document.execCommand('redo', false);
        handleContentInput();
      }
    }

    // Checklist smart Enter: continues the checklist; on empty line, exits checklist into paragraph
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
            '<input type="checkbox" contenteditable="false" style="width: 18px; height: 18px; cursor: pointer; accent-color: #3b82f6; margin-top: 3px;" /><span style="flex: 1; outline: none;"><br></span>';

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

  const todaySessions = (goal.sessionsLog || []).filter((s) => {
    try {
      const d = new Date(s.timestamp);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  });

  return (
    <div
      className={`flex-1 flex flex-col h-full w-full overflow-hidden ${theme.editorBg} transition-colors select-text relative`}
    >
      {/* Floating format bubble on highlight */}
      <FloatingFormatMenu
        containerRef={contentRef}
        onCommand={handleFloatingCommand}
        isActive={!isOverlayOpen}
      />

      {/* Clean Distraction-Free Text Canvas */}
      <div
        className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 cursor-text w-full max-w-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            contentRef.current?.focus();
          }
        }}
      >
        {/* Document Title Header & 2x Daily Write Session Quick-Log */}
        <div
          className="mb-6 pb-2 border-b border-neutral-500/10 flex flex-wrap items-center justify-between gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 group/title">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                onFocus={() => {
                  isTitleFocusedRef.current = true;
                }}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTitleBlur();
                    contentRef.current?.focus();
                  }
                }}
                placeholder="Goal title (click to edit)..."
                className={`w-full text-2xl md:text-3xl font-bold bg-transparent outline-none ${theme.textPrimary} placeholder:opacity-30 border-b border-transparent hover:border-neutral-500/30 focus:border-blue-500 transition-colors pb-1`}
              />
              <button
                type="button"
                onClick={() => titleInputRef.current?.focus()}
                className={`p-1.5 rounded opacity-40 hover:opacity-100 ${theme.textSecondary} hover:text-blue-400 cursor-pointer shrink-0 transition-opacity`}
                title="Click to rename goal title"
                aria-label="Rename goal title"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions & Session Tracker: Morning/Evening Write and + Checklist */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                insertChecklistItem();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${theme.border} ${theme.bgSubtle} text-blue-400 hover:bg-blue-500/10 text-xs font-medium transition-colors cursor-pointer`}
              title="Insert interactive checklist bullet"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>+ Checklist</span>
            </button>

            {onRecordSession && (
              <>
                {sessionSuccessNotice ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    {sessionSuccessNotice}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTriggerSession('morning')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border ${theme.border} ${theme.bgSubtle} text-amber-400 hover:bg-amber-500/10 text-xs font-medium transition-colors cursor-pointer`}
                      title="Log morning goal writing session"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Morning Write</span>
                    </button>

                    <button
                      onClick={() => handleTriggerSession('evening')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border ${theme.border} ${theme.bgSubtle} text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition-colors cursor-pointer`}
                      title="Log evening goal review session"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Evening Write</span>
                    </button>

                    {todaySessions.length > 0 && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {todaySessions.length} logged today
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pure Text Writing Area: Fills full width without max-width restrictions */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onClick={handleContainerClick}
          onChange={handleContainerChange}
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
    </div>
  );
};

