export async function askOllama(prompt, model = "llama3") {
  const res = await window.electron.invoke("ollama:ask", { prompt, model });
  return res;
}
