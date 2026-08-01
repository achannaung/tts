import React, { useState } from 'react';
import {
  Layers,
  Upload,
  Play,
  Download,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import JSZip from 'jszip';
import { BatchItem, NarrationStyle } from '../types';
import { DEFAULT_SPEAKERS } from '../data/speakers';
import { base64ToAudioUrl, downloadAudioFile } from '../utils/wav';

interface BatchProcessingProps {
  onProcessItem: (item: BatchItem) => Promise<{ audioBase64: string; duration: number }>;
}

export const BatchProcessing: React.FC<BatchProcessingProps> = ({ onProcessItem }) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    {
      id: 'b1',
      text: 'Welcome to our automated voiceover studio platform.',
      speakerId: 'algith',
      voiceName: 'Kore',
      style: 'expressive',
      status: 'idle',
      wordCount: 7,
    },
    {
      id: 'b2',
      text: 'Here you can queue hundreds of text lines for instant bulk synthesis.',
      speakerId: 'sarah',
      voiceName: 'Zephyr',
      style: 'corporate',
      status: 'idle',
      wordCount: 11,
    },
    {
      id: 'b3',
      text: 'Batch export your synthesized files into a single structured ZIP archive.',
      speakerId: 'mike',
      voiceName: 'Fenrir',
      style: 'dramatic',
      status: 'idle',
      wordCount: 10,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pastedText, setPastedText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  const completedCount = batchItems.filter((i) => i.status === 'completed').length;
  const totalCount = batchItems.length;

  const handleImportTextLines = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newItems: BatchItem[] = lines.map((line, index) => ({
      id: `imported-${Date.now()}-${index}`,
      text: line,
      speakerId: 'algith',
      voiceName: 'Kore',
      style: 'expressive',
      status: 'idle',
      wordCount: line.split(/\s+/).length,
    }));

    setBatchItems([...batchItems, ...newItems]);
    setPastedText('');
    setShowPasteModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const lines = content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const newItems: BatchItem[] = lines.map((line, index) => ({
          id: `file-${Date.now()}-${index}`,
          text: line,
          speakerId: 'sarah',
          voiceName: 'Zephyr',
          style: 'corporate',
          status: 'idle',
          wordCount: line.split(/\s+/).length,
        }));

        setBatchItems((prev) => [...prev, ...newItems]);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessAll = async () => {
    if (batchItems.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);

    const updatedItems = [...batchItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      updatedItems[i] = { ...item, status: 'generating' };
      setBatchItems([...updatedItems]);

      try {
        const res = await onProcessItem(item);
        const url = base64ToAudioUrl(res.audioBase64);

        updatedItems[i] = {
          ...item,
          status: 'completed',
          audioUrl: url,
          base64Data: res.audioBase64,
          duration: res.duration || 3,
        };
      } catch (err: any) {
        updatedItems[i] = {
          ...item,
          status: 'error',
          errorMessage: err.message || 'Generation failed',
        };
      }

      setBatchItems([...updatedItems]);
      setProgress(Math.round(((i + 1) / updatedItems.length) * 100));
    }

    setIsProcessing(false);
  };

  const handleDownloadZip = async () => {
    const completedItems = batchItems.filter((i) => i.status === 'completed' && i.base64Data);
    if (completedItems.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('synthesized_audio');

    completedItems.forEach((item, idx) => {
      if (!item.base64Data) return;
      const filename = `speech_segment_${idx + 1}_${item.speakerId}.wav`;
      // Convert base64 to binary
      const binaryString = atob(item.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      folder?.file(filename, bytes);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_ai_studio_tts_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemoveItem = (id: string) => {
    setBatchItems(batchItems.filter((i) => i.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Bulk Batch Speech Processing</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Queue multiple audio segments, process in bulk, and download as a structured ZIP
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* File Uploader */}
          <label className="px-3.5 py-2 text-xs font-medium bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import CSV / TXT</span>
            <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowPasteModal(true)}
            className="px-3.5 py-2 text-xs font-medium bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 rounded-lg transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Paste Lines</span>
          </button>

          {/* Process All */}
          <button
            onClick={handleProcessAll}
            disabled={isProcessing || batchItems.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center space-x-2 shadow-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Process All ({totalCount})</span>
              </>
            )}
          </button>

          {/* Download ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={completedCount === 0}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-30 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP ({completedCount})</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="w-full bg-blue-50/60 border-b border-blue-100 p-4">
          <div className="flex justify-between text-xs text-blue-900 font-mono font-medium mb-1.5">
            <span>Bulk Batch Processing Progress</span>
            <span>{completedCount} / {totalCount} completed ({progress}%)</span>
          </div>
          <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-6xl mx-auto w-full">
        {batchItems.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-gray-200 rounded-2xl bg-white flex flex-col items-center justify-center p-6 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No items in bulk processing queue</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Upload a text file, paste multi-line scripts, or add batch entries to generate audio at scale.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Text Segment</th>
                  <th className="p-3.5 w-36">Speaker</th>
                  <th className="p-3.5 w-28">Style</th>
                  <th className="p-3.5 w-28">Status</th>
                  <th className="p-3.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {batchItems.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-400">{index + 1}</td>
                      <td className="p-3.5">
                        <p className="text-slate-800 font-medium leading-relaxed">{item.text}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{item.wordCount} words</span>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={item.speakerId}
                          onChange={(e) => {
                            const spk = DEFAULT_SPEAKERS.find((s) => s.id === e.target.value);
                            setBatchItems(
                              batchItems.map((bi) =>
                                bi.id === item.id
                                  ? {
                                      ...bi,
                                      speakerId: e.target.value,
                                      voiceName: spk ? spk.voiceName : bi.voiceName,
                                    }
                                  : bi
                              )
                            );
                          }}
                          className="bg-gray-50 border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                        >
                          {DEFAULT_SPEAKERS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.accent})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-slate-600 rounded border border-gray-200 font-mono">
                          {item.style}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.status === 'idle' && (
                          <span className="text-slate-400 font-medium flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Idle</span>
                          </span>
                        )}
                        {item.status === 'generating' && (
                          <span className="text-blue-600 font-semibold flex items-center space-x-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating</span>
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ready</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-rose-600 font-semibold flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {item.audioUrl && (
                            <button
                              onClick={() => {
                                const audio = new Audio(item.audioUrl);
                                audio.play();
                              }}
                              className="p-1.5 hover:bg-gray-100 text-blue-600 rounded"
                              title="Play"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          {item.base64Data && (
                            <button
                              onClick={() => downloadAudioFile(item.base64Data!, `segment_${index + 1}.wav`)}
                              className="p-1.5 hover:bg-gray-100 text-emerald-600 rounded"
                              title="Download WAV"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Paste Lines for Bulk Processing</span>
            </h3>
            <p className="text-xs text-slate-500">
              Paste each audio script segment on a separate line. Each line will become an individual batch task.
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Line 1: Welcome to the studio...\nLine 2: Today we present real-time TTS..."
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-sans"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTextLines}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
              >
                Add Lines to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
