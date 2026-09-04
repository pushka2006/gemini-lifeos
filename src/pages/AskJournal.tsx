import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, Quote, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { askMyJournalApi } from '../services/api';

export const AskJournal: React.FC = () => {
  const { idToken } = useAuth();
  const { entries, memories, setAiState } = useLifeOS();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    citations: string[];
  } | null>(null);

  const suggestedQuestions = [
    'What did I say about my project recently?',
    'What were the main things stressing me?',
    'What goals or commitments did I mention?',
    'Show my previous ideas about personal productivity.',
    'What are the recurring gratitude anchors in my journal?',
  ];

  const handleSearch = async (queryText?: string) => {
    const q = queryText || query.trim();
    if (!q || isSearching) return;

    setIsSearching(true);
    setAiState('THINKING');
    setResult(null);

    // Prepare context items strictly scoped from this user's memory & entries
    const contextEntries = entries.map(e => ({
      title: e.title,
      date: e.date,
      content: e.formattedContent || e.rawContent,
    }));

    // Add memory context as pseudo-entries
    memories.forEach(m => {
      contextEntries.push({
        title: `Memory [${m.category}]`,
        date: m.createdAt.split('T')[0],
        content: m.content,
      });
    });

    try {
      const res = await askMyJournalApi(q, contextEntries, idToken);
      setResult(res);
      setAiState('IDLE');
    } catch (err) {
      console.error('Ask My Journal failed:', err);
      setResult({
        answer: 'Failed to retrieve records. Please verify your connection or write more journal entries.',
        citations: [],
      });
      setAiState('ERROR');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/30 space-y-2">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-cyan animate-pulse" />
          <span>Semantic Retrieval &bull; RAG Knowledge Engine</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Ask My Journal
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Ask conversational questions about your own personal thoughts, reflections, and decisions. All queries are resolved using your private encrypted documents with verified citations.
        </p>
      </div>

      {/* Query Bar */}
      <div className="glass-panel p-4 rounded-2xl border-cyan-500/20 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your journal entries and memories..."
            className="w-full px-4 py-3.5 pl-11 pr-28 rounded-xl bg-space-950 border border-cyan-500/30 text-white text-sm focus:border-cyan outline-none shadow-glow-cyan placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-cyan absolute left-4 pointer-events-none" />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="absolute right-2 px-4 py-2 rounded-lg bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>{isSearching ? 'Synthesizing...' : 'Search'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggested Prompts */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Suggested Personal Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                className="px-3 py-1 rounded-lg bg-space-900 border border-slate-800 text-xs text-slate-300 hover:text-cyan hover:border-cyan-500/30 transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answer Container */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl border-cyan-500/30 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan">
              <BookOpen className="w-4 h-4" />
              <span className="uppercase tracking-wider">Gemini Synthesis</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded in User Vault</span>
            </div>
          </div>

          <div className="text-sm text-slate-200 leading-relaxed space-y-3">
            <p className="whitespace-pre-line">{result.answer}</p>
          </div>

          {/* Citations List */}
          {result.citations && result.citations.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-purple-400" />
                <span>Primary Document Citations:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.citations.map((cite, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-space-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
                    <span className="truncate">{cite}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
