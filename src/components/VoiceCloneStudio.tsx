import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Info,
  Radio,
  Sliders,
  Square,
  RefreshCw,
  Wand2,
  Volume2,
  Check,
  ChevronRight,
  Music,
} from 'lucide-react';
import { ClonedVoice, SpeechParameters, SpeakerProfile } from '../types';

interface VoiceCloneStudioProps {
  clonedVoices: ClonedVoice[];
  onVoiceCreated: (voice: ClonedVoice) => void;
  onVoiceDeleted: (voiceId: string) => void;
  onSelectVoiceForCanvas: (voice: ClonedVoice) => void;
  onTestClonedVoice: (voice: ClonedVoice) => void;
  isGeneratingAudio: boolean;
}

// Preset sample audio options for instant testing without uploading files
const SAMPLE_PRESETS = [
  {
    id: 'preset_docu',
    name: 'Documentary Host Sample',
    description: 'Measured, articulate narration with deep resonance and British cadence.',
    accent: 'UK',
    audioSampleUrl: 'https://actions.google.com/sounds/v1/human_voices/applause_heavy.ogg', // Sample identifier
    dummyText: 'Deep in the ancient woodlands, nature reveals its most intriguing mysteries.',
  },
  {
    id: 'preset_story',
    name: 'Warm Storyteller Sample',
    description: 'Gentle, expressive tone with cozy pacing and relaxed breathiness.',
    accent: 'US',
    audioSampleUrl: '',
    dummyText: 'Once upon a time in a quiet seaside town, the morning mist carried the scent of fresh pine.',
  },
  {
    id: 'preset_tech',
    name: 'Energetic Tech Host Sample',
    description: 'Crisp, upbeat presentation with dynamic pitch inflections and fast cadence.',
    accent: 'US',
    audioSampleUrl: '',
    dummyText: 'Welcome back everyone! Today we are looking at next-generation real-time voice synthesis.',
  },
];

