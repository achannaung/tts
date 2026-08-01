import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Trash2,
  Copy,
  Check,
  Type,
  FileCode,
  Info,
  Clock,
  Mic,
  Play,
  ChevronDown,
} from 'lucide-react';
import { DEFAULT_SPEAKERS } from '../data/speakers';
import { ClonedVoice } from '../types';
import { ScriptPolishModal } from './ScriptPolishModal';
import { SyncDurationModal } from './SyncDurationModal';

interface PromptEditorProps {
  text: string;
  setText: (val: string) => void;
  systemStyleInstruction: string;
  setSystemStyleInstruction: (val: string) => void;
  onPolishScript: () => void;
  isPolishing: boolean;
  speakerName: string;
  selectedSpeakerId?: string;
  onSpeakerChange?: (speakerId: string) => void;
  clonedVoices?: ClonedVoice[];
  onSynthesize?: () => void;
  isGenerating?: boolean;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  text,
  setText,
  systemStyleInstruction,
  setSystemStyleInstruction,
  onPolishScript,
  isPolishing,
  speakerName,
  selectedSpeakerId = 'algith',
  onSpeakerChange,
  clonedVoices = [],
  onSynthesize,
  isGenerating = false,
  speed = 1.0,
  onSpeedChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [isPolishModalOpen, setIsPolishModalOpen] = useState(false);
  const [isSyncDurationOpen, setIsSyncDurationOpen] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60)); // ~150 wpm

  const handleInsertTag = (tag: string) => {
    setText(text + (text.endsWith(' ') || !text ? '' : ' ') + tag + ' ');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyPolishedScript = (polishedText: string, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setText(polishedText);
    } else {
      setText(text + (text.endsWith('\n') || !text ? '' : '\n\n') + polishedText);
    }
    setIsPolishModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden">
      {/* Top Editor Toolbar */}
      <div className="min-h-12 py-2 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-slate-700 font-medium">
            <Mic className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Text Input</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-500 text-xs shrink-0">Speaker:</span>
            
            {/* Interactive Speaker Dropdown */}
            <div className="relative inline-block">
              <select
                value={selectedSpeakerId}
                onChange={(e) => onSpeakerChange && onSpeakerChange(e.target.value)}
                className="bg-gray-100 hover:bg-gray-200/80 border border-gray-300 rounded-md px-2 py-1 pr-5 text-xs font-semibold text-slate-800 outline-none cursor-pointer appearance-none transition-colors max-w-[140px] sm:max-w-none truncate"
              >
                {clonedVoices.length > 0 && (
                  <optgroup label="✨ Custom Cloned Voices">
                    {clonedVoices.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name} ({cv.voiceName})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🎙️ Google AI Studio Speakers">
                  {DEFAULT_SPEAKERS.map((spk) => (
                    <option key={spk.id} value={spk.id}>
                      {spk.name} ({spk.voiceName} • {spk.accent})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className={`px-2 py-1 text-[11px] sm:text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              showSystemPrompt
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-slate-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showSystemPrompt ? 'Hide System Direction' : '+ System Direction'}
          </button>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* AI Script Polish Button */}
          <button
            onClick={() => setIsPolishModalOpen(true)}
            disabled={!text.trim()}
            className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md transition-all flex items-center space-x-1 disabled:opacity-40 shadow-xs"
            title="Open Gemini 3.6 Flash Script Polish Studio"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">AI Polish Studio</span>
            <span className="sm:hidden">Polish</span>
          </button>

          {/* Copy Script */}
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-gray-100 transition-colors"
            title="Copy script"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Script */}
          <button
            onClick={() => setText('')}
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-gray-100 transition-colors"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* System Style Instruction Input */}
      {showSystemPrompt && (
        <div className="bg-slate-50 border-b border-gray-200 p-3 sm:p-4 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>System Style Instruction</span>
            </span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">Injected into TTS generation context</span>
          </div>
          <input
            type="text"
            value={systemStyleInstruction}
            onChange={(e) => setSystemStyleInstruction(e.target.value)}
            placeholder="e.g. Speak with high dramatic suspense, slow cadence, and warm resonance..."
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Directives & SSML Tags Quick Insertion Bar */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
          Directives:
        </span>
        <button
          onClick={() => handleInsertTag('[pause]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [pause]
        </button>
        <button
          onClick={() => handleInsertTag('[sighs]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [sighs]
        </button>
        <button
          onClick={() => handleInsertTag('[excitedly]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [excitedly]
        </button>
        <button
          onClick={() => handleInsertTag('[whispering]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [whispering]
        </button>
        <button
          onClick={() => handleInsertTag('[dramatically]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [dramatically]
        </button>
        <button
          onClick={() => handleInsertTag('[clears throat]')}
          className="px-2 py-0.5 text-xs bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded transition-colors shrink-0 font-mono"
        >
          [clears throat]
        </button>
      </div>

      {/* Main Textarea Canvas */}
      <div className="flex-1 p-3 sm:p-6 relative flex flex-col overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your script here..."
          className="w-full flex-1 p-3 sm:p-4 border border-gray-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-base sm:text-lg leading-relaxed focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none shadow-xs"
        />

        {/* Prominent Floating Generate Button */}
        {onSynthesize && (
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-10">
            <button
              onClick={onSynthesize}
              disabled={isGenerating || !text.trim()}
              className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center space-x-2 active:scale-95 ${
                isGenerating || !text.trim()
                  ? 'bg-blue-400 cursor-not-allowed opacity-80'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Audio...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate Speech</span>
                  <span className="hidden sm:inline text-[10px] bg-blue-700/80 px-2 py-0.5 rounded text-blue-100 font-mono">
                    ⌘↵
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Editor Footer Stats */}
      <div className="min-h-8 py-1.5 bg-white border-t border-gray-200 px-3 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-mono shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <span>{charCount} chars</span>
          <span>{wordCount} words</span>
          <button
            onClick={() => setIsSyncDurationOpen(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50/80 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
            title="Click to sync script to an exact target timeframe"
          >
            <Clock className="w-3 h-3 text-blue-600" />
            <span>~{estimatedSeconds}s</span>
            <span className="text-[9px] bg-blue-200/80 text-blue-800 px-1 rounded uppercase">Sync</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-400">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 text-slate-700 rounded border border-gray-200 font-semibold">
            ⌘ Enter
          </kbd>
          <span>to synthesize</span>
        </div>
      </div>

      {/* Script Polish Studio Modal */}
      <ScriptPolishModal
        initialText={text}
        isOpen={isPolishModalOpen}
        onClose={() => setIsPolishModalOpen(false)}
        onApplyPolishedScript={handleApplyPolishedScript}
      />

      {/* Sync Duration Modal */}
      <SyncDurationModal
        isOpen={isSyncDurationOpen}
        onClose={() => setIsSyncDurationOpen(false)}
        scriptText={text}
        currentSpeed={speed}
        onApplySpeed={(newSpeed) => {
          if (onSpeedChange) {
            onSpeedChange(newSpeed);
          }
        }}
      />
    </div>
  );
};
