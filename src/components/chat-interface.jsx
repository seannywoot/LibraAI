"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback } from "react";
import { shouldRegenerateTitle, heuristicTitle, buildTitleRequestPayload } from "@/utils/chatTitle";
import { MessageCircle, Send, Paperclip, History, X, Trash2 } from "@/components/icons";

// Helper function to render message content with clickable links
const renderMessageContent = (content) => {
  // Regex to match URLs (including /student/books/... paths)
  const urlRegex = /(https?:\/\/[^\s]+|\/student\/books\/[a-zA-Z0-9]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          className="text-blue-600 hover:text-blue-800 underline font-medium"
          target={part.startsWith('http') ? '_blank' : '_self'}
          rel={part.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ChatInterface({ userName, showHistorySidebar = false }) {
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
  const [autoTitle, setAutoTitle] = useState(null); // improved generated title
  const generatingTitleRef = useRef(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [hasMigrated, setHasMigrated] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [retryQueue, setRetryQueue] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const saveTimerRef = useRef(null);
  const retryTimerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toast notification system
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Retry mechanism for failed operations
  const addToRetryQueue = useCallback((operation, data) => {
    setRetryQueue(prev => [...prev, { operation, data, timestamp: Date.now() }]);
  }, []);

  // Load conversations from database
  const loadConversationsFromDB = useCallback(async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      const response = await fetch('/api/chat/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated, falling back to localStorage');
          showToast('Not authenticated. Using local storage only.', 'warning', 4000);
          return;
        }
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.conversations) {
        // Sort conversations by lastUpdated (most recent first)
        const sortedConversations = data.conversations.sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
        setConversationHistory(sortedConversations);
        // Update localStorage cache
        localStorage.setItem('chatHistory', JSON.stringify(sortedConversations));
      }
    } catch (error) {
      console.error('Error loading conversations from DB:', error);
      setSyncError('Failed to load conversations from server');
      showToast('Failed to load conversations from server. Using local cache.', 'error', 5000);
      // Fall back to localStorage
      const saved = localStorage.getItem('chatHistory');
      if (saved) {
        try {
          const conversations = JSON.parse(saved);
          // Sort conversations by lastUpdated (most recent first)
          const sortedConversations = conversations.sort((a, b) => 
            new Date(b.lastUpdated) - new Date(a.lastUpdated)
          );
          setConversationHistory(sortedConversations);
        } catch (e) {
          console.error('Failed to load from localStorage:', e);
          showToast('Failed to load conversations from local storage.', 'error', 5000);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  // Save conversation to database with debouncing
  const saveConversationToDB = useCallback(async (conversationData) => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationData.id,
          title: conversationData.title,
          messages: conversationData.messages,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated, saving to localStorage only');
          showToast('Not authenticated. Saving locally only.', 'warning', 3000);
          return;
        }
        throw new Error(`Failed to save conversation: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update localStorage cache after successful save
        const updated = [conversationData, ...conversationHistory.filter(c => c.id !== conversationData.id)].slice(0, 20);
        localStorage.setItem('chatHistory', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error saving conversation to DB:', error);
      setSyncError('Failed to sync conversation to server');
      showToast('Failed to sync conversation. Saved locally and will retry.', 'error', 5000);
      
      // Add to retry queue
      addToRetryQueue('save', conversationData);
      
      // Still save to localStorage as fallback
      const updated = [conversationData, ...conversationHistory.filter(c => c.id !== conversationData.id)].slice(0, 20);
      localStorage.setItem('chatHistory', JSON.stringify(updated));
    } finally {
      setIsSyncing(false);
    }
  }, [conversationHistory, showToast, addToRetryQueue]);

  // Delete conversation from database
  const deleteConversationFromDB = useCallback(async (conversationId) => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast('Not authenticated. Cannot delete from server.', 'error', 4000);
          throw new Error('User not authenticated');
        }
        if (response.status === 404) {
          console.warn('Conversation not found in database, removing from local state');
          showToast('Conversation not found on server. Removed locally.', 'warning', 3000);
          return true;
        }
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        showToast('Conversation deleted successfully', 'success', 3000);
      }
      return data.success;
    } catch (error) {
      console.error('Error deleting conversation from DB:', error);
      setSyncError('Failed to delete conversation from server');
      showToast('Failed to delete from server. Will retry.', 'error', 5000);
      
      // Add to retry queue
      addToRetryQueue('delete', conversationId);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [showToast, addToRetryQueue]);

  // Process retry queue - defined after save/delete functions to avoid hoisting issues
  const processRetryQueue = useCallback(async () => {
    if (retryQueue.length === 0) return;

    const item = retryQueue[0];
    const timeSinceFailure = Date.now() - item.timestamp;
    
    // Exponential backoff: wait 5s, 15s, 45s before retries
    const retryDelay = Math.min(5000 * Math.pow(3, item.retryCount || 0), 45000);
    
    if (timeSinceFailure < retryDelay) return;

    try {
      if (item.operation === 'save') {
        await saveConversationToDB(item.data);
        setRetryQueue(prev => prev.filter(i => i !== item));
        showToast('Conversation synced successfully', 'success', 3000);
      } else if (item.operation === 'delete') {
        await deleteConversationFromDB(item.data);
        setRetryQueue(prev => prev.filter(i => i !== item));
        showToast('Conversation deleted successfully', 'success', 3000);
      }
    } catch (error) {
      // Increment retry count
      const updatedItem = { ...item, retryCount: (item.retryCount || 0) + 1 };
      
      // Remove if max retries (3) reached
      if (updatedItem.retryCount >= 3) {
        setRetryQueue(prev => prev.filter(i => i !== item));
        showToast('Failed to sync after multiple attempts. Changes saved locally.', 'error', 7000);
      } else {
        setRetryQueue(prev => prev.map(i => i === item ? updatedItem : i));
      }
    }
  }, [retryQueue, saveConversationToDB, deleteConversationFromDB, showToast]);

  // Process retry queue periodically
  useEffect(() => {
    if (retryQueue.length > 0) {
      retryTimerRef.current = setInterval(processRetryQueue, 2000);
    } else if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
      }
    };
  }, [retryQueue, processRetryQueue]);

  // Migrate localStorage conversations to database
  const migrateLocalStorageConversations = useCallback(async () => {
    const migrationKey = 'chatMigrationComplete';
    const migrationComplete = localStorage.getItem(migrationKey);
    
    if (migrationComplete === 'true') {
      setHasMigrated(true);
      return;
    }

    const saved = localStorage.getItem('chatHistory');
    if (!saved) {
      localStorage.setItem(migrationKey, 'true');
      setHasMigrated(true);
      return;
    }

    try {
      const conversations = JSON.parse(saved);
      if (!conversations || conversations.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        setHasMigrated(true);
        return;
      }

      console.log(`Migrating ${conversations.length} conversations to database...`);
      
      // Show migration progress notification
      const migrationToastId = showToast(
        `Migrating ${conversations.length} conversations to database...`,
        'info',
        0 // Don't auto-dismiss
      );
      setIsSyncing(true);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        try {
          const response = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: conv.id,
              title: conv.title,
              messages: conv.messages,
            }),
          });

          if (response.ok) {
            successCount++;
            // Update progress
            dismissToast(migrationToastId);
            showToast(
              `Migrating conversations... ${successCount + failCount}/${conversations.length}`,
              'info',
              0
            );
          } else {
            failCount++;
            console.error(`Failed to migrate conversation ${conv.id}`);
          }
        } catch (error) {
          failCount++;
          console.error(`Error migrating conversation ${conv.id}:`, error);
        }
      }

      console.log(`Migration complete: ${successCount} succeeded, ${failCount} failed`);
      
      // Dismiss progress toast
      dismissToast(migrationToastId);
      
      // Show completion message
      if (successCount > 0 && failCount === 0) {
        showToast(
          `Migration complete! ${successCount} conversations synced successfully.`,
          'success',
          5000
        );
      } else if (successCount > 0 && failCount > 0) {
        showToast(
          `Migration complete: ${successCount} synced, ${failCount} failed. Failed conversations remain in local storage.`,
          'warning',
          7000
        );
      } else {
        showToast(
          'Migration failed. Conversations remain in local storage.',
          'error',
          7000
        );
      }

      // Mark migration as complete even if some failed
      localStorage.setItem(migrationKey, 'true');
      setHasMigrated(true);
    } catch (error) {
      console.error('Error during migration:', error);
      showToast('Migration failed. Conversations remain in local storage.', 'error', 7000);
    } finally {
      setIsSyncing(false);
    }
  }, [showToast, dismissToast]);

  // Load conversation history and current conversation from database first, then localStorage
  useEffect(() => {
    const initializeConversations = async () => {
      // Load from database first
      await loadConversationsFromDB();
      
      // Load current conversation from localStorage
      const currentChat = localStorage.getItem("currentChat");
      if (currentChat) {
        try {
          const { messages: savedMessages, conversationId, title } = JSON.parse(currentChat);
          setMessages(savedMessages);
          setCurrentConversationId(conversationId);
          if (title) setAutoTitle(title);
        } catch (e) {
          console.error("Failed to load current chat:", e);
        }
      }
      
      // Trigger migration if localStorage conversations exist
      if (!hasMigrated) {
        await migrateLocalStorageConversations();
      }
    };
    
    initializeConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("currentChat", JSON.stringify({
        messages,
        conversationId: currentConversationId,
        title: autoTitle
      }));
    }
  }, [messages, currentConversationId, autoTitle]);

  // Auto-save conversation when messages change (with debouncing)
  useEffect(() => {
    if (messages.length <= 1) return; // Don't save if only greeting exists

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const conversationId = currentConversationId || Date.now();
      const fallback = heuristicTitle(messages);
      const title = autoTitle || fallback;
      const conversationData = {
        id: conversationId,
        title,
        messages,
        lastUpdated: new Date().toISOString()
      };

      // Update local state
      setConversationHistory(prev => {
        const filtered = prev.filter(c => c.id !== conversationData.id);
        const updated = [conversationData, ...filtered].slice(0, 20);
        // Sort by lastUpdated (most recent first)
        return updated.sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
      });

      // Save to database
      saveConversationToDB(conversationData);

      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages, currentConversationId, autoTitle, saveConversationToDB]);

  // Title generation & drift detection
  useEffect(() => {
    const userMessages = messages.filter(m=>m.role==='user');
    if (userMessages.length === 0) return;

    const shouldGenerateInitial = !autoTitle && userMessages.length >= 2 && messages.length >= 4;
    const lastMessage = messages[messages.length-1];
    const lastIsUser = lastMessage?.role === 'user';
    const drift = autoTitle && lastIsUser && shouldRegenerateTitle(messages, autoTitle);
    
    if ((!shouldGenerateInitial && !drift) || generatingTitleRef.current) return;

    (async () => {
      try {
        generatingTitleRef.current = true;
        const payload = buildTitleRequestPayload(messages);
        
        console.log('Generating title...', { 
          shouldGenerateInitial, 
          drift, 
          currentTitle: autoTitle,
          messageCount: messages.length 
        });
        
        const res = await fetch('/api/chat/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payload })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.warn('Title API error:', res.status, errorText);
          throw new Error(`Title request failed: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Check if we should use fallback (rate limited or no title)
        if (data.rateLimited || data.useFallback || !data.title || data.title === 'Conversation') {
          if (data.rateLimited) {
            console.log('Title generation rate limited, using heuristic fallback');
          }
          const fallback = heuristicTitle(messages);
          console.log('Using heuristic fallback:', fallback);
          setAutoTitle(fallback);
        } else {
          console.log('Generated title from API:', data.title);
          setAutoTitle(data.title);
        }
      } catch (e) {
        console.warn('Title generation failed, using heuristic:', e.message);
        const fallback = heuristicTitle(messages);
        console.log('Heuristic title:', fallback);
        if (!autoTitle) setAutoTitle(fallback);
      } finally {
        generatingTitleRef.current = false;
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setAutoTitle(conversation.title || null);
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
    setAutoTitle(null);
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

  const openDeleteModal = (conv, e) => {
    e.stopPropagation();
    setConversationToDelete(conv);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      try {
        // Call API to delete from database
        await deleteConversationFromDB(conversationToDelete.id);
        
        // Only update UI state after successful API response
        setConversationHistory(prev => {
          const updated = prev.filter(c => c.id !== conversationToDelete.id);
          localStorage.setItem("chatHistory", JSON.stringify(updated));
          return updated;
        });
        
        if (currentConversationId === conversationToDelete.id) {
          startNewConversation();
        }
      } catch (error) {
        // Show error notification but still allow local deletion
        console.error('Failed to delete from database:', error);
        setSyncError('Failed to delete from server, removed locally');
        
        // Still remove from local state
        setConversationHistory(prev => {
          const updated = prev.filter(c => c.id !== conversationToDelete.id);
          localStorage.setItem("chatHistory", JSON.stringify(updated));
          return updated;
        });
        
        if (currentConversationId === conversationToDelete.id) {
          startNewConversation();
        }
      }
    }
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
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
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFilePreview(null);
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
    const fileType = attachedFile?.type;
    const currentFilePreview = filePreview;
    
    // Save last user message for up arrow recall
    if (userMessage && userMessage !== "Uploaded a file") {
      setLastUserMessage(userMessage);
    }
    
    setInput("");
    const fileToUpload = attachedFile;
    setAttachedFile(null);
    setFilePreview(null);
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
      fileType,
      filePreview: currentFilePreview,
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
      console.log("AI Response:", data);

      if (data.success && data.message) {
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
        throw new Error(data.error || "No response from AI");
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

  // Cleanup typing interval and save timer on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
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
    <>
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="border-b border-zinc-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">{autoTitle || 'LibraAI Assistant'}</h1>
                <p className="text-sm text-zinc-500">{autoTitle ? 'Topic • Auto‑generated' : 'Ask me anything about literature'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewConversation}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition"
              >
                + New Chat
              </button>
              {!showHistorySidebar && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50"
                  aria-label="Chat history"
                >
                  <History className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Sidebar Overlay (only when not using persistent sidebar) */}
        {!showHistorySidebar && showHistory && (
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
                          onClick={(e) => openDeleteModal(conv, e)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition"
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" />
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
                <div className="mb-2">
                  {msg.filePreview && msg.fileType?.startsWith('image/') ? (
                    <div className="mb-2">
                      <img 
                        src={msg.filePreview} 
                        alt={msg.fileName}
                        className="max-w-full h-auto rounded-lg border border-zinc-300 max-h-64 object-contain"
                      />
                      <div className={`mt-1 flex items-center gap-2 text-xs ${
                        msg.role === "user" ? "text-zinc-300" : "text-zinc-600"
                      }`}>
                        <Paperclip className="h-3 w-3" />
                        <span>{msg.fileName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 text-xs ${
                      msg.role === "user" ? "text-zinc-300" : "text-zinc-600"
                    }`}>
                      <Paperclip className="h-3 w-3" />
                      <span>{msg.fileName}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">
                {renderMessageContent(msg.content)}
              </div>
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
                <div className="text-sm whitespace-pre-wrap inline">
                  {renderMessageContent(typingMessage)}
                </div>
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
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            {filePreview && attachedFile.type.startsWith('image/') && (
              <img 
                src={filePreview} 
                alt="Preview"
                className="h-16 w-16 rounded object-cover border border-zinc-300"
              />
            )}
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
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-50 min-h-10 max-h-[120px]"
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

      {/* Persistent History Sidebar */}
      {showHistorySidebar && (
        <div className="w-80 border-l border-zinc-200 bg-zinc-50 flex flex-col">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">Chat History</h2>
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
                      ? "border-zinc-900 bg-white shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
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
                      onClick={(e) => openDeleteModal(conv, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={cancelDelete}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  Delete Conversation?
                </h3>
                <p className="text-sm text-zinc-600 mb-1">
                  Are you sure you want to delete this conversation?
                </p>
                {conversationToDelete && (
                  <p className="text-sm font-medium text-zinc-900 mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                    {conversationToDelete.title}
                  </p>
                )}
                <p className="text-sm text-zinc-500 mt-3">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-medium hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-start gap-2">
                {toast.type === 'success' && (
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <p className="text-sm font-medium flex-1">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sync Status Indicator */}
      {isSyncing && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl shadow-lg">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span className="text-sm text-zinc-600 font-medium">Syncing...</span>
          </div>
        </div>
      )}

      {/* Retry Queue Indicator */}
      {retryQueue.length > 0 && (
        <div className="fixed bottom-16 left-4 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl shadow-lg">
            <svg className="h-4 w-4 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-amber-800 font-medium">
              {retryQueue.length} operation{retryQueue.length > 1 ? 's' : ''} pending retry
            </span>
          </div>
        </div>
      )}
    </>
  );
}
