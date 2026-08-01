import React, { useState } from 'react';
import { Users, Plus, Trash2, Play, Sparkles, MoveUp, MoveDown, Volume2 } from 'lucide-react';
import { MultiSpeakerTurn, PrebuiltVoice } from '../types';
import { DEFAULT_SPEAKERS } from '../data/speakers';

interface MultiSpeakerStudioProps {
  onSynthesizeDialogue: (turns: MultiSpeakerTurn[]) => void;
  isGenerating: boolean;
}

export const MultiSpeakerStudio: React.FC<MultiSpeakerStudioProps> = ({
  onSynthesizeDialogue,
  isGenerating,
}) => {
  const [turns, setTurns] = useState<MultiSpeakerTurn[]>([
    {
      id: '1',
      speakerName: 'Algith',
      voiceName: 'Kore',
      text: 'Good afternoon, Sarah! Have you analyzed the latest Gemini Text-to-Speech benchmark data?',
    },
    {
      id: '2',
      speakerName: 'Sarah',
      voiceName: 'Zephyr',
      text: 'Yes Algith, the latency reductions and multi-speaker voice synthesis capabilities are remarkably impressive.',
    },
    {
      id: '3',
      speakerName: 'Algith',
      voiceName: 'Kore',
      text: 'Fascinating. Let us run a full batch synthesis test immediately.',
    },
  ]);

  const handleAddTurn = () => {
    const lastTurn = turns[turns.length - 1];
    const nextSpeaker = lastTurn?.speakerName === 'Algith' ? 'Sarah' : 'Algith';
    const nextVoice: PrebuiltVoice = nextSpeaker === 'Sarah' ? 'Zephyr' : 'Kore';

    setTurns([
      ...turns,
      {
        id: Date.now().toString(),
        speakerName: nextSpeaker,
        voiceName: nextVoice,
        text: '',
      },
    ]);
  };

  const handleUpdateTurn = (id: string, field: keyof MultiSpeakerTurn, value: any) => {
    setTurns(
      turns.map((t) => {
        if (t.id === id) {
          if (field === 'speakerName') {
            const spk = DEFAULT_SPEAKERS.find((s) => s.name === value);
            return {
              ...t,
              speakerName: value,
              voiceName: spk ? spk.voiceName : t.voiceName,
            };
          }
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  };

  const handleDeleteTurn = (id: string) => {
    if (turns.length <= 1) return;
    setTurns(turns.filter((t) => t.id !== id));
  };

  const handleMoveTurn = (index: number, direction: 'up' | 'down') => {
    const newTurns = [...turns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTurns.length) return;

    const temp = newTurns[index];
    newTurns[index] = newTurns[targetIndex];
    newTurns[targetIndex] = temp;
    setTurns(newTurns);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Multi-Speaker Dialogue Studio</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Construct realistic multi-person conversations powered by Gemini native multiSpeakerVoiceConfig
          </p>
        </div>

        <button
          onClick={() => onSynthesizeDialogue(turns)}
          disabled={isGenerating || turns.some((t) => !t.text.trim())}
          className="px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center space-x-2 shadow-xs disabled:opacity-40"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Dialogue...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Synthesize Multi-Speaker Audio</span>
            </>
          )}
        </button>
      </div>

      {/* Turn List Container */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-4 max-w-4xl mx-auto w-full">
        {turns.map((turn, index) => {
          const speakerObj = DEFAULT_SPEAKERS.find((s) => s.name === turn.speakerName) || DEFAULT_SPEAKERS[0];

          return (
            <div
              key={turn.id}
              className="p-5 rounded-xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${speakerObj.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-xs`}
                  >
                    {turn.speakerName[0]}
                  </div>

                  {/* Speaker Picker */}
                  <select
                    value={turn.speakerName}
                    onChange={(e) => handleUpdateTurn(turn.id, 'speakerName', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {DEFAULT_SPEAKERS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.accent} • {s.voiceName})
                      </option>
                    ))}
                  </select>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Voice: <strong className="text-blue-600 font-semibold">{turn.voiceName}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveTurn(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 hover:bg-gray-100 rounded text-slate-500 disabled:opacity-20"
                    title="Move turn up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveTurn(index, 'down')}
                    disabled={index === turns.length - 1}
                    className="p-1.5 hover:bg-gray-100 rounded text-slate-500 disabled:opacity-20"
                    title="Move turn down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTurn(turn.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete turn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                value={turn.text}
                onChange={(e) => handleUpdateTurn(turn.id, 'text', e.target.value)}
                placeholder={`Type ${turn.speakerName}'s dialogue line here...`}
                rows={2}
                className="w-full bg-gray-50/60 border border-gray-200 rounded-lg p-3 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-sans leading-relaxed"
              />
            </div>
          );
        })}

        {/* Add Turn Button */}
        <button
          onClick={handleAddTurn}
          className="w-full py-3.5 rounded-xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 text-xs font-semibold text-blue-600 transition-all flex items-center justify-center space-x-2 bg-white"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dialogue Line</span>
        </button>
      </div>
    </div>
  );
};
