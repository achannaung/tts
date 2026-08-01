import React, { useState } from 'react';
import {
  Wand2,
  X,
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  BookOpen,
  Mic,
  Briefcase,
  Radio,
  Users,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface ScriptPolishModalProps {
  initialText: string;
  targetStyle?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyPolishedScript: (polishedText: string, mode: 'replace' | 'append') => void;
}

export type PolishMode = 'enhance' | 'expressive' | 'storytelling' | 'corporate' | 'broadcast' | 'dialogue';

interface PresetOption {
  id: PolishMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

const PRESETS: PresetOption[] = [
  {
    id: 'enhance',
    title: 'Natural Cadence & Rhythm',
    description: 'Improves punctuation, sentence pacing, and natural breath pauses for smooth delivery.',
    icon: <Sparkles className="w-4 h-4 text-blue-600" />,
    badge: 'Recommended',
  },
  {
    id: 'expressive',
    title: 'Expressive Directives',
    description: 'Inserts expressive cues like [pause], [sighs], [excitedly], [whispering], [dramatically].',
    icon: <Wand2 className="w-4 h-4 text-purple-600" />,
    badge: 'Performance',
  },
  {
    id: 'storytelling',
    title: 'Storyteller & Drama',
    description: 'Optimizes for audiobooks and storytelling with suspenseful beats and rich narrative rhythm.',
    icon: <BookOpen className="w-4 h-4 text-amber-600" />,
    badge: 'Audiobook',
  },
  {
    id: 'broadcast',
    title: 'Broadcast & Podcast',
    description: 'Crisp newsroom delivery with punchy emphasis and energetic opening hooks.',
    icon: <Radio className="w-4 h-4 text-emerald-600" />,
    badge: 'Media',
  },
  {
    id: 'corporate',
    title: 'Corporate & Presenter',
    description: 'Clear, concise, authoritative phrasing for e-learning, demos, and presentations.',
    icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
    badge: 'Professional',
  },
  {
    id: 'dialogue',
    title: 'Multi-Speaker Dialogue',
    description: 'Formats text into conversational lines (e.g. Narrator:, Speaker A:, Speaker B:).',
    icon: <Users className="w-4 h-4 text-rose-600" />,
    badge: 'Multi-Voice',
  },
];

export const ScriptPolishModal: React.FC<ScriptPolishModalProps> = ({
  initialText,
  targetStyle = 'expressive',
  isOpen,
  onClose,
  onApplyPolishedScript,
}) => {
  const [selectedMode, setSelectedMode] = useState<PolishMode>('enhance');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [polishedText, setPolishedText] = useState<string>('');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const wordCountOriginal = initialText.trim() ? initialText.trim().split(/\s+/).length : 0;
  const wordCountPolished = polishedText.trim() ? polishedText.trim().split(/\s+/).length : 0;

  const estSecOriginal = Math.max(1, Math.round((wordCountOriginal / 150) * 60));
  const estSecPolished = Math.max(1, Math.round((wordCountPolished / 150) * 60));

  const handleRunPolish = async () => {
    if (!initialText.trim() || isPolishing) return;
    setIsPolishing(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/ai/polish-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: initialText,
          targetStyle,
          mode: selectedMode,
          customPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to polish script');
      }

      setPolishedText(data.polishedText || initialText);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing script polish');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCopy = () => {
    if (!polishedText) return;
    navigator.clipboard.writeText(polishedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>AI Script Polish Studio</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Gemini 3.6 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Enhance cadence, add expressive performance directives, or reformat for narration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {/* Preset Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              1. Select Polish Goal & Style
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESETS.map((p) => {
                const isSelected = selectedMode === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedMode(p.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 relative ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-2 ring-blue-100'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        {p.icon}
                        <span className="text-xs font-bold text-slate-800">{p.title}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-600'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Directives Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>2. Custom Instructions (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">e.g. "Add longer pauses before punchlines"</span>
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Specify custom instructions for Gemini (e.g. make it extra dramatic, insert [whisper] on secrets)..."
              className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Generate Polish Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRunPolish}
              disabled={isPolishing || !initialText.trim()}
              className={`w-full py-2.5 px-5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 ${
                isPolishing || !initialText.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {isPolishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Polishing Script with Gemini 3.6 Flash...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Execute AI Script Polish</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Comparison View (Original vs Polished) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Original Script */}
            <div className="border border-gray-200 rounded-xl bg-slate-50 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <Mic className="w-3.5 h-3.5 text-slate-400" />
                    <span>Original Script</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {wordCountOriginal} words • ~{estSecOriginal}s
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-sans whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                  {initialText || <span className="text-slate-400 italic">No text provided...</span>}
                </div>
              </div>
            </div>

            {/* Polished Script Output */}
            <div className="border border-blue-200 rounded-xl bg-blue-50/30 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Polished Result</span>
                  </span>
                  {polishedText && (
                    <span className="text-[10px] text-blue-600 font-bold font-mono bg-blue-100 px-2 py-0.5 rounded">
                      {wordCountPolished} words • ~{estSecPolished}s
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-800 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-sans whitespace-pre-wrap bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                  {isPolishing ? (
                    <div className="flex items-center justify-center py-8 text-blue-600 space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-medium">Refining sentence rhythm & performance tags...</span>
                    </div>
                  ) : polishedText ? (
                    polishedText
                  ) : (
                    <span className="text-slate-400 italic">
                      Click "Execute AI Script Polish" above to generate a refined version.
                    </span>
                  )}
                </div>
              </div>

              {polishedText && (
                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={handleCopy}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Polished Text'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => onApplyPolishedScript(polishedText, 'append')}
              disabled={!polishedText}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors disabled:opacity-40"
            >
              Append to Canvas
            </button>
            <button
              onClick={() => onApplyPolishedScript(polishedText, 'replace')}
              disabled={!polishedText}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-40 flex items-center justify-center space-x-1.5"
            >
              <span>Replace Script in Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
