"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, Paperclip, History } from "@/components/icons";

export default function ChatInterface({ userName }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      try {
        setConversationHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length <= 1) return; // Don't save if only greeting exists

    const timer = setTimeout(() => {
      const firstUserMessage = messages.find(m => m.role === "user");
      if (!firstUserMessage) return;

      const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
      const conversationData = {
        id: currentConversationId || Date.now(),
        title,
        messages,
        lastUpdated: new Date().toISOString()
      };

      setConversationHistory(prev => {
        const filtered = prev.filter(c => c.id !== conversationData.id);
        const updated = [conversationData, ...filtered].slice(0, 20); // Keep last 20 conversations
        localStorage.setItem("chatHistory", JSON.stringify(updated));
        return updated;
      });

      if (!currentConversationId) {
        setCurrentConversationId(conversationData.id);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, currentConversationId]);

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm here to help you find books and answer questions about literature. What can I help you with today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setConversationHistory(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem("chatHistory", JSON.stringify(updated));
      return updated;
    });
    if (currentConversationId === id) {
      startNewConversation();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Send to Gemini API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1) // Exclude initial greeting
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Chat Header */}
      <div className="border-b border-zinc-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">LibraAI Assistant</h1>
              <p className="text-sm text-zinc-500">Ask me anything about literature</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            aria-label="Chat history"
          >
            <History className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowHistory(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col">
            <div className="border-b border-zinc-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-900">Chat History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={startNewConversation}
                className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition"
              >
                + New Conversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversationHistory.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No conversation history yet</p>
              ) : (
                conversationHistory.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`group p-3 rounded-lg border cursor-pointer transition ${
                      currentConversationId === conv.id
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-900 truncate">{conv.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(conv.lastUpdated).toLocaleDateString()} • {conv.messages.length} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition"
                        aria-label="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === "user" 
                ? "bg-zinc-900 text-white" 
                : "bg-zinc-100 text-zinc-800"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className={`mt-1 block text-xs ${
                msg.role === "user" ? "text-zinc-400" : "text-zinc-500"
              }`}>
                {msg.timestamp}
              </span>
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
                <span className="text-xs font-semibold">{userName?.[0] || "U"}</span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="max-w-[70%] rounded-2xl bg-zinc-100 px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-200 p-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
