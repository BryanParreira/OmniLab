import { useState, useEffect, useRef, useCallback } from 'react';

export const useOllama = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  
  // We use a ref for the current response to avoid 
  // excessive re-renders during rapid streaming
  const currentResponseRef = useRef(""); 

  // 1. Check connection on mount
  useEffect(() => {
    const checkStatus = async () => {
      // Safety check: prevent crash if running in browser without Electron
      if (window.lumina) {
        const status = await window.lumina.checkOllamaStatus();
        setIsOllamaRunning(status);
      }
    };
    checkStatus();
  }, []);

  // 2. Setup the Stream Listener
  useEffect(() => {
    if (!window.lumina) return;

    // This callback runs every time Electron sends a chunk of text
    const cleanup = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') {
        setIsLoading(false);
        currentResponseRef.current = ""; 
        return;
      }

      // Update the last message in the list with the new chunk
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        // If the last message is from AI, append to it. 
        // If not (unexpected), create new.
        if (lastMsg && lastMsg.role === 'assistant') {
          const updated = { ...lastMsg, content: lastMsg.content + chunk };
          return [...prev.slice(0, -1), updated];
        } else {
          return [...prev, { role: 'assistant', content: chunk }];
        }
      });
    });

    // CLEANUP: Extremely important to prevent memory leaks!
    return () => cleanup(); 
  }, []);

  // 3. Function to send message
  const sendMessage = useCallback((text) => {
    if (!text.trim() || isLoading) return;

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // Add a placeholder for AI immediately (improves perceived speed)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    setIsLoading(true);
    window.lumina.sendPrompt(text, "llama3"); // Defaulting to llama3 for now
  }, [isLoading]);

  return {
    messages,
    sendMessage,
    isLoading,
    isOllamaRunning
  };
};