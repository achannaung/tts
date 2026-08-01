import React from 'react';
import {
  Sparkles,
  Users,
  Layers,
  History,
  Volume2,
  FileText,
  Sliders,
  ChevronRight,
  BookmarkPlus,
  Compass,
  Wand2,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { SAMPLE_SCRIPTS, SampleScript } from '../data/samples';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSample: (sample: SampleScript) => void;
  historyCount: number;
  clonedVoicesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onSelectSample,
  historyCount,
  clonedVoicesCount = 0,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none hidden lg:flex">
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Workspaces navigation */}
        <div>
          <p className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Workspaces
          </p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'editor'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Speech Canvas</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('multi-speaker')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'multi-speaker'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Multi-Speaker Studio</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'batch'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Bulk Batch Processing</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Audio History</span>
              </div>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-slate-600 border border-gray-200 rounded font-mono font-medium">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('voices')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'voices'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Volume2 className="w-4 h-4 text-pink-600" />
                <span>Voice & Speaker Library</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('clone')}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                activeTab === 'clone'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-700 hover:bg-gray-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Wand2 className="w-4 h-4 text-purple-600" />
                <span>Voice Cloning Studio</span>
              </div>
              {clonedVoicesCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-medium">
                  {clonedVoicesCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[9px] bg-blue-50 text-blue-600 border border-blue-200 rounded uppercase font-bold tracking-wider">
                  New
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div>
          <div className="px-1 flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Sample Prompts
            </span>
            <Compass className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-2">
            {SAMPLE_SCRIPTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setActiveTab('editor');
                  onSelectSample(sample);
                }}
                className="w-full p-2.5 text-left rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                    {sample.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 text-slate-500 rounded font-medium">
                    {sample.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Spec Footer */}
      <div className="p-4 border-t border-gray-200 bg-slate-50">
        <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Target Model</span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <p className="text-xs font-mono text-blue-600 font-semibold">gemini-3.1-flash-tts-preview</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
            24kHz PCM Audio • Multi-Speaker • Directional Prompts
          </p>
        </div>
      </div>
    </aside>
  );
};
