"use client";

import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.repeat) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Ctrl+R (refresh) even in inputs
        if (!(isCtrl && key === "r")) return;
      }

      const combo = `${isCtrl ? "ctrl+" : ""}${key}`;
      const handler = shortcuts[combo];

      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
