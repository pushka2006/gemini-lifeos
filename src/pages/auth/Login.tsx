import React, { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { signInWithEmail, signInWithGoogle, signInDemo } = useAuth();
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
      await signInWithEmail(email, password);
      onNavigate('/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Authentication failed. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onNavigate('/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    signInDemo();
    onNavigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 cyber-grid">
      <div className="relative w-full max-w-md bg-space-900/90 border border-cyan-500/30 rounded-3xl p-8 glass-panel shadow-glow-cyan space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan mx-auto shadow-glow-cyan">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">
            GEMINI LifeOS
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            PERSONAL AI OPERATING SYSTEM &bull; ACCESS TERMINAL
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan" />
            <span className="text-xs text-slate-200">Instant Demo Session</span>
          </div>
          <button
            onClick={handleDemoMode}
            className="px-3 py-1 rounded-lg bg-cyan-500 text-space-950 font-mono font-bold text-xs hover:bg-cyan-400 transition"
          >
            Launch Demo
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-mono uppercase">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="commander@lifeos.ai"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-space-950 border border-slate-700 text-sm text-white focus:border-cyan outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-mono uppercase">Master Password</label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[11px] text-cyan hover:underline font-mono"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-space-950 border border-slate-700 text-sm text-white focus:border-cyan outline-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-500 text-space-950 font-bold text-sm hover:bg-cyan-400 transition shadow-glow-cyan disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google OAuth Option */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <div className="h-px bg-slate-800 flex-1" />
            <span>OR CONNECT VIA</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-space-950 border border-slate-700 hover:border-cyan-500/40 text-xs font-medium text-slate-200 hover:text-white transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"
              />
            </svg>
            <span>Google Sign-In</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 text-xs text-slate-400">
          <span>Don&apos;t have an account? </span>
          <button
            onClick={() => onNavigate('/signup')}
            className="text-cyan font-semibold hover:underline"
          >
            Create LifeOS Account
          </button>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Encrypted Session &bull; Zero Shared Data</span>
        </div>
      </div>
    </div>
  );
};
