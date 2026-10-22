import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Check, Edit2 } from 'lucide-react';
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

    const updated: GoalNote = {
      ...goal,
      title,
      type: 'tenx_goal',
      isMoonshot: true,
      contentHtml: html,
      plainText: text,
      updatedAt: new Date().toISOString(),
    };
    onUpdateGoal(updated);
  };

  const handleTriggerSession = (type: 'morning' | 'evening') => {
    if (onRecordSession) {
      onRecordSession(goal.id, type);
      setSessionSuccessNotice(`${type === 'morning' ? 'Morning' : 'Evening'} 10X session logged!`);
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

          {/* Session Recording Button */}
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
            </div>
          )}
        </div>

        {/* Pure Text Writing Area: Fills full height without restrictions */}
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
          data-placeholder="Write your 10X moonshot vision and goals..."
        />
      </div>
    </div>
  );
};

