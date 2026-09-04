import React, { useState } from 'react';
import { Sunset, Sparkles, CheckCircle2, ChevronRight, Award, Compass } from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { submitDailyReflectionApi } from '../services/api';
import { DailyReflection as DailyReflectionType } from '../types';

export const DailyReflection: React.FC = () => {
  const { idToken } = useAuth();
  const { reflections, addReflection, setAiState } = useLifeOS();

  const [step, setStep] = useState<number>(1);
  const [wentWell, setWentWell] = useState('');
  const [challenged, setChallenged] = useState('');
  const [learned, setLearned] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<{
    synthesis: string;
    emotionalBalance: string;
    growthScore: number;
    coreTakeaway: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!wentWell || !challenged || !learned || !tomorrow) return;
    setIsSubmitting(true);
    setAiState('THINKING');

    try {
      const result = await submitDailyReflectionApi(
        { wentWell, challenged, learned, tomorrow },
        idToken
      );
      setGeneratedSummary(result);

      const newRef: DailyReflectionType = {
        id: `ref-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        wentWell,
        challenged,
        learned,
        tomorrow,
        synthesis: result.synthesis,
        emotionalBalance: result.emotionalBalance,
        growthScore: result.growthScore,
        coreTakeaway: result.coreTakeaway,
        createdAt: new Date().toISOString(),
      };
      await addReflection(newRef);
      setStep(5); // completion screen
    } catch (err) {
      console.error('Failed to submit daily reflection:', err);
    } finally {
      setIsSubmitting(false);
      setAiState('IDLE');
    }
  };

  const handleReset = () => {
    setStep(1);
    setWentWell('');
    setChallenged('');
    setLearned('');
    setTomorrow('');
    setGeneratedSummary(null);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow border-purple-500/30 space-y-2">
        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest">
          <Sunset className="w-4 h-4 text-purple-400" />
          <span>Evening Cognitive Synthesis</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          AI Daily Reflection
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Complete a structured 4-step evening debrief. Gemini analyzes emotional balance, synthesizes key lessons, and calculates your daily growth score.
        </p>
      </div>

      {/* Progress Stepper */}
      {step <= 4 && (
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          {[
            { num: 1, label: 'Victories' },
            { num: 2, label: 'Friction' },
            { num: 3, label: 'Learnings' },
            { num: 4, label: 'Tomorrow' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === s.num
                    ? 'bg-purple-500 text-white shadow-glow-violet'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-space-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline text-xs font-mono text-slate-400">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step Question Cards */}
      <div className="glass-panel p-6 rounded-2xl border-purple-500/20 space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase">Question 1 of 4</span>
              <h3 className="text-lg font-bold text-white mt-1">What went well today?</h3>
              <p className="text-xs text-slate-400">Acknowledge completed tasks, breakthrough moments, or intentional pauses.</p>
            </div>
            <textarea
              rows={4}
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="I successfully executed my primary objective and maintained high focus during the afternoon..."
              className="w-full p-4 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-sm focus:border-purple-400 outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!wentWell.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 disabled:opacity-40 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase">Question 2 of 4</span>
              <h3 className="text-lg font-bold text-white mt-1">What challenged or drained you?</h3>
              <p className="text-xs text-slate-400">Notice emotional friction, unexpected roadblocks, or distractions without judgment.</p>
            </div>
            <textarea
              rows={4}
              value={challenged}
              onChange={(e) => setChallenged(e.target.value)}
              placeholder="I got distracted by context-switching between emails and felt momentary deadline stress..."
              className="w-full p-4 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-sm focus:border-purple-400 outline-none resize-none"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!challenged.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 disabled:opacity-40 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase">Question 3 of 4</span>
              <h3 className="text-lg font-bold text-white mt-1">What did you learn today?</h3>
              <p className="text-xs text-slate-400">Extract an insight, cognitive lesson, or practical realization.</p>
            </div>
            <textarea
              rows={4}
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              placeholder="Batching communication into dedicated windows preserves deep problem-solving bandwidth..."
              className="w-full p-4 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-sm focus:border-purple-400 outline-none resize-none"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!learned.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-400 disabled:opacity-40 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase">Question 4 of 4</span>
              <h3 className="text-lg font-bold text-white mt-1">What would you like to improve tomorrow?</h3>
              <p className="text-xs text-slate-400">Set a crisp intention or supportive boundary for the morning.</p>
            </div>
            <textarea
              rows={4}
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              placeholder="Begin with a 90-minute phone-free sprint on the highest priority milestone..."
              className="w-full p-4 rounded-xl bg-space-950 border border-slate-700 text-slate-200 text-sm focus:border-purple-400 outline-none resize-none"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-slate-400 text-xs hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !tomorrow.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan text-space-950 font-bold text-xs hover:opacity-90 disabled:opacity-40 shadow-glow-violet transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Synthesizing...' : 'Synthesize Reflection'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 5 && generatedSummary && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reflection Secured in Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Growth Score:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-sm">
                  {generatedSummary.growthScore}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-cyan flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Executive Synthesis</span>
              </span>
              <p className="text-sm text-slate-200 leading-relaxed bg-space-950/80 p-4 rounded-xl border border-slate-800">
                {generatedSummary.synthesis}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800">
                <span className="text-purple-400 font-mono uppercase block mb-1">Emotional Balance</span>
                <span className="text-white font-medium">{generatedSummary.emotionalBalance}</span>
              </div>
              <div className="p-3 rounded-xl bg-space-900 border border-slate-800">
                <span className="text-amber-400 font-mono uppercase block mb-1">Core Takeaway Anchor</span>
                <span className="text-white font-medium">{generatedSummary.coreTakeaway}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-space-850 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition"
              >
                Log Another Reflection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historical Reflections List */}
      {reflections.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Past Reflection Milestones ({reflections.length})</span>
          </div>
          <div className="space-y-2.5">
            {reflections.slice(0, 3).map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-space-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
                  <span>{r.date}</span>
                  <span className="text-emerald-400">{r.growthScore}% Growth</span>
                </div>
                <p className="text-slate-300 line-clamp-2">{r.synthesis}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
