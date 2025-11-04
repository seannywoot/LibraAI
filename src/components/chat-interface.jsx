"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, Paperclip, History, X } from "@/components/icons";

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
  const [attachedFile, setAttachedFile] = useState(null);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history and current conversation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      try {
        setConversationHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }

    // Load current conversation
    const currentChat = localStorage.getItem("currentChat");
    if (currentChat) {
      try {
        const { messages: savedMessages, conversationId } = JSON.parse(currentChat);
        setMessages(savedMessages);
        setCurrentConversationId(conversationId);
      } catch (e) {
        console.error("Failed to load current chat:", e);
      }
    }
  }, []);

  // Save current conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("currentChat", JSON.stringify({
        messages,
        conversationId: currentConversationId
      }));
    }
  }, [messages, currentConversationId]);

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
    // Clear current chat from localStorage
    localStorage.removeItem("currentChat");
  };

  // Stop typing animation
  const stopTyping = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    
    // Add a message showing the response was stopped
    const partialContent = typingMessage || "...";
    const stoppedMessage = {
      role: "assistant",
      content: partialContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stopped: true,
    };
    setMessages(prev => [...prev, stoppedMessage]);
    
    setIsTyping(false);
    setTypingMessage("");
    setIsLoading(false);
  }, [typingMessage]);

  // Typing animation effect
  const typeMessage = useCallback((fullMessage, callback) => {
    setIsTyping(true);
    setTypingMessage("");
    setIsLoading(false); // Turn off loading when typing starts
    let index = 0;
    
    const typingSpeed = 10; // milliseconds per character (faster)
    
    typingIntervalRef.current = setInterval(() => {
      if (index < fullMessage.length) {
        setTypingMessage(fullMessage.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        setTypingMessage("");
        callback();
      }
    }, typingSpeed);
  }, []);

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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setAttachedFile(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = input.trim() || "Uploaded a file";
    const hasFile = !!attachedFile;
    const fileName = attachedFile?.name;
    
    // Save last user message for up arrow recall
    if (userMessage && userMessage !== "Uploaded a file") {
      setLastUserMessage(userMessage);
    }
    
    setInput("");
    const fileToUpload = attachedFile;
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Add user message
    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasFile,
      fileName,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      let requestBody;
      let headers = {};

      if (fileToUpload) {
        // Send as FormData if file is attached
        const formData = new FormData();
        formData.append('message', userMessage);
        formData.append('file', fileToUpload);
        formData.append('history', JSON.stringify(messages.slice(1)));
        formData.append('conversationId', currentConversationId || '');
        requestBody = formData;
      } else {
        // Send as JSON if no file
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          message: userMessage,
          history: messages.slice(1),
          conversationId: currentConversationId
        });
      }

      // Send to Gemini API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: requestBody,
      });

      const data = await response.json();

      if (data.success) {
        // Use typing animation for AI response
        typeMessage(data.message, () => {
          const aiMessage = {
            role: "assistant",
            content: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false); // Ensure loading is off after message is added
        });
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
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Up arrow to recall last message when input is empty or cursor at start
    if (e.key === "ArrowUp" && !input.trim() && lastUserMessage) {
      e.preventDefault();
      setInput(lastUserMessage);
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
          <div className="flex items-center gap-2">
            <button
              onClick={startNewConversation}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition"
            >
              + New Chat
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
              aria-label="Chat history"
            >
              <History className="h-5 w-5" />
            </button>
          </div>
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Chat History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  ✕
                </button>
              </div>
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
                : msg.stopped
                ? "bg-amber-50 border border-amber-200 text-zinc-800"
                : "bg-zinc-100 text-zinc-800"
            }`}>
              {msg.hasFile && (
                <div className={`mb-2 flex items-center gap-2 text-xs ${
                  msg.role === "user" ? "text-zinc-300" : "text-zinc-600"
                }`}>
                  <Paperclip className="h-3 w-3" />
                  <span>{msg.fileName}</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.stopped && (
                <div className="mt-2 pt-2 border-t border-amber-300">
                  <p className="text-xs text-amber-700 italic flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Response stopped by user
                  </p>
                </div>
              )}
              <span className={`mt-1 block text-xs ${
                msg.role === "user" ? "text-zinc-400" : msg.stopped ? "text-amber-600" : "text-zinc-500"
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
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="max-w-[70%] rounded-2xl bg-zinc-100 px-4 py-3">
              <div className="flex items-start">
                <p className="text-sm whitespace-pre-wrap inline">{typingMessage}</p>
                <span className="inline-block w-0.5 h-4 bg-zinc-800 animate-pulse ml-0.5 mt-0.5"></span>
              </div>
            </div>
          </div>
        )}
        {isLoading && !isTyping && (
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
        {attachedFile && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {attachedFile.name}
              </p>
              <p className="text-xs text-zinc-500">
                {(attachedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={removeAttachment}
              className="text-zinc-400 hover:text-red-600 transition"
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center">
            <textarea
              ref={textareaRef}
              placeholder={attachedFile ? "Add a message (optional)..." : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading || isTyping}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50 min-h-[40px] max-h-[120px]"
              style={{ height: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          {(isLoading || isTyping) ? (
            <button
              type="button"
              onClick={stopTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700"
              aria-label="Stop generating"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
