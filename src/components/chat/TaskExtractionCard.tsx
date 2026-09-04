import React, { useState } from 'react';
import { CheckCircle2, XCircle, Edit3, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { ExtractedTask } from '../../types';

interface TaskExtractionCardProps {
  tasks: ExtractedTask[];
  onAddTask: (task: ExtractedTask) => void;
  onIgnoreTask: (index: number) => void;
}

export const TaskExtractionCard: React.FC<TaskExtractionCardProps> = ({
  tasks,
  onAddTask,
  onIgnoreTask,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDeadline, setEditedDeadline] = useState('');
  const [editedPriority, setEditedPriority] = useState<'low' | 'medium' | 'high'>('medium');

  if (!tasks || tasks.length === 0) return null;

  const handleStartEdit = (idx: number, task: ExtractedTask) => {
    setEditingIndex(idx);
    setEditedTitle(task.title);
    setEditedDeadline(task.deadline || '');
    setEditedPriority(task.priority);
  };

  const handleSaveEdit = (idx: number) => {
    onAddTask({
      title: editedTitle,
      deadline: editedDeadline || undefined,
      priority: editedPriority,
      confidence: 1.0,
    });
    setEditingIndex(null);
  };

  return (
    <div className="my-3 p-4 rounded-xl bg-space-900/90 border border-purple-500/30 shadow-glow-violet backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3 text-xs font-mono text-purple-300">
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        <span className="font-semibold tracking-wider uppercase">Gemini Detected Actionable Tasks</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-space-850 border border-slate-800"
          >
            {editingIndex === idx ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-space-950 border border-purple-500/50 text-white text-xs outline-none"
                  placeholder="Task title..."
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                    className="px-2 py-1 rounded bg-space-950 border border-slate-700 text-slate-300 text-xs outline-none w-32"
                    placeholder="Deadline e.g. Friday"
                  />
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-2 py-1 rounded bg-space-950 border border-slate-700 text-slate-300 text-xs outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSaveEdit(idx)}
                    className="px-3 py-1 rounded bg-purple-600 text-white text-xs font-medium hover:bg-purple-500"
                  >
                    Save &amp; Add
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.deadline && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{task.deadline}</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                          task.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onAddTask(task)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition"
                    title="Add to Tasks"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                  <button
                    onClick={() => handleStartEdit(idx, task)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-space-700 transition"
                    title="Edit Task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onIgnoreTask(idx)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-space-700 transition"
                    title="Ignore"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
