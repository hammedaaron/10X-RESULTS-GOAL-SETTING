import React, { useEffect, useState } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Strikethrough,
  RemoveFormatting,
  CheckSquare,
} from 'lucide-react';

interface FloatingFormatMenuProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCommand: (cmd: string, val?: string) => void;
  isActive?: boolean;
}

export const FloatingFormatMenu: React.FC<FloatingFormatMenuProps> = ({
  containerRef,
  onCommand,
  isActive = true,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setPosition(null);
      return;
    }

    const handleSelectionChange = () => {
      if (!isActive) {
        setPosition(null);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setPosition(null);
        return;
      }

      // Check if container exists and selection is strictly within container
      const container = containerRef.current;
      if (!container) {
        setPosition(null);
        return;
      }

      if (
        !container.contains(selection.anchorNode) ||
        !container.contains(selection.focusNode)
      ) {
        setPosition(null);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setPosition(null);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setPosition(null);
          return;
        }

        // Position bubble centered above selection
        const top = Math.max(12, rect.top - 48);
        const left = Math.max(16, Math.min(window.innerWidth - 380, rect.left + rect.width / 2 - 160));
        setPosition({ top, left });
      } catch {
        setPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef, isActive]);

  if (!isActive || !position) return null;

  const handleAction = (e: React.MouseEvent, cmd: string, val?: string) => {
    e.preventDefault();
    e.stopPropagation();
    onCommand(cmd, val);
  };

  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-50 flex items-center gap-0.5 px-2 py-1 bg-neutral-900 text-neutral-100 rounded-lg shadow-2xl border border-neutral-700/80 backdrop-blur-md animate-fadeIn select-none"
      onMouseDown={(e) => e.preventDefault()} // prevent focus loss
    >
      {/* Undo & Redo (Requested by user) */}
      <button
        onClick={(e) => handleAction(e, 'undo')}
        title="Undo (Ctrl+Z)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'redo')}
        title="Redo (Ctrl+Y)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-neutral-700 mx-1" />

      {/* Basic Text Formatting */}
      <button
        onClick={(e) => handleAction(e, 'bold')}
        title="Bold (Ctrl+B)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'italic')}
        title="Italic (Ctrl+I)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'underline')}
        title="Underline (Ctrl+U)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'strikeThrough')}
        title="Strikethrough"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-neutral-700 mx-1" />

      {/* Headings */}
      <button
        onClick={(e) => handleAction(e, 'formatBlock', '<h2>')}
        title="Heading 1"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'formatBlock', '<h3>')}
        title="Heading 2"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      {/* Lists */}
      <button
        onClick={(e) => handleAction(e, 'insertUnorderedList')}
        title="Bulleted List"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'insertOrderedList')}
        title="Numbered List"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'insertChecklist')}
        title="Checklist (Interactive Todo)"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={(e) => handleAction(e, 'removeFormat')}
        title="Clear Formatting"
        className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