export const VoiceCloneStudio: React.FC<VoiceCloneStudioProps> = ({
  clonedVoices,
  onVoiceCreated,
  onVoiceDeleted,
  onSelectVoiceForCanvas,
  onTestClonedVoice,
  isGeneratingAudio,
}) => {
  // Input method: 'upload' | 'record' | 'preset'
  const [inputMethod, setInputMethod] = useState<'upload' | 'record' | 'preset'>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileAudioUrl, setFileAudioUrl] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Preset Selection State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_docu');

  // Voice Meta
  const [voiceName, setVoiceName] = useState('My Custom Voice');
  const [voiceDescription, setVoiceDescription] = useState('Cloned voice sample analysis');

  // Async Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Audio Preview Player State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio preview
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please upload a valid audio file (WAV, MP3, M4A, WebM, OGG)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Audio file size exceeds 25MB limit. Please upload a shorter clip.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    const audioUrl = URL.createObjectURL(file);
    setFileAudioUrl(audioUrl);

    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Start Live Audio Recording
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Microphone access denied or not supported in this browser.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Trigger Voice Clone Analysis
  const handleAnalyzeAndClone = async () => {
    let payloadBase64: string | null = null;
    let payloadMimeType = 'audio/wav';

    if (inputMethod === 'upload') {
      if (!fileBase64) {
        setErrorMsg('Please select or drag an audio sample file first.');
        return;
      }
      payloadBase64 = fileBase64;
      payloadMimeType = selectedFile?.type || 'audio/wav';
    } else if (inputMethod === 'record') {
      if (!recordedBase64) {
        setErrorMsg('Please record an audio sample first.');
        return;
      }
      payloadBase64 = recordedBase64;
      payloadMimeType = 'audio/wav';
    } else if (inputMethod === 'preset') {
      // Create intelligent sample audio representation
      payloadBase64 = null; // Backend will generate profile based on preset
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setAnalysisStep('Uploading audio sample data...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisStep('Running Gemini 3.6 Flash acoustic feature extraction...');
      await new Promise((r) => setTimeout(r, 800));

      setAnalysisStep('Analyzing pitch contours, timbre resonance, and cadence...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisStep('Mapping voice profile to TTS synthesis engine...');

      const response = await fetch('/api/voice-clone/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: payloadBase64,
          mimeType: payloadMimeType,
          name: voiceName,
          description: voiceDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze voice sample');
      }

      const newClonedVoice: ClonedVoice = data.clonedVoice;
      onVoiceCreated(newClonedVoice);

      setSuccessMsg(`Successfully cloned "${newClonedVoice.name}"! Available in library.`);
      setVoiceName('My Custom Voice');
    } catch (err: any) {
      setErrorMsg(err.message || 'Voice cloning failed. Please check audio quality.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Toggle Audio Preview
  const togglePreviewPlay = (url: string) => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(url);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    } else {
      if (previewAudioRef.current.src !== url) {
        previewAudioRef.current.pause();
        previewAudioRef.current = new Audio(url);
        previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      }
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-y-auto custom-scrollbar">
      {/* Top Banner */}
      <div className="p-3 sm:p-6 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <Wand2 className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                AI Voice Cloning Studio
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Acoustic Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload short audio recordings to extract vocal timbre, pitch contours, cadence, and accent traits.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-3 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Audio Quality & Requirements Instructions Card */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-800">
              Guidelines for Optimal Voice Cloning Results
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600">
            <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-700 flex items-center space-x-1.5">
                <span>⏱️</span>
                <span>Length: 10 - 30s</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Continuous spoken text provides ideal acoustic data for timbre and pitch tracking.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-700 flex items-center space-x-1.5">
                <span>🎙️</span>
                <span>Quiet Background</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Zero background music, HVAC hum, traffic noise, or room reverberation.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-700 flex items-center space-x-1.5">
                <span>🗣️</span>
                <span>Natural Delivery</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Speak in your natural conversational voice, maintaining consistent microphone distance.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 space-y-1">
              <span className="font-bold text-blue-700 flex items-center space-x-1.5">
                <span>🎧</span>
                <span>Clear Articulation</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                High-bitrate audio (16kHz+ WAV or MP3) with single speaker and clear diction.
              </p>
            </div>
          </div>
        </div>

        {/* Studio Workspace: Input Sample & Clone Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sample Source Selection */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-sm font-bold text-slate-800">1. Provide Audio Sample</h3>
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setInputMethod('upload')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                    inputMethod === 'upload'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>

                <button
                  onClick={() => setInputMethod('record')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                    inputMethod === 'record'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record Mic</span>
                </button>

                <button
                  onClick={() => setInputMethod('preset')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
                    inputMethod === 'preset'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Presets</span>
                </button>
              </div>
            </div>

            {/* TAB 1: File Upload */}
            {inputMethod === 'upload' && (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag & drop audio sample
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Supports WAV, MP3, M4A, WebM, OGG (Max 25MB)
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {selectedFile && fileAudioUrl && (
                  <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => togglePreviewPlay(fileAudioUrl)}
                        className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-2xs shrink-0"
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setFileAudioUrl(null);
                        setFileBase64(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Live Recording */}
            {inputMethod === 'record' && (
              <div className="space-y-5 text-center p-6 border border-gray-200 bg-gray-50/50 rounded-xl">
                {!isRecording ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Mic className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Record Microphone Audio Sample
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Speak clearly into your microphone for 10-20 seconds. Read a paragraph or introduce yourself.
                      </p>
                    </div>
                    <button
                      onClick={startRecording}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-2 mx-auto"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                      <Square className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block">
                        Recording Live...
                      </span>
                      <span className="text-2xl font-mono font-bold text-slate-800 mt-1 block">
                        00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}
                      </span>
                    </div>

                    <div className="flex justify-center space-x-1 items-end h-8">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-600 rounded-full animate-bounce"
                          style={{
                            height: `${Math.max(20, Math.sin(i + recordingTime) * 100)}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={stopRecording}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center space-x-2 mx-auto"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop & Save Recording</span>
                    </button>
                  </div>
                )}

                {recordedAudioUrl && !isRecording && (
                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-left mt-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => togglePreviewPlay(recordedAudioUrl)}
                        className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 shadow-2xs shrink-0"
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Live Recorded Sample</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Duration: {recordingTime}s • High Fidelity WAV
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setRecordedAudioUrl(null);
                        setRecordedBase64(null);
                        setRecordingTime(0);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Presets */}
            {inputMethod === 'preset' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">
                  Select a pre-analyzed sample voice preset to generate a cloned voice immediately:
                </p>
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setVoiceName(preset.name);
                      setVoiceDescription(preset.description);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      selectedPresetId === preset.id
                        ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {preset.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-slate-600 rounded font-mono">
                          {preset.accent} Accent
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Voice Profile Metadata & Action Button */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-gray-200 pb-4">
                2. Voice Profile Details
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Custom Voice Name
                </label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g. Professor Vance or Narrator Voice"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Description / Notes
                </label>
                <textarea
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  placeholder="e.g. Warm documentary tone with soft cadence..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {isAnalyzing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Analyzing Audio Sample...</span>
                  </div>
                  <p className="text-[11px] font-mono text-blue-600">{analysisStep}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyzeAndClone}
              disabled={isAnalyzing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isAnalyzing ? 'Extracting Vocal DNA...' : 'Analyze & Clone Voice'}</span>
            </button>
          </div>
        </div>

        {/* Cloned Voices Library Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Custom Cloned Voices Library ({clonedVoices.length})
              </h3>
              <p className="text-xs text-slate-500">
                Your saved voice profiles created from audio samples. Use them across Canvas, Multi-Speaker, and Batch workflows.
              </p>
            </div>
          </div>

          {clonedVoices.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white text-center flex flex-col items-center justify-center space-y-2">
              <Sparkles className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Custom Cloned Voices Yet</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload or record an audio sample above and click "Analyze & Clone Voice" to create your first voice profile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clonedVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center text-white text-sm font-bold shadow-xs`}
                        >
                          {voice.name[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{voice.name}</h4>
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-medium">
                            {voice.accent} Accent • {voice.gender}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onVoiceDeleted(voice.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Delete Cloned Voice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {voice.description}
                    </p>

                    {/* Acoustic DNA Summary Box */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-500 font-mono">
                        <span>Base Matching Voice:</span>
                        <span className="font-bold text-slate-800">{voice.voiceName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 font-mono">
                        <span>Pitch / Speed:</span>
                        <span className="font-bold text-slate-800">
                          {voice.pitch > 0 ? `+${voice.pitch}%` : `${voice.pitch}%`} • {voice.speed}x
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-1 border-t border-gray-200/80 pt-1">
                        "{voice.analysisSummary}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={() => onSelectVoiceForCanvas(voice)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use in Canvas</span>
                    </button>

                    <button
                      onClick={() => onTestClonedVoice(voice)}
                      disabled={isGeneratingAudio}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1 disabled:opacity-40"
                      title="Test speech synthesis with this cloned voice"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-blue-600" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
