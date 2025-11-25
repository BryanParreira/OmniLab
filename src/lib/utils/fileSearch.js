export async function searchFiles(query) {
  if (!query) return [];
  return await window.electron.invoke("files:search", query);
}
