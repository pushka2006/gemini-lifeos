import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, Target, Brain, Mic } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { addMemory } = useLifeOS();
  const [selectedFocus, setSelectedFocus] = useState('Productivity & Deep Work');
  const [customPreference, setCustomPreference] = useState('');

  const focusOptions = [
    { label: 'Productivity & Deep Work', desc: 'Focus on high-leverage execution, milestone sprints, and anti-procrastination.' },
    { label: 'Mindful Introspection', desc: 'Cultivate self-awareness, mood balance, daily gratitude, and evening reflections.' },
    { label: 'Creative Synthesis & Brainstorming', desc: 'Synthesize lateral ideas, startup concepts, and divergent thinking.' },
    { label: 'Holistic Life Mastery', desc: 'Balance career targets, health metrics, and long-range goals.' },
  ];

  const handleFinish = async () => {
    await addMemory('preference', `Primary operating focus: ${selectedFocus}.`, 'Onboarding');
    if (customPreference.trim()) {
      await addMemory('fact', customPreference.trim(), 'Onboarding User Defined');
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 cyber-grid">
      <div className="relative w-full max-w-xl bg-space-900/90 border border-cyan-500/30 rounded-3xl p-8 glass-panel shadow-glow-cyan space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan mx-auto shadow-glow-cyan">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Calibrate Your Gemini LifeOS
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            ESTABLISH INITIAL COGNITIVE BASELINE &bull; ENCRYPTED PROFILE
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-mono uppercase text-cyan block">
            Select Your Primary Cognitive Focus:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {focusOptions.map((opt) => (
              <div
                key={opt.label}
                onClick={() => setSelectedFocus(opt.label)}
                className={`p-3.5 rounded-xl cursor-pointer border text-xs space-y-1 transition ${
                  selectedFocus === opt.label
                    ? 'bg-cyan-500/15 border-cyan text-white shadow-sm'
                    : 'bg-space-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{opt.label}</span>
                  {selectedFocus === opt.label && <Check className="w-4 h-4 text-cyan" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-purple-300 block">
            Add an Initial Fact or Preference for Gemini to Remember:
          </label>
          <input
            type="text"
            value={customPreference}
            onChange={(e) => setCustomPreference(e.target.value)}
            placeholder="e.g. 'I do my best creative work in early mornings' or 'Currently leading an engineering team'..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-700 text-xs text-white focus:border-cyan outline-none"
          />
        </div>

        <div className="p-3 rounded-xl bg-space-950 border border-slate-800 space-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Privacy Guarantee</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Your journal entries and memories are locked to your individual UID. No other user can ever query or read your thoughts.
          </p>
        </div>

        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-cyan-500 text-space-950 font-bold text-sm hover:bg-cyan-400 transition shadow-glow-cyan flex items-center justify-center gap-2"
        >
          <span>Launch Workspace Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
