import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Volume2,
  Globe,
  Sparkles,
  Zap,
  Gauge,
  Sliders,
  Radio,
  FileAudio,
  ChevronDown,
  Info,
  X,
  Clock,
  Coffee,
  Building2,
  Mic2,
  CloudRain,
  Disc,
  Trees,
  VolumeX,
  Play,
  Square,
  Headphones,
} from 'lucide-react';
import { SpeechParameters, NarrationStyle, Accent, PrebuiltVoice, ClonedVoice, AmbianceType } from '../types';
import { DEFAULT_SPEAKERS } from '../data/speakers';
import { SyncDurationModal } from './SyncDurationModal';
import { AMBIANCE_PRESETS, playAmbiancePreview } from '../utils/ambianceSynthesizer';

interface ParametersPanelProps {
  parameters: SpeechParameters;
  onChange: (params: SpeechParameters) => void;
  isOpen: boolean;
  onClose: () => void;
  clonedVoices?: ClonedVoice[];
  scriptText?: string;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  parameters,
  onChange,
  isOpen,
  onClose,
  clonedVoices = [],
  scriptText = '',
}) => {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPreviewingAmbiance, setIsPreviewingAmbiance] = useState(false);
  const [previewStopFn, setPreviewStopFn] = useState<(() => void) | null>(null);

  const currentAmbiance = parameters.ambiance || 'none';
  const currentAmbianceVolume = parameters.ambianceVolume ?? 20;

  const handleTogglePreviewAmbiance = (ambianceType: AmbianceType, vol: number) => {
    if (isPreviewingAmbiance && previewStopFn) {
      previewStopFn();
      setPreviewStopFn(null);
      setIsPreviewingAmbiance(false);
      return;
    }

    if (ambianceType === 'none') return;

    const stopFn = playAmbiancePreview(ambianceType, vol);
    setPreviewStopFn(() => stopFn);
    setIsPreviewingAmbiance(true);

    setTimeout(() => {
      setIsPreviewingAmbiance(false);
      setPreviewStopFn(null);
    }, 3500);
  };

  if (!isOpen) return null;

  const currentSpeaker = DEFAULT_SPEAKERS.find((s) => s.id === parameters.speakerId) || DEFAULT_SPEAKERS[0];

  const handleSpeakerChange = (speakerId: string) => {
    const spk = DEFAULT_SPEAKERS.find((s) => s.id === speakerId);
    if (spk) {
      onChange({
        ...parameters,
        speakerId: spk.id,
        voiceName: spk.voiceName,
        accent: spk.accent,
      });
    }
  };

  return (
    <aside className="w-72 bg-gray-50 border-l border-gray-200 p-5 flex flex-col shrink-0 gap-6 overflow-y-auto select-none custom-scrollbar">
      {/* Header */}
      <div className="pb-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Voice Settings
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 font-semibold uppercase tracking-wider">
            Pro
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-gray-200/60 rounded-md transition-colors"
            title="Hide Voice Settings Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Speaker Profile */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Speaker Profile
          </label>

          {/* Speaker Dropdown Selector */}
          <div className="relative">
            <select
              value={parameters.speakerId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const cv = clonedVoices.find((c) => c.id === selectedId);
                if (cv) {
                  onChange({
                    ...parameters,
                    speakerId: cv.id,
                    voiceName: cv.voiceName,
                    accent: cv.accent,
                    style: cv.style,
                    speed: cv.speed,
                    pitch: cv.pitch,
                    systemStyleInstruction: cv.systemStyleInstruction,
                  });
                } else {
                  const spk = DEFAULT_SPEAKERS.find((s) => s.id === selectedId);
                  if (spk) {
                    onChange({
                      ...parameters,
                      speakerId: spk.id,
                      voiceName: spk.voiceName,
                      accent: spk.accent as any,
                    });
                  }
                }
              }}
              className="w-full bg-white border border-gray-300 hover:border-blue-400 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer appearance-none pr-8 transition-colors"
            >
              {clonedVoices.length > 0 && (
                <optgroup label="✨ Custom Cloned Voices">
                  {clonedVoices.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} ({cv.voiceName} • {cv.accent})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="🎙️ Google AI Studio Standard Speakers">
                {DEFAULT_SPEAKERS.map((spk) => (
                  <option key={spk.id} value={spk.id}>
                    {spk.name} ({spk.voiceName} • {spk.accent} {spk.gender})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {clonedVoices.length > 0 && (
              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1 mb-0.5">
                Custom Cloned Voices
              </div>
            )}
            {clonedVoices.map((cv) => (
              <button
                key={cv.id}
                onClick={() => {
                  onChange({
                    ...parameters,
                    speakerId: cv.id,
                    voiceName: cv.voiceName,
                    accent: cv.accent,
                    style: cv.style,
                    speed: cv.speed,
                    pitch: cv.pitch,
                    systemStyleInstruction: cv.systemStyleInstruction,
                  });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center space-x-3 ${
                  parameters.speakerId === cv.id
                    ? 'bg-purple-50 border-purple-300 shadow-xs'
                    : 'bg-white border-gray-200 hover:bg-gray-100/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${cv.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs`}
                >
                  {cv.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 truncate">{cv.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                      Cloned
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{cv.description}</p>
                </div>
              </button>
            ))}

            {clonedVoices.length > 0 && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-0.5">
                Standard Preset Speakers
              </div>
            )}

            {DEFAULT_SPEAKERS.map((spk) => (
              <button
                key={spk.id}
                onClick={() => handleSpeakerChange(spk.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center space-x-3 ${
                  parameters.speakerId === spk.id
                    ? 'bg-blue-50 border-blue-200 shadow-xs'
                    : 'bg-white border-gray-200 hover:bg-gray-100/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${spk.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs`}
                >
                  {spk.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{spk.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-slate-500 rounded border border-gray-200 font-medium">
                      {spk.accent}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{spk.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Accent / Locale
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['UK', 'US', 'AU', 'IN', 'CA', 'Global'] as Accent[]).map((acc) => (
              <button
                key={acc}
                onClick={() => onChange({ ...parameters, accent: acc })}
                className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                  parameters.accent === acc
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        {/* Narration Style */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Narration Style
          </label>
          <select
            value={parameters.style}
            onChange={(e) => onChange({ ...parameters, style: e.target.value as NarrationStyle })}
            className="w-full bg-white border border-gray-200 rounded-md p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
          >
            <option value="expressive">Expressive & Dynamic</option>
            <option value="emotional">Emotional & Warm</option>
            <option value="robotic">Robotic & Synthetic</option>
            <option value="dramatic">Dramatic & Cinematic</option>
            <option value="corporate">Corporate & Professional</option>
            <option value="news">News Anchor</option>
            <option value="whisper">Whisper & Soft</option>
            <option value="energetic">Energetic & Upbeat</option>
            <option value="calm">Calm & Peaceful</option>
          </select>
        </div>

        {/* Speed / Pacing Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Speed</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 transition-colors flex items-center space-x-1"
                title="Fit script into an exact target duration"
              >
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Sync Duration</span>
              </button>
              <span className="font-mono text-blue-600 font-semibold">{parameters.speed}x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={parameters.speed}
            onChange={(e) => onChange({ ...parameters, speed: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0.5x Slow</span>
            <span>1.0x Normal</span>
            <span>2.0x Fast</span>
          </div>
        </div>

        {/* Pitch Offset Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Pitch Offset</span>
            <span className="font-mono text-blue-600 font-semibold">
              {parameters.pitch > 0 ? `+${parameters.pitch}%` : `${parameters.pitch}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={parameters.pitch}
            onChange={(e) => onChange({ ...parameters, pitch: parseInt(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>-50% Low</span>
            <span>0 Natural</span>
            <span>+50% High</span>
          </div>
        </div>

        {/* Emotion Intensity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Emotion Intensity</span>
            <span className="font-mono text-blue-600 font-semibold">{parameters.emotionIntensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={parameters.emotionIntensity}
            onChange={(e) => onChange({ ...parameters, emotionIntensity: parseInt(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">Temperature</span>
            <span className="font-mono text-blue-600 font-semibold">{parameters.temperature}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={parameters.temperature}
            onChange={(e) => onChange({ ...parameters, temperature: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Background Ambiance Soundscape Selector */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Headphones className="w-3.5 h-3.5 text-blue-600" />
              <span>Background Ambiance</span>
            </label>
            {currentAmbiance !== 'none' && (
              <button
                onClick={() => handleTogglePreviewAmbiance(currentAmbiance, currentAmbianceVolume)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all flex items-center space-x-1 ${
                  isPreviewingAmbiance
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
                title="Preview soundscape loop for 3.5 seconds"
              >
                {isPreviewingAmbiance ? (
                  <>
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop Sample</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Test Sound</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {AMBIANCE_PRESETS.map((preset) => {
              const isSelected = currentAmbiance === preset.id;
              const renderIcon = () => {
                switch (preset.iconName) {
                  case 'Mic2': return <Mic2 className="w-3.5 h-3.5 text-blue-600" />;
                  case 'Coffee': return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
                  case 'Building2': return <Building2 className="w-3.5 h-3.5 text-indigo-600" />;
                  case 'Radio': return <Radio className="w-3.5 h-3.5 text-purple-600" />;
                  case 'CloudRain': return <CloudRain className="w-3.5 h-3.5 text-cyan-600" />;
                  case 'Disc': return <Disc className="w-3.5 h-3.5 text-rose-600" />;
                  case 'Trees': return <Trees className="w-3.5 h-3.5 text-emerald-600" />;
                  default: return <VolumeX className="w-3.5 h-3.5 text-slate-400" />;
                }
              };

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ ...parameters, ambiance: preset.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-1 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-2xs ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-1.5">
                      {renderIcon()}
                      <span className="text-xs font-bold text-slate-800 truncate">{preset.name}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ambiance Mix Volume Slider (when active) */}
          {currentAmbiance !== 'none' && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium text-[11px]">Ambiance Mix Level</span>
                <span className="font-mono text-blue-600 font-bold text-[11px]">{currentAmbianceVolume}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={currentAmbianceVolume}
                onChange={(e) => onChange({ ...parameters, ambianceVolume: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Subtle (5%)</span>
                <span>Medium (20%)</span>
                <span>High (60%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Export Format */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Audio Export Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...parameters, exportFormat: 'wav' })}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                parameters.exportFormat === 'wav'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div>WAV (24kHz Raw)</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Lossless Quality</div>
            </button>

            <button
              onClick={() => onChange({ ...parameters, exportFormat: 'mp3' })}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                parameters.exportFormat === 'mp3'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div>MP3 / Audio Blob</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Compressed</div>
            </button>
          </div>
        </div>

        {/* Pro Tip Box */}
        <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-lg mt-auto">
          <p className="text-xs font-bold text-blue-700 mb-1">Pro Tip</p>
          <p className="text-[10px] text-blue-600/80 leading-relaxed">
            Use inline expressive directives like <code className="bg-blue-100/60 px-1 py-0.5 rounded text-blue-800">[pause]</code> or <code className="bg-blue-100/60 px-1 py-0.5 rounded text-blue-800">[whispering]</code> to add natural nuance.
          </p>
        </div>
      </div>

      <SyncDurationModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        scriptText={scriptText}
        currentSpeed={parameters.speed}
        onApplySpeed={(newSpeed) => onChange({ ...parameters, speed: newSpeed })}
      />
    </aside>
  );
};
