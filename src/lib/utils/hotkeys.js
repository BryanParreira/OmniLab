export function registerHotkey() {
  window.electron.invoke("hotkey:register");
}

export function unregisterHotkey() {
  window.electron.invoke("hotkey:unregister");
}
