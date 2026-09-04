import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Save,
  Trash2,
  Calendar,
  Tag,
  Smile,
  Mic,
  Plus,
  Search,
  BookOpen,
  Edit3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { analyzeJournal } from '../services/api';
import { JournalEntry, MoodType } from '../types';
import { VoiceJournalModal } from '../components/voice/VoiceJournalModal';

export const Journal: React.FC = () => {
  const { idToken } = useAuth();
  const { entries, addEntry, removeEntry, setAiState } = useLifeOS();

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    entries.length > 0 ? entries[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Active form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('Reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['journal']);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  // Load entry into editor
  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setTitle(entry.title);
    setContent(entry.formattedContent || entry.rawContent);
    setMood(entry.mood);
    setTags(entry.tags || []);
    setEntryDate(entry.date);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedEntryId(null);
    setTitle('');
    setContent('');
    setMood('Reflective');
    setTags(['daily']);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setIsEditing(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // AI Transformations
  const handleAiAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setAiState('THINKING');

    try {
      const result = await analyzeJournal(content, idToken);
      if (result) {
        setTitle(result.title || title);
        setContent(result.cleanEntry || content);
        if (result.mood) setMood(result.mood as MoodType);
        if (result.tags && result.tags.length > 0) {
          setTags(Array.from(new Set([...tags, ...result.tags])));
        }
      }
    } catch (err) {
      console.error('AI Journal Analyze failed:', err);
    } finally {
      setIsAnalyzing(false);
      setAiState('IDLE');
    }
  };

  const handleAiRewrite = () => {
    if (!content.trim()) return;
    setContent(prev =>
      `### Perspective on Today\n\n${prev}\n\n*Key reflection: Continuous incremental focus creates resilience.*`
    );
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const finalTitle = title.trim() || `Journal: ${entryDate}`;
    const newEntry: JournalEntry = {
      id: selectedEntryId || `entry-${Date.now()}`,
      title: finalTitle,
      rawContent: content,
      formattedContent: content,
      summary: content.slice(0, 140) + '...',
      mood,
      emotions: [mood.toLowerCase(), 'mindful'],
      keyEvents: ['Personal reflection session'],
      topics: tags,
      lessons: ['Deliberate reflection clarifies future priorities.'],
      gratitude: ['Taking time to document personal trajectory.'],
      tags,
      date: entryDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addEntry(newEntry);
    setSelectedEntryId(newEntry.id);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (selectedEntryId) {
      await removeEntry(selectedEntryId);
      handleCreateNew();
    }
  };

  const moods: MoodType[] = [
    'Energetic',
    'Optimistic',
    'Focused',
    'Calm',
    'Reflective',
    'Stressed',
    'Overwhelmed',
    'Melancholic',
    'Grateful',
  ];

  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.rawContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-6rem)] max-w-7xl mx-auto w-full gap-4 overflow-hidden">
      {/* Entries Sidebar List */}
      <div className="w-full md:w-80 bg-space-950/70 border border-cyan-500/15 rounded-2xl flex flex-col overflow-hidden glass-panel flex-shrink-0">
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-cyan tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Personal Vault ({entries.length})</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceModalOpen(true)}
                className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan hover:bg-cyan-500/25 transition"
                title="Record Voice Entry"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCreateNew}
                className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition"
                title="New Written Entry"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by keyword or tag..."
              className="w-full px-2.5 py-1.5 pl-8 rounded-xl bg-space-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            return (
              <div
                key={entry.id}
                onClick={() => handleSelectEntry(entry)}
                className={`p-3 rounded-xl cursor-pointer transition text-xs space-y-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-sm'
                    : 'bg-space-900/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate max-w-[170px]">{entry.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-cyan-500/20 bg-cyan-500/10 text-cyan">
                    {entry.mood}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {entry.summary || entry.rawContent}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>{entry.date}</span>
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-slate-400">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Viewer Panel */}
      <div className="flex-1 flex flex-col bg-space-950/70 border border-cyan-500/15 rounded-2xl overflow-hidden glass-panel">
        {/* Editor Action Header */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-slate-800 bg-space-900/60 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-850 border border-slate-700 text-xs text-slate-200 hover:text-white"
            >
              {isEditing ? <Eye className="w-3.5 h-3.5 text-cyan" /> : <Edit3 className="w-3.5 h-3.5 text-cyan" />}
              <span>{isEditing ? 'Preview Markdown' : 'Edit Source'}</span>
            </button>

            {isEditing && (
              <button
                onClick={handleAiAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/25 transition disabled:opacity-40"
                title="Analyze emotions, events, and gratitude"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Gemini Analyze'}</span>
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleAiRewrite}
                disabled={!content.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-space-850 border border-slate-700 text-xs text-slate-300 hover:text-white"
                title="Format with structured reflection headings"
              >
                AI Structure
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedEntryId && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-space-800 transition"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 transition shadow-glow-cyan disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Entry</span>
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-space-900/40 border-b border-slate-800 text-xs">
          {/* Date Picker */}
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan" />
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs"
            />
          </div>

          {/* Mood Picker */}
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as MoodType)}
              className="bg-space-950 px-2 py-0.5 rounded border border-slate-700 text-slate-200 outline-none text-xs"
            >
              {moods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tag Bar */}
          <div className="flex flex-wrap items-center gap-1 text-slate-400">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-space-850 border border-slate-700 text-[11px] text-slate-300"
              >
                #{tag}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ tag"
                className="w-16 px-1.5 py-0.5 rounded bg-transparent border border-dashed border-slate-700 text-[11px] text-slate-300 outline-none focus:border-cyan"
              />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {isEditing ? (
            <div className="space-y-4 h-full flex flex-col">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Evocative Entry Title..."
                className="w-full text-xl font-bold bg-transparent border-b border-slate-800 pb-2 text-white outline-none focus:border-cyan placeholder:text-slate-600"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What occupied your mind, gave you energy, or challenged you today? Write freely in markdown..."
                className="w-full flex-1 min-h-[300px] bg-transparent text-slate-200 text-sm leading-relaxed resize-none outline-none font-sans placeholder:text-slate-600"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white border-b border-slate-800 pb-3">
                {title || 'Untitled Journal Entry'}
              </h1>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Journal Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onEntrySaved={(entry) => handleSelectEntry(entry)}
      />
    </div>
  );
};
