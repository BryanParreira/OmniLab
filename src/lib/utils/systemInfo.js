export async function getSystemInfo() {
  return await window.electron.invoke("system:info");
}
