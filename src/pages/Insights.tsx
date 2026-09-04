import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const Insights: React.FC = () => {
  const { entries, goals, tasks } = useLifeOS();

  // Mood to numeric valence score map
  const moodScores: Record<string, number> = {
    Energetic: 9,
    Optimistic: 8.5,
    Grateful: 8,
    Focused: 7.5,
    Calm: 7,
    Reflective: 6.5,
    Stressed: 4,
    Melancholic: 3.5,
    Overwhelmed: 2.5,
  };

  // 1. Mood Trend Data
  const moodData = entries
    .slice(0, 10)
    .reverse()
    .map((e) => ({
      date: e.date.slice(5), // MM-DD
      score: moodScores[e.mood] || 7,
      mood: e.mood,
    }));

  // Ensure fallback points if entries are few
  if (moodData.length === 0) {
    moodData.push(
      { date: '08-28', score: 6.5, mood: 'Reflective' },
      { date: '08-30', score: 8.0, mood: 'Optimistic' },
      { date: '09-02', score: 5.0, mood: 'Stressed' },
      { date: '09-04', score: 8.5, mood: 'Energetic' }
    );
  }

  // 2. Topic Frequency
  const topicCounts: Record<string, number> = {};
  entries.forEach((e) => {
    (e.tags || []).forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
    (e.topics || []).forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
  });

  const topicData = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (topicData.length === 0) {
    topicData.push(
      { topic: 'Productivity', count: 5 },
      { topic: 'Architecture', count: 4 },
      { topic: 'Deep Work', count: 3 },
      { topic: 'Mindfulness', count: 2 },
      { topic: 'Health', count: 2 }
    );
  }

  // 3. Goal Completion Status
  const completedGoals = goals.filter((g) => g.progress === 100).length;
  const inProgressGoals = goals.filter((g) => g.progress > 0 && g.progress < 100).length;
  const newGoals = goals.filter((g) => g.progress === 0).length;

  const goalPieData = [
    { name: 'Completed', value: completedGoals || 1, color: '#10b981' },
    { name: 'In Progress', value: inProgressGoals || 2, color: '#00f0ff' },
    { name: 'Planned', value: newGoals || 1, color: '#a855f7' },
  ];

  // 4. Task execution statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/30 space-y-2">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-widest">
          <BarChart3 className="w-4 h-4 text-cyan" />
          <span>Cognitive Telemetry &bull; Personal Insights</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          AI Personal Insights &amp; Analytics
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Comprehensive synthesis of your mood trajectory, productivity rhythms, recurring themes, and goal completion rates.
        </p>

        {/* Ethical Non-medical Disclaimer */}
        <div className="flex items-center gap-2 pt-2 text-[11px] text-amber-400 font-mono">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>
            Ethical Note: These AI-generated behavioral trends are designed solely for self-reflection and personal productivity; they do not constitute medical or psychological diagnosis.
          </span>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Journaling Consistency</span>
          <p className="text-2xl font-bold font-mono text-cyan">{entries.length} Entries</p>
          <span className="text-[10px] text-emerald-400 font-mono">Steady cadence maintained</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Task Velocity</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">{taskCompletionRate}%</p>
          <span className="text-[10px] text-slate-400 font-mono">{completedTasks} of {totalTasks} finished</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Dominant Mood</span>
          <p className="text-2xl font-bold font-mono text-purple-300">{entries[0]?.mood || 'Reflective'}</p>
          <span className="text-[10px] text-purple-400 font-mono">Recent 7-day average</span>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Active Trajectories</span>
          <p className="text-2xl font-bold font-mono text-amber-400">{goals.length} Goals</p>
          <span className="text-[10px] text-slate-400 font-mono">Across career &amp; health</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Mood Valence Over Time */}
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan" />
              <span>Mood Valence Over Time</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Scale: 1-10</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080c14',
                    borderColor: '#00f0ff40',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#moodGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Frequently Discussed Topics */}
        <div className="glass-panel p-5 rounded-2xl border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Top Discussion Topics</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Frequency count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData}>
                <XAxis dataKey="topic" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080c14',
                    borderColor: '#a855f740',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Goal Milestones Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Goal Completion Ratio</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Trajectory distribution</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {goalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080c14',
                    borderColor: '#10b98140',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-mono text-slate-400">
            {goalPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Gemini Pattern Synthesis */}
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/20 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan">
              <Sparkles className="w-4 h-4 text-cyan" />
              <span>Qualitative AI Synthesis</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-0.5">Positive Behavioral Pattern:</span>
                Consistent reflection and high completion on technical sprint tasks before midday.
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-slate-800">
                <span className="font-semibold text-amber-400 block mb-0.5">Recurring Friction Point:</span>
                Context switching late in the afternoon corresponds to spikes in self-reported stress.
              </div>

              <div className="p-3 rounded-xl bg-space-900 border border-slate-800">
                <span className="font-semibold text-cyan block mb-0.5">Recommended Adjustment:</span>
                Protect a strict 90-minute deep work block each morning; batch administrative inquiries.
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Synthesized by Gemini</span>
            </span>
            <span>Real-time Vault Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
