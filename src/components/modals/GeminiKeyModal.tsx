import React, { useState, useEffect } from 'react';
import { Key, Sparkles, ExternalLink, Check, AlertCircle, X, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { configureGeminiKeyApi, getAiConfigStatusApi } from '../../services/api';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: (model: string) => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gemini_api_key') || '';
      const storedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
      setApiKey(stored);
      setModel(storedModel);
      setStatus({ type: 'idle', message: '' });

      // Check live status
      getAiConfigStatusApi()
        .then(res => {
          if (res?.hasKey) {
            setStatus({
              type: 'success',
              message: `Active connection established with ${res.model || 'Gemini'}.`,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter a valid Gemini API key.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const result = await configureGeminiKeyApi(apiKey.trim(), model);
      localStorage.setItem('gemini_api_key', apiKey.trim());
      localStorage.setItem('gemini_model', model);
      setStatus({
        type: 'success',
        message: result.message || `Successfully connected to Google Gemini (${model})!`,
      });
      onKeyConfigured?.(model);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      setStatus({
        type: 'error',
        message: error.message || 'Failed to connect. Please check your API key and network.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKey(text.trim());
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setStatus({ type: 'idle', message: 'API key removed from local storage.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-space-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan shadow-glow-cyan">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Connect Google Gemini Key
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan border border-cyan-500/30">
                  Live AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unlock unrestricted multi-turn reasoning with Google's Gemini models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConnect} className="mt-5 space-y-4 relative z-10">
          {/* Key acquisition helper */}
          <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan">Don't have an API key?</span> Get one completely free in seconds from Google AI Studio.
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 text-cyan hover:underline font-mono text-[11px]"
            >
              Get Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">
                Google Gemini API Key
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-mono text-cyan hover:underline"
              >
                Paste from clipboard
              </button>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-space-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none transition"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Active Gemini Model
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-space-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 outline-none transition"
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Low Latency - Recommended)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen Gemini)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Socratic & Reasoning)</option>
            </select>
          </div>

          {/* Privacy disclaimer */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Key is securely transmitted to your local backend session only. Zero third-party tracking.</span>
          </div>

          {/* Status feedback */}
          {status.type === 'error' && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{status.message}</span>
            </div>
          )}
          {status.type === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{status.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClearKey}
                className="text-xs text-rose-400 hover:underline font-mono"
              >
                Disconnect Key
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-space-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-space-950 font-bold text-xs shadow-glow-cyan hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save & Connect
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
