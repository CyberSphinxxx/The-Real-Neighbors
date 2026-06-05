import React, { useState, useEffect, useRef } from 'react';
import { History, Plus, Send, Brain, Bot, X } from 'lucide-react';
import { collection, doc, setDoc, getDocs, deleteDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../stores/authStore';
import { useBotbotContext } from '../../hooks/useBotbotContext';
import { callDeepSeekStream, type DeepSeekMessage } from '../../lib/deepseek';
import { Botbot_SYSTEM_PROMPT, getBotbotContextPrompt } from '../../lib/botbotPersonality';

interface Session {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

// Cache state outside component to persist across tab switches in AIPage
let cachedSessions: Session[] | null = null;
let cachedCurrentSessionId: string | null = null;
let cachedMessages: ChatMessage[] | null = null;
let globalCachedContextStr: string | null = null;

export const BotbotChat: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchContext } = useBotbotContext();
  
  const [sessions, setSessions] = useState<Session[]>(cachedSessions || []);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(cachedCurrentSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(cachedMessages || []);
  
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [contextLoaded, setContextLoaded] = useState<boolean | null>(globalCachedContextStr ? true : null);
  const [cachedContextStr, setCachedContextStr] = useState<string>(globalCachedContextStr || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  
  // Load sessions from Firestore
  useEffect(() => {
    if (!user) return;
    if (cachedSessions) return; // Skip if cached
    
    const loadSessions = async () => {
      const q = query(
        collection(db, `aiChats/${user.id}/sessions`),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const loadedSessions = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          messages: data.messages || [],
        } as Session;
      });
      setSessions(loadedSessions);
      cachedSessions = loadedSessions;
    };
    
    loadSessions();
  }, [user]);

  // Load context on mount
  useEffect(() => {
    if (globalCachedContextStr) return; // Skip if cached
    const loadContext = async () => {
      const ctx = await fetchContext();
      if (ctx) {
        const str = getBotbotContextPrompt(ctx);
        setCachedContextStr(str);
        globalCachedContextStr = str;
        setContextLoaded(true);
      } else {
        setContextLoaded(false);
      }
    };
    loadContext();
  }, [fetchContext]);

  // Handle auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMsgPill(false);
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNearBottom) {
      scrollToBottom();
    } else if (messages.length > 0 || streamingContent) {
      setShowNewMsgPill(true);
    }
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    if (isNearBottom) {
      setShowNewMsgPill(false);
    }
  };

  const saveSessionToFirestore = async (sessionId: string, newTitle: string, newMessages: ChatMessage[]) => {
    if (!user) return;
    
    // Trim to 50 max, keeping system if possible (though we don't store system prompt in session usually, only user/assistant)
    const messagesToSave = newMessages.slice(-50);
    
    try {
      await setDoc(doc(db, `aiChats/${user.id}/sessions`, sessionId), {
        title: newTitle,
        messages: messagesToSave,
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      // Update local sessions list
      setSessions(prev => {
        const existing = prev.find(s => s.id === sessionId);
        let newSessions;
        if (existing) {
          newSessions = prev.map(s => s.id === sessionId ? { ...s, title: newTitle, messages: messagesToSave } : s);
        } else {
          newSessions = [{ id: sessionId, title: newTitle, messages: messagesToSave, createdAt: Date.now() }, ...prev].slice(0, 20); // Keep max 20 in state
        }
        cachedSessions = newSessions;
        return newSessions;
      });
    } catch (err) {
      console.error("Failed to save session", err);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    cachedCurrentSessionId = null;
    setMessages([]);
    cachedMessages = [];
    setError(null);
    setStreamingContent('');
    setIsStreaming(false);
  };

  const loadSession = (session: Session) => {
    setCurrentSessionId(session.id);
    cachedCurrentSessionId = session.id;
    setMessages(session.messages);
    cachedMessages = session.messages;
    setError(null);
    setStreamingContent('');
    setIsStreaming(false);
    setShowHistory(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, `aiChats/${user.id}/sessions`, sessionId));
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        startNewSession();
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    cachedMessages = updatedMessages;
    setInput('');
    setIsStreaming(true);
    setError(null);
    setStreamingContent('');

    // Determine session ID and title
    const isNewSession = !currentSessionId;
    const sessionId = currentSessionId || Date.now().toString();
    const title = isNewSession ? text.trim().substring(0, 40) : (sessions.find(s => s.id === sessionId)?.title || 'Chat');
    
    if (isNewSession) {
      setCurrentSessionId(sessionId);
      cachedCurrentSessionId = sessionId;
    }

    // Save initial user message
    await saveSessionToFirestore(sessionId, title, updatedMessages);

    // Build DeepSeek messages
    const apiMessages: DeepSeekMessage[] = [
      { role: 'system', content: `${Botbot_SYSTEM_PROMPT}\n\n${cachedContextStr}` }
    ];
    
    // Add conversation history (up to last 10 for context window limit)
    updatedMessages.slice(-10).forEach(m => {
      apiMessages.push({ role: m.role, content: m.content });
    });

    let currentStreamText = '';
    
    await callDeepSeekStream(
      apiMessages,
      (chunk) => {
        currentStreamText += chunk;
        setStreamingContent(currentStreamText);
      },
      async () => {
        setIsStreaming(false);
        const finalContent = currentStreamText;
        setStreamingContent('');
        
        const newAsstMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalContent,
          createdAt: Date.now(),
        };
        
        const finalMessages = [...updatedMessages, newAsstMsg];
        setMessages(finalMessages);
        cachedMessages = finalMessages;
        await saveSessionToFirestore(sessionId, title, finalMessages);
      },
      (errMsg) => {
        setIsStreaming(false);
        setStreamingContent('');
        setError(errMsg);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Group messages by date
  const groupedMessages: { dateLabel: string, msgs: ChatMessage[] }[] = [];
  let currentGroupLabel = '';
  
  messages.forEach(msg => {
    const msgDate = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let label = '';
    if (msgDate.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (label !== currentGroupLabel) {
      currentGroupLabel = label;
      groupedMessages.push({ dateLabel: label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  });

  const currentSessionTitle = currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : '';

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Header — matches Chat page MessageArea header */}
      <div className="h-14 border-b border-border-subtle flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-on-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-surface rounded-full" />
          </div>
          <div>
            <h2 className="font-semibold text-main text-base leading-none">Botbot</h2>
            {currentSessionTitle && (
              <p className="text-xs text-faint mt-0.5 truncate max-w-[200px]">{currentSessionTitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Chat history"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              showHistory ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-elevated'
            }`}
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={startNewSession}
            title="New chat"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-elevated transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area — matches Chat page scroll container */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col relative"
      >
        {messages.length === 0 && !isStreaming ? (
          /* Empty state — matches Chat page welcome block */
          <div className="flex-1 flex flex-col justify-end mb-8 pl-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-main mb-2">Ay oo, andito na ko 👀</h1>
            <p className="text-muted mb-6">Anong kailangan mo pre?</p>
            <div className="flex flex-wrap gap-2 max-w-2xl">
              {[
                "Anong nangyari sa group ngayon?",
                "What should I watch next?",
                "Catch me up sa feed",
                "Roast me",
                "Make me a caption"
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="bg-surface border border-border-subtle rounded-xl px-4 py-2 text-sm text-muted hover:bg-elevated hover:text-main hover:border-border transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list — matches Chat page message list pattern */
          <div className="min-h-full flex flex-col justify-end">
            <div className="pb-2">
              {groupedMessages.map(group => (
                <React.Fragment key={group.dateLabel}>
                  {/* Date separator — matches Chat page style */}
                  <div className="flex items-center justify-center my-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-subtle" />
                    </div>
                    <div className="relative bg-base px-4 py-1 rounded-full border border-border-subtle text-xs font-semibold text-faint">
                      {group.dateLabel}
                    </div>
                  </div>
                  {group.msgs.map(msg => (
                    <div key={msg.id} className={`flex flex-col mb-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-start gap-2 max-w-[80%]">
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-on-primary" />
                          </div>
                          <div className="bg-surface border border-border-subtle text-main rounded-xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm">
                            {msg.content}
                          </div>
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="bg-primary text-on-primary rounded-xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap break-words shadow-sm">
                          {msg.content}
                        </div>
                      )}
                      <span className={`text-faint text-[10px] mt-1 ${msg.role === 'user' ? 'mr-1' : 'ml-9'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {/* Streaming indicator */}
              {isStreaming && (
                <div className="flex items-start gap-2 max-w-[80%] mb-1">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-on-primary" />
                  </div>
                  <div className="bg-surface border border-border-subtle text-main rounded-xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm min-h-[40px] flex items-center">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse rounded-sm" />
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex items-start gap-2 max-w-[80%] mb-1">
                  <div className="w-7 h-7 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-danger" />
                  </div>
                  <div className="bg-danger/10 text-danger border border-danger/20 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm flex flex-col gap-2">
                    <span>{error}</span>
                    <button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) {
                          setMessages(prev => prev.filter(m => m.id !== lastUserMsg.id));
                          handleSend(lastUserMsg.content);
                        }
                      }}
                      className="self-start text-xs font-semibold text-danger hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>
        )}

        {/* New Message Pill */}
        {showNewMsgPill && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10"
          >
            &darr; New message
          </button>
        )}
      </div>

      {/* Input Area — matches Chat page ChatInput style */}
      <div className="p-4 bg-base flex flex-col gap-2">
        <div className="relative flex items-end bg-surface border border-border-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Botbot... 💬"
            className="w-full bg-transparent text-main placeholder:text-faint resize-none outline-none py-3 px-4 max-h-[120px] custom-scrollbar text-sm"
            rows={1}
            style={{ height: `${Math.max(44, Math.min(120, input.split('\n').length * 20 + 24))}px` }}
          />
          <div className="flex items-center p-2 flex-shrink-0">
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-lg bg-primary text-on-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <Brain className="w-3 h-3 text-faint" />
          <span className="text-faint text-[11px]">
            {contextLoaded === true ? 'Group context loaded' : contextLoaded === false ? 'No context' : 'Loading context...'}
          </span>
        </div>
      </div>

      {/* History Panel — absolute overlay */}
      {showHistory && (
        <div className="w-[260px] h-full bg-surface border-l border-border-subtle flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-[-8px_0_24px_rgba(0,0,0,0.15)]">
          <div className="h-14 border-b border-border-subtle flex items-center justify-between px-4 flex-shrink-0">
            <span className="font-semibold text-sm text-main">Chat History</span>
            <button onClick={() => setShowHistory(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-elevated transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1">
            {sessions.length === 0 ? (
              <div className="text-center text-muted text-xs p-6">
                No past chats yet.<br />Start one! 💬
              </div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className={`flex flex-col p-3 rounded-lg cursor-pointer group transition-colors ${
                    currentSessionId === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-elevated'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm truncate pr-2 flex-1 ${currentSessionId === s.id ? 'text-primary font-medium' : 'text-main'}`}>
                      {s.title || 'New Chat'}
                    </span>
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger p-1 rounded transition-all -mr-1 -mt-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-faint mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
