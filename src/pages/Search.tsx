import React, { useState } from 'react';
import {
  Search as SearchIcon,
  BookOpen,
  MessageSquare,
  Brain,
  Target,
  CheckSquare,
  Calendar,
  Filter,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const Search: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { entries, goals, tasks, memories } = useLifeOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  interface SearchResultItem {
    id: string;
    type: 'journal' | 'memory' | 'goal' | 'task';
    title: string;
    snippet: string;
    date?: string;
    mood?: string;
    route: string;
  }

  const allItems: SearchResultItem[] = [
    ...entries.map((e) => ({
      id: e.id,
      type: 'journal' as const,
      title: e.title,
      snippet: e.summary || e.rawContent,
      date: e.date,
      mood: e.mood,
      route: '/journal',
    })),
    ...memories.map((m) => ({
      id: m.id,
      type: 'memory' as const,
      title: `Memory [${m.category}]`,
      snippet: m.content,
      date: m.createdAt.split('T')[0],
      route: '/memories',
    })),
    ...goals.map((g) => ({
      id: g.id,
      type: 'goal' as const,
      title: g.title,
      snippet: g.description || `Progress: ${g.progress}%`,
      date: g.deadline,
      route: '/goals',
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      snippet: `Priority: ${t.priority} • Status: ${t.status}`,
      date: t.deadline,
      route: '/tasks',
    })),
  ];

  const results = allItems.filter((item) => {
    const matchesQuery =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesMood = selectedMood === 'all' || item.mood === selectedMood;

    return matchesQuery && matchesType && matchesMood;
  });

  const typeIcons = {
    journal: BookOpen,
    memory: Brain,
    goal: Target,
    task: CheckSquare,
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/30 space-y-2">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-widest">
          <SearchIcon className="w-4 h-4 text-cyan" />
          <span>Global Personal Search</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Universal Vault Search
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Search across your private journal entries, long-term memories, strategic goals, and actionable tasks with real-time filters.
        </p>
      </div>

      {/* Search Input and Filters */}
      <div className="glass-panel p-4 rounded-2xl border-cyan-500/20 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all records by keyword, phrase, or concept..."
            className="w-full px-4 py-3 pl-11 rounded-xl bg-space-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-cyan outline-none"
          />
          <SearchIcon className="w-4 h-4 text-cyan absolute left-4 top-3.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan" />
            <span>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-space-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200 outline-none"
            >
              <option value="all">All Items</option>
              <option value="journal">Journal Entries</option>
              <option value="memory">Memories</option>
              <option value="goal">Goals</option>
              <option value="task">Tasks</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <span>Mood:</span>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="bg-space-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200 outline-none"
            >
              <option value="all">All Moods</option>
              <option value="Energetic">Energetic</option>
              <option value="Optimistic">Optimistic</option>
              <option value="Focused">Focused</option>
              <option value="Calm">Calm</option>
              <option value="Reflective">Reflective</option>
              <option value="Stressed">Stressed</option>
            </select>
          </div>

          <span className="text-slate-500 font-mono text-[11px] ml-auto">
            {results.length} results surfaced
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((item) => {
          const Icon = typeIcons[item.type];
          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => onNavigate && onNavigate(item.route)}
              className="glass-card p-4 rounded-xl cursor-pointer border border-slate-800 hover:border-cyan-500/40 space-y-1.5 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-white text-sm">{item.title}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  {item.mood && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan border border-cyan-500/20">
                      {item.mood}
                    </span>
                  )}
                  {item.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pl-7">
                {item.snippet}
              </p>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="p-12 text-center glass-panel rounded-2xl space-y-2">
            <SearchIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              No matching records found across your personal vault.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
