import React from 'react';
import { Sparkles, Users, Layers, Wand2, History } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  historyCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  historyCount = 0,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-1 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveTab('editor')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'editor' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Canvas</span>
      </button>

      <button
        onClick={() => setActiveTab('multi-speaker')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'multi-speaker' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Dialogue</span>
      </button>

      <button
        onClick={() => setActiveTab('batch')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'batch' ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Batch</span>
      </button>

      <button
        onClick={() => setActiveTab('clone')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'clone' ? 'text-purple-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Wand2 className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Clone</span>
      </button>

      <button
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative ${
          activeTab === 'history' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <History className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">History</span>
        {historyCount > 0 && (
          <span className="absolute top-0 right-1.5 w-3.5 h-3.5 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {historyCount > 9 ? '9+' : historyCount}
          </span>
        )}
      </button>
    </nav>
  );
};
