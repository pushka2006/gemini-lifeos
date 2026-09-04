import React, { useState } from 'react';
import {
  Mic,
  PenTool,
  Lightbulb,
  Brain,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { AiOrb } from '../components/orb/AiOrb';
import { VoiceJournalModal } from '../components/voice/VoiceJournalModal';

interface DashboardProps {
  onNavigate: (path: string) => void;
  onQuickChatPrompt?: (prompt: string, mode?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onQuickChatPrompt,
}) => {
  const { user } = useAuth();
  const { aiState, entries, goals, tasks, memories } = useLifeOS();
  const [quickInput, setQuickInput] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    if (onQuickChatPrompt) {
      onQuickChatPrompt(quickInput.trim(), 'GENERAL');
    }
    onNavigate('/chat');
  };

  const handleActionClick = (mode: string, route: string) => {
    if (route === 'VOICE') {
      setVoiceModalOpen(true);
      return;
    }
    if (mode && onQuickChatPrompt) {
      onQuickChatPrompt(`Initiating ${mode.toLowerCase()} mode with Gemini.`, mode);
    }
    onNavigate(route);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr) || entries[0];
  const activeGoals = goals.filter(g => g.progress < 100);
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto w-full">
      {/* Top Banner: Personal Workspace HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel-glow border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan uppercase tracking-widest">
              Neural Environment • Authenticated
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
            Welcome back, {user?.displayName || 'LifeOS User'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Gemini LifeOS is monitoring your cognitive trajectory, goals, and daily reflections. All user memories are cryptographically isolated.
          </p>
        </div>

        {/* Quick Launch Morning Brief / Reflection Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('/morning-brief')}
            className="px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Morning Brief</span>
          </button>
          <button
            onClick={() => onNavigate('/daily-reflection')}
            className="px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 hover:border-purple-500/40 text-xs font-medium text-slate-200 transition flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Evening Reflection</span>
          </button>
        </div>
      </div>

      {/* Main Center Panel: Animated AI Core & Interactive Command Bar */}
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl glass-panel relative overflow-hidden border-cyan-500/20">
        {/* Background ambient radial gradients */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Animated AI Orb */}
        <div className="relative z-10 mb-2">
          <AiOrb
            state={aiState}
            size={220}
            interactive={true}
            onClick={() => onNavigate('/chat')}
          />
        </div>

        {/* Prompt Header */}
        <div className="text-center z-10 space-y-1 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            &ldquo;How can I assist your life trajectory today?&rdquo;
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            VOICE • JOURNALING • STRATEGIC BRAINSTORMING • INSIGHTS
          </p>
        </div>

        {/* Quick Command Input Form */}
        <form
          onSubmit={handleQuickSubmit}
          className="w-full max-w-xl z-10 relative mb-6"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Talk to your AI... (e.g. 'Synthesize my goals for this week')"
              className="w-full px-5 py-3.5 pl-11 pr-24 rounded-2xl bg-space-950/80 border border-cyan-500/30 text-slate-100 placeholder:text-slate-500 text-sm focus:border-cyan focus:ring-1 focus:ring-cyan outline-none shadow-glow-cyan backdrop-blur-md transition-all"
            />
            <Sparkles className="w-4 h-4 text-cyan absolute left-4 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan to-purple-600 text-space-950 font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-md"
            >
              <span>Transmit</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Core Mode Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 z-10">
          <button
            onClick={() => handleActionClick('VOICE', 'VOICE')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan text-xs font-medium hover:bg-cyan-500/10 hover:border-cyan transition shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>🎙 Voice Journal</span>
          </button>
          <button
            onClick={() => handleActionClick('JOURNAL', '/journal')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-900 border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:border-cyan-500/40 hover:bg-space-850 transition"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>✍ Journal</span>
          </button>
          <button
            onClick={() => handleActionClick('BRAINSTORM', '/chat')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-900 border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:border-purple-500/40 hover:bg-space-850 transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>💡 Brainstorm</span>
          </button>
          <button
            onClick={() => handleActionClick('REFLECTION', '/daily-reflection')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-900 border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:border-rose-500/40 hover:bg-space-850 transition"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>🧠 Reflect</span>
          </button>
          <button
            onClick={() => handleActionClick('GOALS', '/goals')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-900 border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:border-cyan-500/40 hover:bg-space-850 transition"
          >
            <Target className="w-3.5 h-3.5 text-cyan" />
            <span>🎯 Goals</span>
          </button>
        </div>
      </div>

      {/* Dashboard Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Today's Journal & Mood */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Today&apos;s Journal</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan text-[11px] font-mono border border-cyan-500/20">
                {todayEntry?.mood || 'Reflective'}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold text-white line-clamp-1">
                {todayEntry?.title || 'No entry logged yet today'}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {todayEntry?.summary || todayEntry?.rawContent || 'Capture your thoughts, victories, or voice notes to receive psychological analysis and task extraction.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan" />
              <span>{todayEntry?.date || todayStr}</span>
            </span>
            <button
              onClick={() => onNavigate('/journal')}
              className="text-xs text-cyan hover:underline flex items-center gap-1 font-mono"
            >
              <span>{todayEntry ? 'Open Entry' : 'Write Now'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Active Goals & Progress */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>Active Goals ({activeGoals.length})</span>
              </span>
              <button
                onClick={() => onNavigate('/goals')}
                className="text-[11px] text-purple-400 hover:underline font-mono"
              >
                Manage
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {activeGoals.slice(0, 2).map((g) => (
                <div key={g.id} className="p-2.5 rounded-xl bg-space-850/80 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[170px]">{g.title}</span>
                    <span className="font-mono text-purple-300 font-bold">{g.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-space-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan transition-all duration-500"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/goals')}
            className="w-full py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition text-center"
          >
            Explore Milestones &amp; Decomposition
          </button>
        </div>

        {/* Card 3: Actionable AI Tasks */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Extracted Tasks ({pendingTasks.length})</span>
              </span>
              <button
                onClick={() => onNavigate('/tasks')}
                className="text-[11px] text-emerald-400 hover:underline font-mono"
              >
                All Tasks
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {pendingTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-space-850/80 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 truncate max-w-[170px]">{t.title}</span>
                  {t.deadline && (
                    <span className="text-[10px] font-mono text-cyan flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{t.deadline}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/tasks')}
            className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition text-center"
          >
            Review Action Checklist
          </button>
        </div>
      </div>

      {/* Secondary Row: Knowledge Search & Memory Vault Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ask My Journal Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-cyan-500/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Ask My Journal (RAG Knowledge Engine)</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Semantic Search over Your Private Life History
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask questions like &ldquo;What were my primary startup ideas last month?&rdquo; or &ldquo;What caused me stress recently?&rdquo; with grounded citations.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => onNavigate('/ask-journal')}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan text-xs font-mono font-medium hover:bg-cyan-500/25 transition flex items-center gap-1.5"
            >
              <span>Query Personal Archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Memory Vault Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between border-purple-500/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase">
              <Brain className="w-4 h-4" />
              <span>Personal Memory Vault ({memories.length} Facts)</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Persistent Context Without Privacy Compromise
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini LifeOS retains verified facts, preferences, and personal anchors. You maintain full ownership: view, edit, or purge memories at any time.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => onNavigate('/memories')}
              className="px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium hover:bg-purple-500/25 transition flex items-center gap-1.5"
            >
              <span>Open Memory Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Journal Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onEntrySaved={() => onNavigate('/journal')}
      />
    </div>
  );
};
