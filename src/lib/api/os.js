export async function openPath(path) {
  return await window.electron.invoke("os:openPath", path);
}

export async function openApp(appName) {
  return await window.electron.invoke("os:openApp", appName);
}
