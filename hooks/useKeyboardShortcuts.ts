"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardShortcutsProps {
  reactFlowInstance: any;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
}: UseKeyboardShortcutsProps) {
  const lastActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in input, textarea, or other editable elements
      const target = event.target as HTMLElement;

      // Check for editable elements
      const isEditable = target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('[contenteditable="true"]') !== null;

      if (isEditable) {
        return; // Let the browser handle typing in editable fields
      }

      // Handle zoom shortcuts
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        reactFlowInstance?.zoomIn({ duration: 200 });
      } else if (event.key === '-') {
        event.preventDefault();
        reactFlowInstance?.zoomOut({ duration: 200 });
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          // Cmd/Ctrl + Shift + Z for redo
          redo();
        } else {
          // Cmd/Ctrl + Z for undo
          undo();
        }
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    // Store the last active element before adding event listener
    lastActiveElementRef.current = document.activeElement;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [reactFlowInstance, undo, redo]);

  return {};
}