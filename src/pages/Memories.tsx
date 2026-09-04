import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { Memory } from '../types';

export const Memories: React.FC = () => {
  const {
    memories,
    addMemory,
    removeMemory,
    clearMemories,
    memoryEnabled,
    setMemoryEnabled,
  } = useLifeOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('fact');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const categories = ['all', 'preference', 'goal', 'project', 'fact', 'insight'];

  const filteredMemories = memories.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await addMemory(newCategory, newContent.trim(), 'User Manual Entry');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border-purple-500/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Long-term Cognitive Storage</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Personal Memory Vault
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Verified contextual facts, working styles, and anchors. Gemini retrieves these memories during conversations to personalize thinking without cloud leakage.
          </p>
        </div>

        {/* Global Memory Toggle */}
        <div className="flex items-center gap-3 self-start md:self-center p-2 rounded-xl bg-space-850 border border-slate-700">
          <span className="text-xs font-mono text-slate-300">Memory System:</span>
          <button
            onClick={() => setMemoryEnabled(!memoryEnabled)}
            className="flex items-center gap-1 text-xs font-mono transition"
          >
            {memoryEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ToggleRight className="w-6 h-6 text-emerald-400" />
                <span>ACTIVE</span>
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <ToggleLeft className="w-6 h-6 text-slate-500" />
                <span>DISABLED</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="glass-panel p-4 rounded-2xl border-purple-500/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memories..."
              className="w-full px-3 py-2 pl-8 rounded-xl bg-space-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-purple-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-space-950 px-2 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
            <Filter className="w-3 h-3 text-purple-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs capitalize"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-space-900">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500 text-white font-semibold text-xs hover:bg-purple-400 transition shadow-glow-violet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fact</span>
          </button>

          {memories.length > 0 && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs transition"
              title="Clear All Memories"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add Memory Modal/Inline Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border-purple-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-purple-300">Store Verified Memory</span>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Memory['category'])}
              className="bg-space-950 px-3 py-1 rounded-lg border border-slate-700 text-purple-300 text-xs font-mono outline-none"
            >
              <option value="preference">Preference</option>
              <option value="goal">Goal Anchor</option>
              <option value="project">Project Note</option>
              <option value="fact">Personal Fact</option>
              <option value="insight">Insight</option>
            </select>
          </div>

          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="e.g. 'I work best in 90-minute blocks without notifications' or 'Focusing on building LifeOS by Q4'..."
            className="w-full p-3 rounded-xl bg-space-950 border border-slate-700 text-white text-xs outline-none focus:border-purple-400 resize-none leading-relaxed"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-4 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 disabled:opacity-40"
            >
              Encrypt &amp; Save
            </button>
          </div>
        </form>
      )}

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((m) => (
          <div
            key={m.id}
            className="glass-card p-4 rounded-xl flex flex-col justify-between space-y-3 group border-purple-500/20"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {m.category}
                </span>
                <button
                  onClick={() => removeMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition"
                  title="Purge Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {m.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Isolated</span>
              </span>
              <span>Source: {m.source}</span>
            </div>
          </div>
        ))}

        {filteredMemories.length === 0 && (
          <div className="col-span-2 p-12 text-center glass-panel rounded-2xl space-y-2">
            <Brain className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              No matching memories stored. Create one above or converse in chat to surface facts.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Wipe Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-space-900 border border-rose-500/40 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Purge All Memory Vectors?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete all {memories.length} stored facts, preferences, and personal anchors. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearMemories();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
