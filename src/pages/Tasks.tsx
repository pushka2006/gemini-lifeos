import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { TaskItem } from '../types';

export const Tasks: React.FC = () => {
  const { tasks, addTask, toggleTask, removeTask } = useLifeOS();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      deadline: newTaskDeadline.trim() || undefined,
      priority: newTaskPriority,
      status: 'pending',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    await addTask(task);
    setNewTaskTitle('');
    setNewTaskDeadline('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const highPriorityCount = tasks.filter(t => t.status === 'pending' && t.priority === 'high').length;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border-emerald-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Execution Protocol &bull; Action Items</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Actionable Tasks
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Tasks extracted automatically by Gemini during conversations and journal reflections, alongside your manual commitments.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-space-950 font-bold text-xs hover:bg-emerald-400 shadow-glow-emerald transition self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Pending</span>
          <p className="text-2xl font-bold font-mono text-cyan">{pendingCount}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Completed</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">{completedCount}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase">Urgent (High)</span>
          <p className="text-2xl font-bold font-mono text-rose-400">{highPriorityCount}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-mono uppercase mr-1">Status:</span>
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg capitalize transition font-mono ${
                filterStatus === s
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-space-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 outline-none text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Inline Add Task Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border-emerald-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-300">New Task Action</span>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="bg-space-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Action item (imperative, e.g. Finish client presentation)..."
            className="w-full px-3 py-2 rounded-xl bg-space-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-400"
          />

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              placeholder="Deadline string (e.g. Friday by 5pm)"
              className="w-56 px-3 py-1.5 rounded-lg bg-space-950 border border-slate-800 text-slate-300 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-space-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
              task.status === 'completed'
                ? 'bg-space-900/40 border-slate-800/60 opacity-60'
                : 'glass-card border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleTask(task.id)}
                className="text-slate-400 hover:text-emerald-400 transition"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              <div className="space-y-0.5">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  {task.source === 'conversation' && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI Extracted</span>
                    </span>
                  )}
                  {task.deadline && (
                    <span className="flex items-center gap-1 text-cyan">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{task.deadline}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  task.priority === 'high'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : task.priority === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {task.priority}
              </span>

              <button
                onClick={() => removeTask(task.id)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-space-800 transition"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              No tasks matching the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
