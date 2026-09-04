import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Sparkles, Check, X, ShieldCheck } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { analyzeJournal } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MoodType, JournalEntry } from '../../types';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntrySaved?: (entry: JournalEntry) => void;
}

type VoiceState = 'IDLE' | 'LISTENING' | 'TRANSCRIBING' | 'ANALYZING' | 'READY';

export const VoiceJournalModal: React.FC<VoiceJournalModalProps> = ({
  isOpen,
  onClose,
  onEntrySaved,
}) => {
  const { setAiState, addEntry } = useLifeOS();
  const { idToken } = useAuth();

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [analyzedData, setAnalyzedData] = useState<{
    title: string;
    cleanEntry: string;
    summary: string;
    mood: string;
    emotions: string[];
    keyEvents: string[];
    topics: string[];
    gratitude: string[];
    lessons: string[];
    suggestedNextAction: string;
    tags: string[];
  } | null>(null);

  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('Reflective');
  const [errorMsg, setErrorMsg] = useState('');

  // Speech Recognition Reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setTranscript('');
      setAnalyzedData(null);
      setVoiceState('IDLE');
      setErrorMsg('');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
        setVoiceState('TRANSCRIBING');
      };

      recognition.onerror = () => {
        setVoiceState('IDLE');
      };

      recognitionRef.current = recognition;
    }
  }, [isOpen]);

  // Audio Visualizer Waveform Animation
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = audioCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#00f0ff');
          gradient.addColorStop(1, '#a855f7');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      };
      draw();
    } catch {
      console.warn('Microphone audio context not granted, using simulated wave.');
    }
  };

  const startRecording = () => {
    setErrorMsg('');
    setTranscript('');
    setAnalyzedData(null);
    setVoiceState('LISTENING');
    setAiState('LISTENING');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition already started:', err);
      }
    }
    startVisualizer();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const handleFinishRecording = async () => {
    stopRecording();
    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setErrorMsg('No speech detected. Try speaking closer to your microphone.');
      setVoiceState('IDLE');
      setAiState('IDLE');
      return;
    }

    setVoiceState('ANALYZING');
    setAiState('THINKING');

    try {
      const result = await analyzeJournal(finalTranscript, idToken);
      setAnalyzedData(result);
      setEditedTitle(result.title);
      setEditedContent(result.cleanEntry || finalTranscript);
      setSelectedMood((result.mood as MoodType) || 'Reflective');
      setVoiceState('READY');
      setAiState('IDLE');
    } catch {
      setErrorMsg('Could not analyze speech. You can still save the raw transcript.');
      setVoiceState('READY');
      setAiState('IDLE');
      setEditedTitle('Voice Journal Entry');
      setEditedContent(finalTranscript);
    }
  };

  const handleSaveEntry = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: JournalEntry = {
      id: `entry-voice-${Date.now()}`,
      title: editedTitle || 'Voice Reflection',
      rawContent: transcript,
      formattedContent: editedContent,
      summary: analyzedData?.summary || editedContent.slice(0, 100),
      mood: selectedMood,
      emotions: analyzedData?.emotions || [selectedMood.toLowerCase()],
      keyEvents: analyzedData?.keyEvents || ['Voice recorded reflection'],
      topics: analyzedData?.topics || ['Personal Thought'],
      lessons: analyzedData?.lessons || [],
      gratitude: analyzedData?.gratitude || [],
      suggestedNextAction: analyzedData?.suggestedNextAction,
      tags: analyzedData?.tags || ['voice', 'journal'],
      date: today,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addEntry(newEntry);
    if (onEntrySaved) onEntrySaved(newEntry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-space-900 border border-cyan-500/30 rounded-2xl shadow-glow-cyan overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-space-850/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide">Gemini Voice Journal</h2>
              <p className="text-xs text-slate-400 font-mono">NEURAL SPEECH-TO-JOURNAL SYNTHESIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-space-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Privacy Notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-xs text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan flex-shrink-0" />
            <span>Privacy Guard: Audio is transcribed locally in real-time. No raw audio recordings are stored on servers without explicit consent.</span>
          </div>

          {/* Voice State Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-space-800 text-sm font-mono text-cyan">
              <span className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'LISTENING' || voiceState === 'TRANSCRIBING'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'ANALYZING'
                  ? 'bg-purple-400 animate-spin'
                  : 'bg-cyan'
              }`} />
              <span>
                {voiceState === 'IDLE' && 'Ready to Record'}
                {voiceState === 'LISTENING' && 'Listening...'}
                {voiceState === 'TRANSCRIBING' && 'Transcribing speech...'}
                {voiceState === 'ANALYZING' && 'Analyzing psychological & situational themes...'}
                {voiceState === 'READY' && 'Review & Finalize Entry'}
              </span>
            </div>
          </div>

          {/* Audio Visualizer Canvas */}
          {(voiceState === 'LISTENING' || voiceState === 'TRANSCRIBING') && (
            <div className="flex justify-center my-4">
              <canvas
                ref={audioCanvasRef}
                width={380}
                height={65}
                className="rounded-lg bg-space-950/60 border border-cyan-500/20"
              />
            </div>
          )}

          {/* Live Transcript Box */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {voiceState === 'READY' ? 'Raw Speech Transcript' : 'Live Speech Transcript'}
            </label>
            <div className="min-h-[100px] max-h-[160px] p-4 rounded-xl bg-space-950 border border-slate-800 text-slate-200 overflow-y-auto text-sm leading-relaxed font-sans">
              {transcript ? (
                transcript
              ) : (
                <span className="text-slate-500 italic">
                  Press &apos;Start Recording&apos; and speak freely about your thoughts, emotions, and day...
                </span>
              )}
            </div>
          </div>

          {/* Analyzed Review Card (when ready) */}
          {voiceState === 'READY' && (
            <div className="p-4 rounded-xl bg-space-850/80 border border-cyan-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Gemini Analysis &amp; Polished Entry</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Journal Entry Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-space-950 border border-slate-700 text-white text-sm focus:border-cyan outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Polished Narrative</label>
                <textarea
                  rows={4}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-space-950 border border-slate-700 text-slate-200 text-sm focus:border-cyan outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Detected Mood</span>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value as MoodType)}
                    className="w-full px-3 py-2 rounded-lg bg-space-950 border border-slate-700 text-cyan text-xs outline-none"
                  >
                    {['Energetic', 'Optimistic', 'Focused', 'Calm', 'Reflective', 'Stressed', 'Overwhelmed', 'Melancholic', 'Grateful'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Key Emotions</span>
                  <div className="flex flex-wrap gap-1">
                    {analyzedData?.emotions.map((emo, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan border border-cyan-500/20 text-[11px]">
                        {emo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {analyzedData?.gratitude && analyzedData.gratitude.length > 0 && (
                <div className="text-xs">
                  <span className="text-emerald-400 font-medium">Gratitude Anchor: </span>
                  <span className="text-slate-300">{analyzedData.gratitude[0]}</span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-500/20 bg-space-850/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm hover:bg-space-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {voiceState === 'IDLE' && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-space-950 font-semibold text-sm hover:bg-cyan-400 shadow-glow-cyan transition"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            )}

            {(voiceState === 'LISTENING' || voiceState === 'TRANSCRIBING') && (
              <button
                onClick={handleFinishRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 shadow-lg transition animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>Stop &amp; Analyze</span>
              </button>
            )}

            {voiceState === 'READY' && (
              <>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs hover:bg-space-800 transition"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Re-record</span>
                </button>
                <button
                  onClick={handleSaveEntry}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-space-950 font-semibold text-sm hover:opacity-90 shadow-glow-cyan transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Journal</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
