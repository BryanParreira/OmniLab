export async function runCommand(id) {
  return await window.electron.invoke("command:run", id);
}
