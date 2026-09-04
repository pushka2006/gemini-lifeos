import React, { useState, useEffect } from 'react';
import { Sunrise, Sparkles, Target, CheckSquare, Zap, RefreshCw, Quote, ArrowRight } from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { fetchMorningBrief } from '../services/api';
import { MorningBriefData } from '../types';
import { getSavedMorningBrief, saveMorningBrief } from '../services/storage';

export const MorningBrief: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { user, idToken } = useAuth();
  const { entries, goals, tasks, setAiState } = useLifeOS();

  const [brief, setBrief] = useState<MorningBriefData | null>(null);
  const [loading, setLoading] = useState(false);

  const activeGoals = goals.filter(g => g.progress < 100);
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const yesterdayEntry = entries[1] || entries[0];

  const loadOrGenerateBrief = async (forceRefresh = false) => {
    if (!user?.uid) return;
    setLoading(true);
    setAiState('THINKING');

    if (!forceRefresh) {
      const cached = await getSavedMorningBrief(user.uid);
      const todayStr = new Date().toISOString().split('T')[0];
      if (cached && cached.date === todayStr) {
        setBrief(cached);
        setLoading(false);
        setAiState('IDLE');
        return;
      }
    }

    try {
      const data = await fetchMorningBrief(
        {
          userName: user.displayName,
          yesterdaySummary: yesterdayEntry?.summary || yesterdayEntry?.rawContent,
          goals: activeGoals.map(g => g.title),
          tasks: pendingTasks.map(t => t.title),
        },
        idToken
      );
      setBrief(data);
      await saveMorningBrief(user.uid, data);
    } catch (err) {
      console.error('Failed to generate morning brief:', err);
    } finally {
      setLoading(false);
      setAiState('IDLE');
    }
  };

  useEffect(() => {
    loadOrGenerateBrief();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border-amber-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest">
            <Sunrise className="w-4 h-4 text-amber-400" />
            <span>Executive Morning Telemetry</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Daily Morning Brief
          </h1>
          <p className="text-xs text-slate-400">
            Automated cognitive alignment based on yesterday&apos;s output, active goals, and urgent milestones.
          </p>
        </div>

        <button
          onClick={() => loadOrGenerateBrief(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-space-850 border border-slate-700 hover:border-amber-500/40 text-xs font-mono text-slate-200 transition self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Regenerate Brief</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center space-y-3 glass-panel rounded-2xl">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-300">
            Gemini is compiling your morning intelligence synthesis...
          </p>
        </div>
      ) : brief ? (
        <div className="space-y-6">
          {/* Greeting & Pace */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-space-900 to-purple-500/10 border border-amber-500/30 glass-panel space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-300 uppercase tracking-wider">
                Target Rhythm: {brief.suggestedPace}
              </span>
              <span className="text-xs font-mono text-slate-400">{brief.date}</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {brief.greeting}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {brief.yesterdayRecap}
            </p>
          </div>

          {/* Motivational Quote */}
          <div className="p-4 rounded-xl bg-space-900/80 border border-slate-800 flex items-center gap-3">
            <Quote className="w-6 h-6 text-amber-400 flex-shrink-0 opacity-80" />
            <p className="text-xs text-slate-200 italic font-mono leading-relaxed">
              &ldquo;{brief.motivationalMessage}&rdquo;
            </p>
          </div>

          {/* Primary Daily Focus */}
          <div className="p-6 rounded-2xl glass-panel border-cyan-500/30 space-y-3">
            <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase">
              <Zap className="w-4 h-4 text-cyan" />
              <span>Suggested Core Priority Today</span>
            </div>
            <div className="p-4 rounded-xl bg-space-950/80 border border-cyan-500/40 text-sm font-medium text-white shadow-glow-cyan">
              {brief.priorityFocus}
            </div>
          </div>

          {/* Goals & Tasks Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Active Goals */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span>Goals on Radar ({activeGoals.length})</span>
                </span>
                {onNavigate && (
                  <button onClick={() => onNavigate('/goals')} className="text-purple-400 hover:underline text-[11px] font-mono">
                    View
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {activeGoals.map((g) => (
                  <div key={g.id} className="p-2.5 rounded-lg bg-space-900 border border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-200">
                      <span className="truncate">{g.title}</span>
                      <span className="font-mono text-purple-300">{g.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent Tasks */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks for Today ({pendingTasks.length})</span>
                </span>
                {onNavigate && (
                  <button onClick={() => onNavigate('/tasks')} className="text-emerald-400 hover:underline text-[11px] font-mono">
                    Tasks
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {pendingTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-space-900 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-300 truncate">{t.title}</span>
                    {t.deadline && <span className="text-[10px] font-mono text-cyan">{t.deadline}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTA */}
          {onNavigate && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onNavigate('/journal')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan text-space-950 font-bold text-xs hover:opacity-90 transition shadow-glow-cyan"
              >
                <span>Open Journal &amp; Begin Day</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
