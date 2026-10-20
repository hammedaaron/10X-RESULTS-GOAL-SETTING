import React, { useState, useEffect, useRef } from 'react';

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
}) => {
  const [title, setTitle] = useState(goal.title);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync state when goal ID changes
  useEffect(() => {
    setTitle(goal.title);
    if (contentRef.current && contentRef.current.innerHTML !== (goal.contentHtml || '')) {
      contentRef.current.innerHTML = goal.contentHtml || '';
    }
  }, [goal.id]);

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

  // Keyboard shortcut handler for Bold/Italic/Underline/Undo/Redo
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
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

      {/* Clean Distraction-Free Text Canvas: Fills full width with zero clutter */}
      <div
        className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 cursor-text w-full max-w-none"
        onClick={() => contentRef.current?.focus()}
      >
        {/* Document Title (Prominently editable, full width) */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Title..."
            className={`w-full text-2xl sm:text-3xl font-bold bg-transparent outline-none ${theme.textPrimary} placeholder:opacity-30 border-b border-transparent hover:border-neutral-500/30 focus:border-emerald-500 transition-colors pb-1`}
          />
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
