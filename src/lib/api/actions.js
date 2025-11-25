export async function runAction(action) {
  return await window.electron.invoke("action:run", action);
}
