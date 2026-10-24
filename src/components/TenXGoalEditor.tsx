import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Check, Edit2, CheckSquare } from 'lucide-react';
import { GoalNote, UserSettings } from '../types';
import { ThemeStyles, getFontClass } from '../utils/theme';
import { FloatingFormatMenu } from './FloatingFormatMenu';

interface TenXGoalEditorProps {
  goal: GoalNote;
  settings: UserSettings;
  theme: ThemeStyles;
  onUpdateGoal: (updatedGoal: GoalNote) => void;
  onBackToList?: () => void;
  onOpenInMainCanvas?: (goalId: string) => void;
  isOverlayOpen?: boolean;
  onRecordSession?: (goalId: string, sessionType: 'morning' | 'evening') => void;
}

export const TenXGoalEditor: React.FC<TenXGoalEditorProps> = ({
  goal,
  settings,
  theme,
  onUpdateGoal,
  onBackToList,
  isOverlayOpen = false,
  onRecordSession,
}) => {
  const [title, setTitle] = useState(goal.title);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isTitleFocusedRef = useRef(false);
  const [sessionSuccessNotice, setSessionSuccessNotice] = useState<string | null>(null);

  // Sync state when goal ID changes
  useEffect(() => {
    if (!isTitleFocusedRef.current) {
      setTitle(goal.title || '');
    }
    if (contentRef.current && contentRef.current.innerHTML !== (goal.contentHtml || '')) {
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
  }, [goal.id]);

  // Sync title from outside only if not currently typing in title
  useEffect(() => {
    if (!isTitleFocusedRef.current && goal.title !== title) {
      setTitle(goal.title || '');
    }
  }, [goal.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const updated: GoalNote = {
      ...goal,
      title: newTitle,
      type: 'tenx_goal',
      isMoonshot: true,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGoal(updated);
  };

  const handleTitleBlur = () => {
    isTitleFocusedRef.current = false;
    const trimmed = title.trim();
    const finalTitle = trimmed || 'Untitled 10X Goal';
    if (finalTitle !== title) {
      setTitle(finalTitle);
    }
    const updated: GoalNote = {
      ...goal,
      title: finalTitle,
      type: 'tenx_goal',
      isMoonshot: true,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGoal(updated);
  };

  const handleContentInput = () => {
    if (!contentRef.current) return;
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

    const updated: GoalNote = {
      ...goal,
      title,
      type: 'tenx_goal',
      isMoonshot: true,
      contentHtml: html,
      plainText: text,
      progress: newProgress,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGoal(updated);
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
    const itemHtml = `<p class="checklist-item" style="display: flex; align-items: flex-start; gap: 10px; margin: 6px 0;"><input type="checkbox" contenteditable="false" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;">New 10X action item</span></p>`;
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
      setSessionSuccessNotice(`${type === 'morning' ? 'Morning' : 'Evening'} 10X session logged!`);
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
            '<input type="checkbox" contenteditable="false" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; margin-top: 3px;" /><span style="flex: 1; outline: none;"><br></span>';

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

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden ${theme.editorBg} relative select-text`}>
      {/* Floating format bubble on highlight */}
      <FloatingFormatMenu
        containerRef={contentRef}
        onCommand={handleFloatingCommand}
        isActive={!isOverlayOpen}
      />

      {/* Clean Distraction-Free Text Canvas */}
      <div
        className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 cursor-text w-full max-w-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            contentRef.current?.focus();
          }
        }}
      >
        {/* Document Title Header & 10X Session Log */}
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
                placeholder="10X Goal title (click to edit)..."
                className={`w-full text-2xl sm:text-3xl font-bold bg-transparent outline-none ${theme.textPrimary} placeholder:opacity-30 border-b border-transparent hover:border-neutral-500/30 focus:border-emerald-500 transition-colors pb-1`}
              />
              <button
                type="button"
                onClick={() => titleInputRef.current?.focus()}
                className={`p-1.5 rounded opacity-40 hover:opacity-100 ${theme.textSecondary} hover:text-emerald-400 cursor-pointer shrink-0 transition-opacity`}
                title="Click to rename 10X goal"
                aria-label="Rename 10X goal"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions & Session Recording: Morning/Evening 10X and + Checklist */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                insertChecklistItem();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/30 ${theme.bgSubtle} text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium transition-colors cursor-pointer`}
              title="Insert 10X action checklist item"
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
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-500/30 ${theme.bgSubtle} text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium transition-colors cursor-pointer`}
                      title="Log morning 10X alignment write"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Morning 10X</span>
                    </button>

                    <button
                      onClick={() => handleTriggerSession('evening')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-500/30 ${theme.bgSubtle} text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium transition-colors cursor-pointer`}
                      title="Log evening 10X review write"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Evening 10X</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pure Text Writing Area: Fills full height without restrictions */}
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
          data-placeholder="Write your 10X moonshot vision and goals..."
        />
      </div>
    </div>
  );
};

