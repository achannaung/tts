import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Check,
  X,
  Sparkles,
  Sliders,
  AlertTriangle,
  ArrowRight,
  Gauge,
  RotateCcw,
} from 'lucide-react';

interface SyncDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  currentSpeed: number;
  onApplySpeed: (newSpeed: number) => void;
}

const PRESET_DURATIONS = [
  { label: '10s', seconds: 10, tag: 'Social Ad Hook' },
  { label: '15s', seconds: 15, tag: 'TV/Radio Spot' },
  { label: '30s', seconds: 30, tag: 'Standard Commercial' },
  { label: '60s', seconds: 60, tag: 'Explainer / Story' },
];

export const SyncDurationModal: React.FC<SyncDurationModalProps> = ({
  isOpen,
  onClose,
  scriptText,
  currentSpeed,
  onApplySpeed,
}) => {
  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  // Natural speech speed baseline ~150 words per minute (2.5 wps)
  const baselineSeconds = Math.max(1, Math.round((wordCount / 150) * 60));

  const [targetSeconds, setTargetSeconds] = useState<number>(
    baselineSeconds > 0 ? baselineSeconds : 30
  );

  useEffect(() => {
    if (baselineSeconds > 0) {
      setTargetSeconds(baselineSeconds);
    }
  }, [scriptText]);

  if (!isOpen) return null;

  // Calculate raw required speed multiplier
  const rawRequiredSpeed = targetSeconds > 0 ? baselineSeconds / targetSeconds : 1.0;
  // Round to nearest 0.05
  const roundedSpeed = Math.round(rawRequiredSpeed * 20) / 20;
  // Clamp between 0.5 and 2.0
  const clampedSpeed = Math.min(2.0, Math.max(0.5, roundedSpeed));

  const isTooFast = rawRequiredSpeed > 2.0;
  const isTooSlow = rawRequiredSpeed < 0.5;

  const handleApply = () => {
    onApplySpeed(clampedSpeed);
    onClose();
  };

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>Sync Script Duration</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Auto Timing
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Fit your script speech into an exact target timeframe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Script Overview */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Script
              </span>
              <div className="text-xs font-semibold text-slate-700">
                {wordCount} words ({scriptText.length} characters)
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Natural Duration (1.0x)
              </span>
              <div className="text-xs font-mono font-bold text-blue-600">
                ~{formatMinSec(baselineSeconds)}
              </div>
            </div>
          </div>

          {/* Target Duration Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              1. Choose Target Duration
            </label>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    onClick={() => setTargetSeconds(preset.seconds)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-bold font-mono">{preset.label}</div>
                    <div
                      className={`text-[9px] truncate mt-0.5 ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {preset.tag}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Duration Slider */}
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Custom Target Seconds:</span>
                <span className="font-mono text-blue-600 font-bold text-sm">
                  {formatMinSec(targetSeconds)}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="1"
                value={targetSeconds}
                onChange={(e) => setTargetSeconds(parseInt(e.target.value) || 5)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5s (Bumper)</span>
                <span>30s (Mid)</span>
                <span>60s (Standard)</span>
                <span>180s (3m)</span>
              </div>
            </div>
          </div>

          {/* Sync Calculation Result */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Calculated Speed Multiplier</span>
              </div>
              <span className="text-lg font-extrabold font-mono text-blue-700">
                {clampedSpeed.toFixed(2)}x
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              To fit {wordCount} words into <strong className="text-slate-800">{formatMinSec(targetSeconds)}</strong>, speech rate will be set to <strong className="text-blue-700 font-mono">{clampedSpeed.toFixed(2)}x</strong> speed.
            </div>

            {/* Warnings / Guidance */}
            {isTooFast && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Script requires <strong>{rawRequiredSpeed.toFixed(2)}x</strong> speed to fit in {targetSeconds}s. Capped at maximum supported speed of <strong>2.0x</strong>.
                </span>
              </div>
            )}

            {isTooSlow && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Script is short for {targetSeconds}s duration. Capped at minimum supported speed of <strong>0.5x</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <span>Apply {clampedSpeed.toFixed(2)}x Speed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
