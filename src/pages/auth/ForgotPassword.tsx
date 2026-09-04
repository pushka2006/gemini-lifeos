import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordProps {
  onNavigate: (path: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 cyber-grid">
      <div className="relative w-full max-w-md bg-space-900/90 border border-cyan-500/30 rounded-3xl p-8 glass-panel shadow-glow-cyan space-y-6">
        <button
          onClick={() => onNavigate('/login')}
          className="flex items-center gap-1.5 text-xs font-mono text-cyan hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Reset Account Key</h1>
          <p className="text-xs text-slate-400">
            Enter your registered email address to receive password reset telemetry.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Reset Transmission Dispatched</span>
            </div>
            <p className="text-slate-300">
              If an account is associated with {email}, you will receive password reset instructions shortly.
            </p>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-500 text-space-950 font-bold text-sm hover:bg-cyan-400 transition shadow-glow-cyan disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Dispatching...' : 'Send Reset Link'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
