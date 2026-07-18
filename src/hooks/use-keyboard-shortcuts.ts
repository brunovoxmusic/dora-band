"use client";

import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

type Shortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: KeyHandler;
  /** Prevent default browser behavior (default true) */
  preventDefault?: boolean;
};

/**
 * Binds keyboard shortcuts. Pass an array of shortcut definitions.
 * Shortcuts are ignored when the user is typing in an input/textarea/select
 * unless the shortcut requires Ctrl/Meta.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      for (const s of shortcuts) {
        const ctrlOrMeta = s.ctrl || s.meta;
        // If typing in a field, only respond to ctrl/meta shortcuts
        if (isTyping && !ctrlOrMeta) continue;

        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : true;
        const metaMatch = s.meta ? e.metaKey : true;

        if (
          (e.key.toLowerCase() === s.key.toLowerCase() ||
            e.key === s.key) &&
          ctrlMatch &&
          shiftMatch &&
          metaMatch &&
          (!ctrlOrMeta || (e.ctrlKey || e.metaKey))
        ) {
          if (s.preventDefault !== false) e.preventDefault();
          s.handler(e);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, enabled]);
}
