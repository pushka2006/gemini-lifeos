import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Download,
  Trash2,
  Cpu,
  Brain,
  Bell,
  AlertTriangle,
  FileText,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { useAuth } from '../context/AuthContext';
import { exportAllUserData, exportJournalCsv, deleteAllUserData } from '../services/storage';
import { configureGeminiKeyApi } from '../services/api';

export const Settings: React.FC = () => {
  const { user, idToken, signOutUser } = useAuth();
  const {
    memoryEnabled,
    setMemoryEnabled,
    autoSummarize,
    setAutoSummarize,
    selectedModel,
    setSelectedModel,
    refreshAll,
  } = useLifeOS();

  const [exportMessage, setExportMessage] = useState('');
  const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState('');

  const handleSaveKey = async () => {
    if (!customKey.trim()) return;
    setKeySaving(true);
    setKeyStatusMsg('');
    try {
      const res = await configureGeminiKeyApi(customKey.trim(), selectedModel, idToken);
      setKeyStatusMsg(res.message || '✅ Gemini API connected successfully!');
      setCustomKey('');
    } catch (err: unknown) {
      const error = err as Error;
      setKeyStatusMsg(`❌ ${error.message}`);
    } finally {
      setKeySaving(false);
    }
  };

  // Export JSON
  const handleExportJson = async () => {
    if (!user?.uid) return;
    const jsonStr = await exportAllUserData(user.uid);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-lifeos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMessage('Complete JSON vault exported successfully.');
    setTimeout(() => setExportMessage(''), 3000);
  };

  // Export CSV
  const handleExportCsv = async () => {
    if (!user?.uid) return;
    const csvStr = await exportJournalCsv(user.uid);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMessage('Journal entries CSV exported successfully.');
    setTimeout(() => setExportMessage(''), 3000);
  };

  // Wipe all user data
  const handlePurgeAllData = async () => {
    if (!user?.uid) return;
    await deleteAllUserData(user.uid);
    await refreshAll();
    setConfirmWipeOpen(false);
    setExportMessage('All personal data has been wiped.');
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/30 space-y-2">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-widest">
          <SettingsIcon className="w-4 h-4 text-cyan" />
          <span>System Parameters &bull; Privacy Sovereignty</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Workspace Settings &amp; Governance
        </h1>
        <p className="text-xs text-slate-400 max-w-xl">
          Manage your AI model configurations, privacy boundary controls, real-time memory vaults, and sovereign data export.
        </p>
      </div>

      {exportMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Section 1: Account & Identity */}
      <div className="glass-panel p-6 rounded-2xl border-cyan-500/15 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Authenticated Identity &amp; UID Isolation</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Display Name</span>
            <span className="text-white font-medium">{user?.displayName || 'LifeOS User'}</span>
          </div>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800">
            <span className="text-slate-500 block mb-1">Email Address</span>
            <span className="text-white font-medium">{user?.email || 'N/A'}</span>
          </div>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 sm:col-span-2">
            <span className="text-slate-500 block mb-1">Cryptographic UID (Firestore Boundary)</span>
            <span className="text-cyan font-mono text-[11px] break-all">{user?.uid}</span>
          </div>
        </div>
      </div>

      {/* Section 2: AI Engine Configuration & Gemini API Key */}
      <div className="glass-panel p-6 rounded-2xl border-purple-500/25 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-purple-300 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          <span>Google Gemini Engine &amp; API Key Connection</span>
        </h2>

        {/* Live Engine Status Indicator */}
        <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400 font-mono block text-[11px] uppercase">Active AI Runtime Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">
                Intelligent Conversational AI Active
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                (Natural Multi-Turn Dialogue)
              </span>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-cyan text-xs font-mono hover:underline self-start sm:self-center"
          >
            Get Free Gemini API Key &rarr;
          </a>
        </div>

        {/* Gemini API Key Input Form */}
        <div className="space-y-2 p-3.5 rounded-xl bg-space-950 border border-slate-800">
          <label className="text-xs text-slate-300 font-medium block">
            Connect Custom Google Gemini API Key (Optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="AIzaSy... (Paste Gemini API Key from Google AI Studio)"
              className="flex-1 px-3 py-2 rounded-xl bg-space-900 border border-slate-700 text-xs text-white focus:border-cyan outline-none font-mono"
            />
            <button
              onClick={handleSaveKey}
              disabled={keySaving || !customKey.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-space-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-glow-cyan"
            >
              <span>{keySaving ? 'Connecting...' : 'Connect Key'}</span>
            </button>
          </div>
          {keyStatusMsg && (
            <p className="text-[11px] font-mono text-cyan pt-1">{keyStatusMsg}</p>
          )}
          <p className="text-[10px] text-slate-400 leading-tight">
            Key is sent strictly to your local server backend and never exposed in browser clients. When active, multi-turn streaming connects directly to Google Gemini cloud.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-space-950 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Gemini Model Choice</p>
              <p className="text-[11px] text-slate-400">Select model architecture for reasoning and summaries</p>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-space-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-cyan font-mono outline-none"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-Fast)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Privacy & Long-term Cognition */}
      <div className="glass-panel p-6 rounded-2xl border-emerald-500/15 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>Privacy Sovereignty &amp; Retention Controls</span>
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Personal Long-Term Memory</p>
              <p className="text-[11px] text-slate-400">Injects verified user preferences &amp; facts into chat prompts</p>
            </div>
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              className="w-4 h-4 accent-cyan"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-space-950 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Automated Conversation Summarization</p>
              <p className="text-[11px] text-slate-400">Generates executive summaries after reaching conversation thresholds</p>
            </div>
            <input
              type="checkbox"
              checked={autoSummarize}
              onChange={(e) => setAutoSummarize(e.target.checked)}
              className="w-4 h-4 accent-cyan"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Data Export & Portability */}
      <div className="glass-panel p-6 rounded-2xl border-cyan-500/15 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-cyan flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Data Sovereign Export</span>
        </h2>
        <p className="text-xs text-slate-400">
          Export your complete personal knowledge archive at any time in standard, machine-readable formats.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 text-xs text-slate-200 font-mono transition"
          >
            <Database className="w-3.5 h-3.5 text-cyan" />
            <span>Export All (JSON)</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-slate-700 text-xs text-slate-200 font-mono transition"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Export Journal (CSV)</span>
          </button>
        </div>
      </div>

      {/* Section 5: Danger Zone */}
      <div className="glass-panel p-6 rounded-2xl border-rose-500/30 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Account &amp; Vault Purge</span>
        </h2>
        <p className="text-xs text-slate-400">
          Permanently eradicate all journal entries, conversation histories, memories, goals, and tasks associated with your UID.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setConfirmWipeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-mono transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Personal Data</span>
          </button>
          <button
            onClick={signOutUser}
            className="px-4 py-2 rounded-xl bg-space-850 border border-slate-700 text-xs text-slate-300 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Confirm Wipe Modal */}
      {confirmWipeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-space-900 border border-rose-500/50 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Irreversible Data Purge</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you completely certain? All journal records, memories, conversations, goals, and tasks will be erased immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmWipeOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeAllData}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
              >
                Confirm Eradication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
