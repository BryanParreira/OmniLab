import { useContext } from "react";
import { CommandPaletteContext } from "../context/CommandPaletteContext";

/**
 * Small hook for components to open/close palette
 */
export default function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  return {
    open: ctx.open,
    close: ctx.close,
    visible: ctx.visible,
    runCommand: ctx.runCommand,
    commands: ctx.commands,
    history: ctx.history
  };
}
