import React, { useState } from 'react';
import { History, Play, Download, Trash2, Calendar, Mic, Sparkles, RotateCcw } from 'lucide-react';
import { AudioHistoryItem } from '../types';
import { downloadAudioFile } from '../utils/wav';

interface HistoryPanelProps {
  history: AudioHistoryItem[];
  onPlayItem: (item: AudioHistoryItem) => void;
  onRestoreItem: (item: AudioHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onPlayItem,
  onRestoreItem,
  onClearHistory,
}) => {
  const [filterSpeaker, setFilterSpeaker] = useState('All');

  const filteredHistory = history.filter(
    (item) => filterSpeaker === 'All' || item.speakerName === filterSpeaker
  );

  return (
    <div className="flex-1 flex flex-col bg-[#131314] overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-[#1e1f22] border-b border-[#2b2d31] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-gray-100">Audio History</h2>
            <p className="text-[11px] text-gray-400">Review past speech outputs and reload prompts</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-[#2b2d31] rounded-2xl flex flex-col items-center justify-center p-6 text-center">
            <History className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-300">No synthesized audio history yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Your speech generations will automatically be saved here for easy replay and export.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1c1d21] border border-[#2b2d31] hover:border-[#3a3d45] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-100 truncate">{item.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono">
                      {item.speakerName} ({item.parameters.accent})
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{item.text}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-mono pt-1">
                    <span>Style: {item.style}</span>
                    <span>•</span>
                    <span>Speed: {item.parameters.speed}x</span>
                    <span>•</span>
                    <span>Duration: ~{item.duration}s</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onPlayItem(item)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => onRestoreItem(item)}
                    className="p-2 text-gray-300 hover:text-white bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] rounded-lg transition-colors"
                    title="Reload into canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => downloadAudioFile(item.base64Data, `${item.title.replace(/\s+/g, '_')}.wav`)}
                    className="p-2 text-emerald-400 hover:text-emerald-300 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] rounded-lg transition-colors"
                    title="Download WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
