import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Square,
  Copy,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Bot,
  User as UserIcon,
  Search,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { streamChat, extractTasks, summarizeConversationApi, configureGeminiKeyApi } from '../services/api';
import { ChatMessage, Conversation, ChatMode, ExtractedTask } from '../types';
import {
  getConversations,
  saveConversation,
  deleteConversation,
  getMessages,
  saveMessages,
} from '../services/storage';
import { TaskExtractionCard } from '../components/chat/TaskExtractionCard';

interface ChatProps {
  initialPrompt?: string;
  initialMode?: ChatMode;
}

export const Chat: React.FC<ChatProps> = ({
  initialPrompt,
  initialMode = 'GENERAL',
}) => {
  const { user, idToken } = useAuth();
  const { setAiState, memories, addTasksFromExtraction, autoSummarize } = useLifeOS();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentMode, setCurrentMode] = useState<ChatMode>(initialMode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editedConvTitle, setEditedConvTitle] = useState('');
  const [detectedTasks, setDetectedTasks] = useState<ExtractedTask[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyMessage, setKeyMessage] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  const handleConnectKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeyLoading(true);
    setKeyMessage('');
    try {
      const res = await configureGeminiKeyApi(apiKeyInput.trim(), 'gemini-1.5-flash', idToken);
      setKeyMessage(res.message || '✅ Connected to Google Gemini successfully!');
      setTimeout(() => {
        setShowKeyModal(false);
        setKeyMessage('');
        setApiKeyInput('');
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setKeyMessage(`❌ ${error.message}`);
    } finally {
      setKeyLoading(false);
    }
  };

  const stopStreamRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load user conversations on mount
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const list = await getConversations(user.uid);
      setConversations(list);
      if (list.length > 0) {
        setActiveConvId(list[0].id);
        const msgs = await getMessages(user.uid, list[0].id);
        setMessages(msgs);
      } else {
        // Create initial default conversation
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: 'Strategic Synthesis & Planning',
          mode: 'GENERAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 1,
        };
        const initialMsg: ChatMessage = {
          id: `msg-init-${Date.now()}`,
          role: 'assistant',
          content: 'Greetings. I am Gemini LifeOS. Your cognitive workspace and multi-turn companion are ready. How would you like to direct our focus today?',
          timestamp: new Date().toISOString(),
          mode: 'GENERAL',
        };
        await saveConversation(user.uid, newConv);
        await saveMessages(user.uid, newConv.id, [initialMsg]);
        setConversations([newConv]);
        setActiveConvId(newConv.id);
        setMessages([initialMsg]);
      }
    })();
  }, [user?.uid]);

  // Handle initialPrompt if passed from Dashboard
  useEffect(() => {
    if (initialPrompt && activeConvId && !isGenerating) {
      handleSend(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSelectConversation = async (convId: string) => {
    if (!user?.uid || convId === activeConvId) return;
    setActiveConvId(convId);
    const msgs = await getMessages(user.uid, convId);
    setMessages(msgs);
    const conv = conversations.find(c => c.id === convId);
    if (conv) setCurrentMode(conv.mode);
  };

  const handleCreateNewConversation = async () => {
    if (!user?.uid) return;
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: `New ${currentMode.toLowerCase()} session`,
      mode: currentMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    await saveConversation(user.uid, newConv);
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setMessages([]);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    await deleteConversation(user.uid, convId);
    const remaining = conversations.filter(c => c.id !== convId);
    setConversations(remaining);
    if (activeConvId === convId) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
        const msgs = await getMessages(user.uid, remaining[0].id);
        setMessages(msgs);
      } else {
        setActiveConvId('');
        setMessages([]);
      }
    }
  };

  const handleRenameConversation = async (convId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !editedConvTitle.trim()) return;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const updated = { ...conv, title: editedConvTitle.trim(), updatedAt: new Date().toISOString() };
    await saveConversation(user.uid, updated);
    setConversations(prev => prev.map(c => c.id === convId ? updated : c));
    setEditingConvId(null);
  };

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || inputMessage.trim();
    if (!text || isGenerating || !user?.uid || !activeConvId) return;

    setInputMessage('');
    setIsGenerating(true);
    setAiState('THINKING');
    setDetectedTasks([]);

    // 1. Create and append user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      mode: currentMode,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // 2. Prepare assistant placeholder
    const assistantMsgId = `msg-asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      mode: currentMode,
    };
    setMessages([...newMessages, assistantPlaceholder]);

    // Format memories string for prompt grounding
    const activeMemories = memories.map(m => `[${m.category}]: ${m.content}`);

    // Check for task extraction in the user message
    extractTasks(text, idToken).then(tasks => {
      if (tasks && tasks.length > 0) {
        setDetectedTasks(tasks);
      }
    });

    let streamedAccumulator = '';

    const stopFn = await streamChat(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      currentMode,
      activeMemories,
      idToken,
      (chunk) => {
        setAiState('RESPONDING');
        streamedAccumulator += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: streamedAccumulator } : m)
        );
      },
      async () => {
        setIsGenerating(false);
        setAiState('IDLE');

        // Persist messages
        const finalizedMessages = [...newMessages, { ...assistantPlaceholder, content: streamedAccumulator }];
        await saveMessages(user.uid, activeConvId, finalizedMessages);

        // Update conversation metadata
        const conv = conversations.find(c => c.id === activeConvId);
        if (conv) {
          const updatedConv: Conversation = {
            ...conv,
            updatedAt: new Date().toISOString(),
            messageCount: finalizedMessages.length,
            title: conv.title.startsWith('New ') ? text.slice(0, 30) : conv.title,
          };
          await saveConversation(user.uid, updatedConv);
          setConversations(prev => prev.map(c => c.id === activeConvId ? updatedConv : c));

          // Auto-summarize if message count threshold met
          if (autoSummarize && finalizedMessages.length >= 6 && finalizedMessages.length % 4 === 0) {
            summarizeConversationApi(finalizedMessages, idToken).then(async (summaryRes) => {
              if (summaryRes?.summary) {
                updatedConv.summary = summaryRes.summary;
                await saveConversation(user.uid, updatedConv);
              }
            });
          }
        }
      },
      (error) => {
        console.error('Stream error:', error);
        setIsGenerating(false);
        setAiState('ERROR');
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: 'Communication interrupted. Please verify backend connection.' } : m)
        );
      }
    );

    stopStreamRef.current = stopFn;
  };

  const handleStopGeneration = () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      setIsGenerating(false);
      setAiState('IDLE');
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isGenerating) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages(prev => prev.slice(0, -1));
      handleSend(lastUserMsg.content);
    }
  };

  const chatModes: Array<{ id: ChatMode; label: string; desc: string }> = [
    { id: 'GENERAL', label: 'General', desc: 'Holistic multi-turn intelligence' },
    { id: 'JOURNAL', label: 'Journal', desc: 'Empathetic introspection companion' },
    { id: 'BRAINSTORM', label: 'Brainstorm', desc: 'Divergent lateral thinking' },
    { id: 'REFLECTION', label: 'Reflection', desc: 'Philosophical self-examination' },
    { id: 'GOALS', label: 'Goals', desc: 'Execution roadmap architect' },
    { id: 'STUDY', label: 'Study', desc: 'First-principles deep learning' },
    { id: 'PLANNING', label: 'Planning', desc: 'High-leverage agenda director' },
  ];

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-6rem)] max-w-7xl mx-auto w-full gap-4 overflow-hidden">
      {/* Conversations Drawer Sidebar */}
      <div className="w-full md:w-72 bg-space-950/70 border border-cyan-500/15 rounded-2xl flex flex-col overflow-hidden glass-panel flex-shrink-0">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-cyan tracking-wider">Conversations</span>
            <button
              onClick={handleCreateNewConversation}
              className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan hover:bg-cyan-500/25 transition"
              title="New Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat history..."
              className="w-full px-2.5 py-1.5 pl-8 rounded-xl bg-space-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
              >
                {editingConvId === conv.id ? (
                  <form onSubmit={(e) => handleRenameConversation(conv.id, e)} className="flex-1 flex gap-1">
                    <input
                      type="text"
                      value={editedConvTitle}
                      onChange={(e) => setEditedConvTitle(e.target.value)}
                      className="w-full px-1.5 py-0.5 rounded bg-space-950 border border-cyan text-white text-xs outline-none"
                      autoFocus
                    />
                    <button type="submit" className="text-cyan text-xs">Save</button>
                  </form>
                ) : (
                  <>
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate font-medium">{conv.title}</p>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {conv.mode} • {conv.messageCount || 0} msgs
                      </span>
                    </div>

                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditedConvTitle(conv.title);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-space-950/70 border border-cyan-500/15 rounded-2xl overflow-hidden glass-panel">
        {/* Mode Selector Strip */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-space-900/60 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-mono text-slate-400 px-2 flex-shrink-0">MODE:</span>
            {chatModes.map((m) => (
              <button
                key={m.id}
                onClick={() => setCurrentMode(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition flex-shrink-0 ${
                  currentMode === m.id
                    ? 'bg-cyan-500/20 text-cyan border border-cyan-500/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan text-xs font-mono hover:bg-cyan-500/20 transition flex-shrink-0"
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gemini Key</span>
          </button>
        </div>

        {/* Gemini API Key Configuration Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
            <div className="max-w-md w-full p-6 rounded-2xl bg-space-900 border border-cyan-500/40 space-y-4 glass-panel shadow-glow-cyan">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase">
                  <Key className="w-4 h-4 text-cyan" />
                  <span>Connect Google Gemini API</span>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your Gemini API Key for live cloud generation, or continue using the built-in natural conversational AI engine.
              </p>

              <form onSubmit={handleConnectKey} className="space-y-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (Paste Gemini API Key)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-700 text-xs text-white focus:border-cyan outline-none font-mono"
                  autoFocus
                />
                <div className="flex items-center justify-between pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan hover:underline font-mono"
                  >
                    Get Free Gemini Key &rarr;
                  </a>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={keyLoading || !apiKeyInput.trim()}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-40"
                    >
                      {keyLoading ? 'Verifying...' : 'Save & Connect'}
                    </button>
                  </div>
                </div>
                {keyMessage && (
                  <p className="text-xs font-mono text-cyan pt-1">{keyMessage}</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/30 text-white max-w-xl'
                      : 'bg-space-900/90 border border-slate-800 text-slate-200 max-w-2xl'
                  }`}
                >
                  {/* Markdown Renderer */}
                  <div className="markdown-body">
                    {msg.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono py-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan animate-spin" />
                        <span>Gemini synthesising thought...</span>
                      </div>
                    )}
                  </div>

                  {/* Message Meta & Action Bar */}
                  <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!isUser && msg.content && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="hover:text-cyan flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={handleRegenerate}
                          className="hover:text-cyan"
                          title="Regenerate"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0 mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Task Extraction Card */}
          {detectedTasks.length > 0 && (
            <TaskExtractionCard
              tasks={detectedTasks}
              onAddTask={(t) => {
                addTasksFromExtraction([t]);
                setDetectedTasks(prev => prev.filter(item => item.title !== t.title));
              }}
              onIgnoreTask={(idx) => {
                setDetectedTasks(prev => prev.filter((_, i) => i !== idx));
              }}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-space-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Communicate with Gemini in ${currentMode} mode...`}
              disabled={isGenerating}
              className="flex-1 px-4 py-3 rounded-xl bg-space-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-cyan outline-none"
            />

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="px-4 py-3 rounded-xl bg-rose-500 text-white font-medium text-xs hover:bg-rose-600 transition flex items-center gap-1.5"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-5 py-3 rounded-xl bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 transition disabled:opacity-40 flex items-center gap-1.5 shadow-glow-cyan"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
