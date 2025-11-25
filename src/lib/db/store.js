export function getSettings() {
  return window.electron.invoke("settings:get");
}

export function saveSettings(data) {
  return window.electron.invoke("settings:save", data);
}

export function getCommands() {
  return window.electron.invoke("commands:get");
}
