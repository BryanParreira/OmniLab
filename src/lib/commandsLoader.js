/**
 * loads commands from src/data/commands.json + enriches them
 * we also inject icon paths (local assets) and some helper defaults
 */
import commandsJson from "../data/commands.json";

const localIconBase = "/mnt/data/LUMINA-APP/assets/icons"; // absolute path we created earlier

function enrich(cmd) {
  const copy = { ...cmd };
  if (!copy.icon && copy.iconName) {
    copy.icon = `${localIconBase}/${copy.iconName}`;
  }
  // normalize keywords & examples
  copy.keywords = copy.keywords || "";
  copy.examples = copy.examples || [];
  return copy;
}

export default async function loadCommands() {
  // if commandsJson is available, just map
  try {
    return commandsJson.map(enrich);
  } catch (e) {
    console.warn("commandsLoader fallback", e);
    return [];
  }
}
