import React from 'react';
import { Volume2, Code2, Sparkles, Share2, Play, Users, Layers, SlidersHorizontal, Wand2 } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSynthesize: () => void;
  isGenerating: boolean;
  onOpenGetCode: () => void;
  onOpenVoiceGallery: () => void;
  toggleParametersDrawer: () => void;
  isParametersOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onSynthesize,
  isGenerating,
  onOpenGetCode,
  onOpenVoiceGallery,
  toggleParametersDrawer,
  isParametersOpen,
}) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('editor')}>
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-800 tracking-tight">Speech AI Studio</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded uppercase tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400">gemini-3.1-flash-tts-preview</p>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-gray-200 mx-1" />

        {/* View Mode Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-slate-800 shadow-sm border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Studio Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('multi-speaker')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'multi-speaker'
                ? 'bg-white text-slate-800 shadow-sm border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multi-Speaker</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'batch'
                ? 'bg-white text-slate-800 shadow-sm border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Bulk Batch</span>
          </button>

          <button
            onClick={() => setActiveTab('clone')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'clone'
                ? 'bg-white text-slate-800 shadow-sm border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Voice Clone</span>
          </button>
        </nav>
      </div>

      {/* Right action controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenVoiceGallery}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          <Volume2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Voice Gallery</span>
        </button>

        <button
          onClick={onOpenGetCode}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          <Code2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Get Code</span>
        </button>

        <button
          onClick={toggleParametersDrawer}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center space-x-1.5 shadow-2xs ${
            isParametersOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
          }`}
          title={isParametersOpen ? "Hide Voice Settings Pane" : "Show Voice Settings Pane"}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">
            {isParametersOpen ? 'Hide Voice Settings' : 'Show Voice Settings'}
          </span>
        </button>

        {/* Primary Generate Speech button */}
        <button
          onClick={onSynthesize}
          disabled={isGenerating}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center space-x-2 shadow-md ${
            isGenerating
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-blue-600/20'
          }`}
          title="Generate TTS Audio (⌘ + Enter)"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Audio...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate Speech</span>
              <span className="hidden lg:inline text-[10px] bg-blue-700/80 px-1.5 py-0.5 rounded text-blue-100 font-mono">
                ⌘↵
              </span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
