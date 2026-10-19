import React, { useEffect, useRef, useState } from 'react';
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
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  goal,
  settings,
  theme,
  onUpdateGoal,
  onOpenMenu,
  isOverlayOpen = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(goal?.title || '');

  // Sync internal title and content when goal changes
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      if (contentRef.current && contentRef.current.innerHTML !== goal.contentHtml) {
        contentRef.current.innerHTML = goal.contentHtml || '';
      }
    }
  }, [goal?.id]);

  if (!goal) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 ${theme.editorBg} ${theme.textMuted}`}
      >
        <p className="text-sm">No goal selected.</p>
        <button
          onClick={onOpenMenu}
          className="mt-3 px-3 py-1.5 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
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
    <div
      className={`flex-1 flex flex-col h-full w-full overflow-hidden ${theme.editorBg} transition-colors select-text relative`}
    >
      {/* Floating format bubble on highlight (Strictly disabled when overlay tabs are open) */}
      <FloatingFormatMenu
        containerRef={contentRef}
        onCommand={handleFloatingCommand}
        isActive={!isOverlayOpen}
      />

      {/* Clean Distraction-Free Text Canvas: Fills full screen with no side black/empty gutters */}
      <div
        className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 cursor-text w-full max-w-none"
        onClick={() => contentRef.current?.focus()}
      >
        {/* Document Title (Prominently editable, full width) */}
        <div className="relative group/title mb-6">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Click to name your goal..."
            className={`w-full text-2xl md:text-3xl font-bold bg-transparent outline-none ${theme.textPrimary} placeholder:opacity-30 border-b border-transparent hover:border-neutral-500/30 focus:border-blue-500 transition-colors pb-1 pr-8`}
          />
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
