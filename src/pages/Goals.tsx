import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { decomposeGoalApi } from '../services/api';
import { Goal, GoalMilestone } from '../types';

export const Goals: React.FC = () => {
  const { idToken } = useAuth();
  const { goals, addGoal, removeGoal, toggleMilestone, addTask, setAiState } = useLifeOS();

  const [isAdding, setIsAdding] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [category, setCategory] = useState<Goal['category']>('career');
  const [deadline, setDeadline] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<{
    milestones: Array<{ title: string; targetDays: number; tasks: string[] }>;
    recommendedHabit: string;
    potentialObstacle: string;
  } | null>(null);

  const handleDecomposeWithAi = async () => {
    if (!goalTitle.trim()) return;
    setIsDecomposing(true);
    setAiState('THINKING');

    try {
      const res = await decomposeGoalApi(goalTitle, goalDescription, idToken);
      setAiBreakdown(res);
    } catch (err) {
      console.error('Goal decomposition failed:', err);
    } finally {
      setIsDecomposing(false);
      setAiState('IDLE');
    }
  };

  const handleSaveGoal = async () => {
    if (!goalTitle.trim()) return;

    let initialMilestones: GoalMilestone[] = [];
    if (aiBreakdown && aiBreakdown.milestones.length > 0) {
      initialMilestones = aiBreakdown.milestones.map((m, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: m.title,
        completed: false,
        targetDays: m.targetDays,
      }));

      // Also auto-seed extracted subtasks into tasks tracker
      for (const m of aiBreakdown.milestones) {
        for (const t of m.tasks) {
          await addTask({
            id: `task-goal-${Date.now()}-${Math.random()}`,
            title: t,
            priority: 'medium',
            status: 'pending',
            deadline: `In ${m.targetDays} days`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else {
      initialMilestones = [
        { id: `ms-1`, title: 'Define scope and requirements', completed: false },
        { id: `ms-2`, title: 'Build minimum viable milestone', completed: false },
        { id: `ms-3`, title: 'Complete final review and launch', completed: false },
      ];
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle,
      description: goalDescription,
      category,
      deadline: deadline || undefined,
      progress: 0,
      milestones: initialMilestones,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addGoal(newGoal);
    setGoalTitle('');
    setGoalDescription('');
    setAiBreakdown(null);
    setIsAdding(false);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border-purple-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest">
            <Target className="w-4 h-4 text-purple-400" />
            <span>Strategic Trajectory &amp; Milestone Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Goals &amp; Milestones
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Convert long-range aspirations into sequential milestones and automated daily tasks powered by Gemini.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan text-space-950 font-bold text-xs hover:opacity-90 shadow-glow-violet transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Creation Modal / Drawer */}
      {isAdding && (
        <div className="glass-panel p-6 rounded-2xl border-purple-500/40 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Initialize New Goal</h3>
            <span className="text-xs font-mono text-purple-300 uppercase">AI-Assisted Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-slate-400">Goal Vision</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Build my AI assistant by December or Run a 10K marathon..."
                className="w-full p-3 rounded-xl bg-space-950 border border-slate-700 text-white text-sm outline-none focus:border-purple-400"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-slate-400">Context &amp; Why It Matters</label>
              <textarea
                rows={2}
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Key motivations and success criteria..."
                className="w-full p-3 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-xs outline-none focus:border-purple-400 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Goal['category'])}
                className="w-full p-2.5 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-xs outline-none"
              >
                <option value="career">Career / Technical</option>
                <option value="health">Health &amp; Vitality</option>
                <option value="learning">Learning &amp; Mastery</option>
                <option value="personal">Personal Growth</option>
                <option value="financial">Financial</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          {/* AI Decompose Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDecomposeWithAi}
              disabled={isDecomposing || !goalTitle.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs hover:bg-purple-500/25 transition disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>{isDecomposing ? 'Decomposing...' : 'Gemini AI Auto-Decompose'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={!goalTitle.trim()}
                className="px-5 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 disabled:opacity-40"
              >
                Confirm &amp; Launch
              </button>
            </div>
          </div>

          {/* AI Breakdown Preview */}
          {aiBreakdown && (
            <div className="p-4 rounded-xl bg-space-950/80 border border-purple-500/30 space-y-3 animate-in fade-in">
              <span className="text-xs font-mono text-purple-300 uppercase tracking-wider block">
                Generated Milestones &amp; Subtasks
              </span>
              <div className="space-y-2">
                {aiBreakdown.milestones.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-space-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-white">
                      <span>{m.title}</span>
                      <span className="text-cyan font-mono text-[11px]">{m.targetDays} days</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Subtasks: {m.tasks.join(', ')}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs pt-1">
                <span className="text-emerald-400 font-medium">Recommended Habit: </span>
                <span className="text-slate-300">{aiBreakdown.recommendedHabit}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals Cards List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="glass-card p-6 rounded-2xl border-purple-500/20 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {goal.category}
                  </span>
                  {goal.deadline && (
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan" />
                      <span>{goal.deadline}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{goal.title}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">Progress:</span>
                  <span className="ml-1 text-base font-bold font-mono text-cyan">
                    {goal.progress}%
                  </span>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-space-800 transition"
                  title="Remove Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {goal.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {goal.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan to-emerald-400 transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-slate-400">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goal.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    onClick={() => toggleMilestone(goal.id, ms.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs border transition ${
                      ms.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-space-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {ms.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <span className={ms.completed ? 'line-through opacity-80' : ''}>
                      {ms.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
            <Target className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              No active goals initialized. Click &apos;New Goal&apos; to break down your vision into milestones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
