import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import loadCommands from "../lib/commandsLoader";

/**
 * Context provides:
 * - visible, open(), close()
 * - commands array
 * - runCommand(cmd)
 * - history
 */

export const CommandPaletteContext = createContext({
  visible: false,
  open: () => {},
  close: () => {},
  commands: [],
  runCommand: () => {}
});

export function CommandPaletteProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [commands, setCommands] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const cmds = await loadCommands();
      setCommands(cmds);
    })();
  }, []);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const runCommand = useCallback(async (cmd) => {
    try {
      if (!cmd) return;
      // support action functions defined inline
      if (typeof cmd.action === "function") {
        await cmd.action();
        return;
      }
      // support standard types: system, tool, ai, file, action
      if (cmd.type === "system") {
        if (cmd.id === "reload") window.location.reload();
        if (cmd.id === "settings") window.dispatchEvent(new CustomEvent("lumina:open-settings"));
      } else if (cmd.type === "ai") {
        window.dispatchEvent(new CustomEvent("lumina:open-ai", { detail: cmd }));
      } else if (cmd.type === "action") {
        // send to electron
        window.electron?.invoke?.("command:run", cmd.id);
      } else if (cmd.type === "file" && cmd.path) {
        window.electron?.openPath?.(cmd.path);
      }
    } catch (e) {
      console.error("runCommand error", e);
    }
  }, []);

  const addHistory = useCallback((cmd) => {
    setHistory(h => [cmd, ...h].slice(0, 50));
  }, []);

  // register global hotkey here (Cmd/Ctrl+K)
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ visible, open, close, commands, runCommand, history, addHistory }), [visible, commands, runCommand, history, addHistory, open, close]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}
