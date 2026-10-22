import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Check, Edit2 } from 'lucide-react';
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
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    const text = contentRef.current.innerText || '';
    onUpdateGoal({
      ...goal,
      contentHtml: html,
      plainText: text,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTriggerSession = (type: 'morning' | 'evening') => {
    if (onRecordSession) {
      onRecordSession(goal.id, type);
      setSessionSuccessNotice(`${type === 'morning' ? 'Morning' : 'Evening'} write session recorded!`);
      setTimeout(() => setSessionSuccessNotice(null), 2500);
    }
  };

  // Keyboard shortcut handler for Bold/Italic/Underline/Undo/Redo/Save
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
  };

  const handleFloatingCommand = (cmd: string, val?: string) => {
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

          {/* 2x Daily Session Tracker (Morning & Evening) */}
          {onRecordSession && (
            <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>

        {/* Pure Text Writing Area: Fills full width without max-width restrictions */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
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

