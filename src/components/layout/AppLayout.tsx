import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Search,
  Sunrise,
  Sunset,
  Sparkles,
  Target,
  CheckSquare,
  Brain,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Mic,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import { VoiceJournalModal } from '../voice/VoiceJournalModal';
import { GeminiKeyModal } from '../modals/GeminiKeyModal';
import { configureGeminiKeyApi, getAiConfigStatusApi } from '../../services/api';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { user, signOutUser } = useAuth();
  const { entries, goals, tasks, memories, selectedModel } = useLifeOS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
    if (storedKey) {
      setHasGeminiKey(true);
      configureGeminiKeyApi(storedKey, storedModel).catch(() => {});
    } else {
      getAiConfigStatusApi()
        .then(res => {
          if (res?.hasKey) setHasGeminiKey(true);
        })
        .catch(() => {});
    }
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Chat', path: '/chat', icon: MessageSquare, badge: 'Stream' },
    { label: 'Journal', path: '/journal', icon: BookOpen },
    { label: 'Ask My Journal', path: '/ask-journal', icon: Search, badge: 'RAG' },
    { label: 'Morning Brief', path: '/morning-brief', icon: Sunrise },
    { label: 'Daily Reflection', path: '/daily-reflection', icon: Sunset },
    { label: 'Memories', path: '/memories', icon: Brain },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'AI Insights', path: '/insights', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  // Telemetry aggregates
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const recentEntry = entries[0];
  const activeGoals = goals.filter(g => g.progress < 100).slice(0, 3);

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col cyber-grid">
      {/* Top Futuristic HUD Header */}
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-space-950/85 backdrop-blur-xl px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-space-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan shadow-glow-cyan group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-cyan to-purple-400 bg-clip-text text-transparent">
                GEMINI LifeOS
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan border border-cyan-500/20">
                v2.5 Core
              </span>
            </div>
          </div>
        </div>

        {/* Center telemetry indicator & Gemini key trigger */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-space-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">TELEMETRY: SYNCHRONIZED</span>
          </div>

          <button
            onClick={() => setApiKeyModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition cursor-pointer ${
              hasGeminiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-glow-amber'
            }`}
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3 h-3 text-amber-400" />
            <span>{hasGeminiKey ? `Gemini Live: ${selectedModel}` : 'Connect Gemini Key'}</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan text-xs font-mono hover:bg-cyan-500/20 shadow-glow-cyan transition"
            title="Launch Voice Journal"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Voice Journal</span>
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-space-950 font-mono">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[120px]">
                {user?.displayName || 'LifeOS User'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {user?.email || 'authenticated'}
              </p>
            </div>
            <button
              onClick={signOutUser}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-space-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Navigation Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-cyan-500/15 bg-space-950/60 backdrop-blur-lg flex-shrink-0 p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            Navigation Core
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan border border-cyan-500/40 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-space-850 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Security Capsule */}
          <div className="p-3 rounded-xl bg-space-900 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Isolated: {user?.uid.slice(0, 8)}...</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Cloud Firestore rules enforce cryptographic UID boundary.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-space-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-space-900 border-r border-cyan-500/20 p-4 flex flex-col z-10">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="font-bold text-cyan text-sm tracking-wider">NAVIGATION</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-space-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Center Main Stage (Dynamic Page Content) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col">
          {children}
        </main>

        {/* Right Column: Telemetry & Insights HUD (Desktop) */}
        {rightPanelOpen ? (
          <aside className="hidden xl:flex flex-col w-80 border-l border-cyan-500/15 bg-space-950/60 backdrop-blur-lg flex-shrink-0 p-4 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan" />
                <span className="tracking-wider uppercase">Live Telemetry</span>
              </div>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="hover:text-white p-1 rounded"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's Mood Snapshot */}
            <div className="glass-card p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Current Mood State</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan text-[11px] font-mono border border-cyan-500/20">
                  {recentEntry?.mood || 'Reflective'}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic line-clamp-2">
                &ldquo;{recentEntry?.title || 'No recent entries today.'}&rdquo;
              </p>
              {recentEntry?.gratitude && recentEntry.gratitude.length > 0 && (
                <div className="text-[11px] text-emerald-400/90 pt-1 border-t border-slate-800 flex items-center gap-1">
                  <span className="font-semibold">Anchor:</span>
                  <span className="truncate">{recentEntry.gratitude[0]}</span>
                </div>
              )}
            </div>

            {/* Active Goals Trajectory */}
            <div className="glass-card p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">Active Goals ({activeGoals.length})</span>
                <button
                  onClick={() => onNavigate('/goals')}
                  className="text-cyan text-[10px] hover:underline font-mono"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {activeGoals.map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-200">
                      <span className="truncate max-w-[170px]">{g.title}</span>
                      <span className="font-mono text-cyan">{g.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan to-purple-500 transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Tasks Priority Queue */}
            <div className="glass-card p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                  Pending Tasks ({pendingTasks.length})
                </span>
                <button
                  onClick={() => onNavigate('/tasks')}
                  className="text-cyan text-[10px] hover:underline font-mono"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {pendingTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-space-850/80 border border-slate-800/80 text-[11px]"
                  >
                    <span className="text-slate-300 truncate max-w-[160px]">{t.title}</span>
                    {t.deadline && (
                      <span className="text-[10px] font-mono text-amber-400 flex-shrink-0">
                        {t.deadline}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Vault Ticker */}
            <div className="glass-card p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                  Recent Memories ({memories.length})
                </span>
                <button
                  onClick={() => onNavigate('/memories')}
                  className="text-cyan text-[10px] hover:underline font-mono"
                >
                  Vault
                </button>
              </div>
              <div className="space-y-1.5">
                {memories.slice(0, 2).map((m) => (
                  <div key={m.id} className="p-2 rounded-lg bg-space-850/60 border border-slate-800 text-[11px] text-slate-300 line-clamp-2">
                    <span className="text-purple-400 font-mono text-[9px] uppercase block">
                      [{m.category}]
                    </span>
                    {m.content}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="hidden xl:flex items-center justify-center w-8 border-l border-cyan-500/15 bg-space-950/40 text-slate-500 hover:text-cyan hover:bg-space-900 transition"
            title="Expand telemetry panel"
          >
            <TrendingUp className="w-4 h-4 rotate-90" />
          </button>
        )}
      </div>

      {/* Voice Journaling Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onEntrySaved={() => onNavigate('/journal')}
      />

      {/* Gemini API Key Configuration Modal */}
      <GeminiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeyConfigured={() => setHasGeminiKey(true)}
      />
    </div>
  );
};
