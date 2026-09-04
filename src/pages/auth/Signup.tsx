import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignupProps {
  onNavigate: (path: string) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);

    try {
      await signUpWithEmail(email, password, name);
      onNavigate('/onboarding');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 cyber-grid">
      <div className="relative w-full max-w-md bg-space-900/90 border border-purple-500/30 rounded-3xl p-8 glass-panel shadow-glow-violet space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto shadow-glow-violet">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">
            Create Gemini LifeOS
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            INITIALIZE PERSONAL ENCRYPTED COGNITIVE VAULT
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-mono uppercase">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Nova"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-space-950 border border-slate-700 text-sm text-white focus:border-purple-400 outline-none"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-mono uppercase">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alex@example.com"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-space-950 border border-slate-700 text-sm text-white focus:border-purple-400 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-mono uppercase">Password (min 6 characters)</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-space-950 border border-slate-700 text-sm text-white focus:border-purple-400 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan text-space-950 font-bold text-sm hover:opacity-90 transition shadow-glow-violet disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Initializing Vault...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          <span>Already have an account? </span>
          <button
            onClick={() => onNavigate('/login')}
            className="text-cyan font-semibold hover:underline"
          >
            Sign In Here
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict Firestore Security Rules Enforced</span>
        </div>
      </div>
    </div>
  );
};
