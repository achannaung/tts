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
    <header className="h-14 bg-white border-b border-gray-200 px-2 sm:px-6 flex items-center justify-between select-none z-30 shrink-0 gap-1.5 sm:gap-4 overflow-x-auto no-scrollbar">
      {/* Left branding */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('editor')}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight whitespace-nowrap">Speech Studio</span>
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded uppercase tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">gemini-3.1-flash-tts-preview</p>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-gray-200 hidden md:block" />

        {/* View Mode Navigation Tabs (scrollable on mobile) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Studio Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('multi-speaker')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'multi-speaker'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Multi-Speaker</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'batch'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Bulk Batch</span>
          </button>

          <button
            onClick={() => setActiveTab('clone')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'clone'
                ? 'bg-white text-slate-800 shadow-xs border border-gray-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Voice Clone</span>
          </button>
        </nav>
      </div>

      {/* Right action controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <button
          onClick={onOpenVoiceGallery}
          className="p-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors flex items-center space-x-1.5 shadow-xs"
          title="Voice Gallery"
        >
          <Volume2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">Voice Gallery</span>
        </button>

        <button
          onClick={onOpenGetCode}
          className="p-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors flex items-center space-x-1.5 shadow-xs"
          title="Get Integration Code"
        >
          <Code2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">Get Code</span>
        </button>

        <button
          onClick={toggleParametersDrawer}
          className={`p-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center space-x-1.5 shadow-2xs ${
            isParametersOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
          }`}
          title={isParametersOpen ? "Hide Voice Settings" : "Show Voice Settings"}
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
          className={`px-2.5 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 sm:space-x-2 shadow-md ${
            isGenerating
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-blue-600/20'
          }`}
          title="Generate TTS Audio (⌘ + Enter)"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              <span className="hidden sm:inline">Generating...</span>
              <span className="sm:hidden">Gen...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="whitespace-nowrap">Generate</span>
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
