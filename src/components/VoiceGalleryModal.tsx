import React, { useState } from 'react';
import { Volume2, Play, Check, Search, Filter, Globe, X } from 'lucide-react';
import { DEFAULT_SPEAKERS } from '../data/speakers';
import { SpeakerProfile, Accent } from '../types';

interface VoiceGalleryModalProps {
  selectedSpeakerId: string;
  onSelectSpeaker: (speaker: SpeakerProfile) => void;
  isOpen: boolean;
  onClose: () => void;
  onTestVoiceSample: (speaker: SpeakerProfile) => void;
  isTestingVoice?: boolean;
}

export const VoiceGalleryModal: React.FC<VoiceGalleryModalProps> = ({
  selectedSpeakerId,
  onSelectSpeaker,
  isOpen,
  onClose,
  onTestVoiceSample,
  isTestingVoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccent, setSelectedAccent] = useState<string>('All');

  if (!isOpen) return null;

  const filteredSpeakers = DEFAULT_SPEAKERS.filter((spk) => {
    const matchesSearch =
      spk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAccent = selectedAccent === 'All' || spk.accent === selectedAccent;

    return matchesSearch && matchesAccent;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Voice & Speaker Gallery</h3>
              <p className="text-xs text-slate-500">
                Explore distinct voice profiles, accents, and narration tones for Gemini TTS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-gray-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search speakers by name, accent (British, US), or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Accent:</span>
            {['All', 'UK', 'US', 'Global'].map((acc) => (
              <button
                key={acc}
                onClick={() => setSelectedAccent(acc)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedAccent === acc
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        {/* Speakers Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpeakers.map((spk) => {
            const isSelected = selectedSpeakerId === spk.id;

            return (
              <div
                key={spk.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${spk.avatarColor} flex items-center justify-center text-white text-sm font-bold shadow-xs`}
                      >
                        {spk.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-slate-800">{spk.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 text-slate-600 rounded border border-gray-200">
                            {spk.accent} • {spk.gender}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Voice Name: <strong className="text-slate-700">{spk.voiceName}</strong>
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs bg-blue-600 text-white p-1 rounded-full shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{spk.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {spk.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-gray-100 text-slate-500 rounded-md border border-gray-200 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => onTestVoiceSample(spk)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <Play className="w-3 h-3 fill-current text-blue-600" />
                    <span>Test Voice Sample</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectSpeaker(spk);
                      onClose();
                    }}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isSelected ? 'Active Speaker' : 'Select Speaker'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
