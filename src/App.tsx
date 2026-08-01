import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PromptEditor } from './components/PromptEditor';
import { ParametersPanel } from './components/ParametersPanel';
import { MultiSpeakerStudio } from './components/MultiSpeakerStudio';
import { BatchProcessing } from './components/BatchProcessing';
import { VoiceCloneStudio } from './components/VoiceCloneStudio';
import { AudioPlayer } from './components/AudioPlayer';
import { GetCodeModal } from './components/GetCodeModal';
import { VoiceGalleryModal } from './components/VoiceGalleryModal';
import { HistoryPanel } from './components/HistoryPanel';
import {
  ActiveTab,
  SpeechParameters,
  AudioHistoryItem,
  SpeakerProfile,
  BatchItem,
  MultiSpeakerTurn,
  ClonedVoice,
} from './types';
import { DEFAULT_SPEAKERS } from './data/speakers';
import { base64ToAudioUrl, estimateDurationFromBase64 } from './utils/wav';
import { overlayAmbianceOnAudio } from './utils/ambianceSynthesizer';
import { SampleScript } from './data/samples';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');

  // Custom Cloned Voices State with Persistence
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>(() => {
    try {
      const saved = localStorage.getItem('ai_studio_cloned_voices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai_studio_cloned_voices', JSON.stringify(clonedVoices));
    } catch (e) {
      console.error('Failed to save cloned voices to localStorage', e);
    }
  }, [clonedVoices]);

  // Script & Parameters
  const [scriptText, setScriptText] = useState<string>(
    'Good afternoon! Welcome to Google AI Studio Text-to-Speech. Select your preferred voice, adjust speech parameters, and generate high-fidelity audio in real-time.'
  );
  const [systemStyleInstruction, setSystemStyleInstruction] = useState<string>('');

  const [parameters, setParameters] = useState<SpeechParameters>({
    voiceName: 'Kore',
    speakerId: 'algith',
    accent: 'UK',
    style: 'expressive',
    speed: 1.0,
    pitch: 0,
    emotionIntensity: 50,
    temperature: 0.7,
    systemStyleInstruction: '',
    exportFormat: 'wav',
    ambiance: 'none',
    ambianceVolume: 20,
  });

  // Player State
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState<string>('Welcome Audio');
  const [audioSpeakerName, setAudioSpeakerName] = useState<string>('Algith');

  // Async States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // Modals & Panels
  const [isGetCodeOpen, setIsGetCodeOpen] = useState(false);
  const [isVoiceGalleryOpen, setIsVoiceGalleryOpen] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(true);

  // Audio History
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);

  const clonedSpeakerMatch = clonedVoices.find((c) => c.id === parameters.speakerId);
  const currentSpeaker =
    clonedSpeakerMatch
      ? {
          id: clonedSpeakerMatch.id,
          name: clonedSpeakerMatch.name,
          voiceName: clonedSpeakerMatch.voiceName,
          accent: clonedSpeakerMatch.accent,
          gender: clonedSpeakerMatch.gender,
          description: clonedSpeakerMatch.description,
          avatarColor: clonedSpeakerMatch.avatarColor,
          tags: ['Cloned Voice'],
        }
      : DEFAULT_SPEAKERS.find((s) => s.id === parameters.speakerId) || DEFAULT_SPEAKERS[0];

  // Voice Cloning Handlers
  const handleVoiceCreated = (newVoice: ClonedVoice) => {
    setClonedVoices((prev) => [newVoice, ...prev]);
  };

  const handleVoiceDeleted = (voiceId: string) => {
    setClonedVoices((prev) => prev.filter((v) => v.id !== voiceId));
  };

  const handleSelectVoiceForCanvas = (voice: ClonedVoice) => {
    setParameters({
      ...parameters,
      speakerId: voice.id,
      voiceName: voice.voiceName,
      accent: voice.accent,
      style: voice.style,
      speed: voice.speed,
      pitch: voice.pitch,
      systemStyleInstruction: voice.systemStyleInstruction,
    });
    setSystemStyleInstruction(voice.systemStyleInstruction);
    setActiveTab('editor');
  };

  const handleSpeakerChange = (speakerId: string) => {
    const cloned = clonedVoices.find((c) => c.id === speakerId);
    if (cloned) {
      setParameters({
        ...parameters,
        speakerId: cloned.id,
        voiceName: cloned.voiceName,
        accent: cloned.accent,
        style: cloned.style,
        speed: cloned.speed,
        pitch: cloned.pitch,
        systemStyleInstruction: cloned.systemStyleInstruction,
      });
      setSystemStyleInstruction(cloned.systemStyleInstruction);
    } else {
      const spk = DEFAULT_SPEAKERS.find((s) => s.id === speakerId);
      if (spk) {
        setParameters({
          ...parameters,
          speakerId: spk.id,
          voiceName: spk.voiceName,
          accent: spk.accent as any,
        });
      }
    }
  };

  const handleTestClonedVoice = (voice: ClonedVoice) => {
    handleSelectVoiceForCanvas(voice);
    setTimeout(() => {
      handleSynthesizeSpeech();
    }, 300);
  };

  // Hotkey listener for CMD/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSynthesizeSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scriptText, parameters, activeTab]);

  // Handle Single Speech Synthesis
  const handleSynthesizeSpeech = async () => {
    if (!scriptText.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voiceName: parameters.voiceName,
          speakerName: currentSpeaker.name,
          accent: parameters.accent,
          style: parameters.style,
          speed: parameters.speed,
          pitch: parameters.pitch,
          emotionIntensity: parameters.emotionIntensity,
          temperature: parameters.temperature,
          systemStyleInstruction: systemStyleInstruction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      let finalBase64 = data.audioBase64;
      let finalAudioUrl = base64ToAudioUrl(data.audioBase64);

      if (parameters.ambiance && parameters.ambiance !== 'none') {
        const ambResult = await overlayAmbianceOnAudio(
          data.audioBase64,
          parameters.ambiance,
          parameters.ambianceVolume ?? 20
        );
        if (ambResult.audioBase64) {
          finalBase64 = ambResult.audioBase64;
          finalAudioUrl = ambResult.audioUrl || base64ToAudioUrl(ambResult.audioBase64);
        }
      }

      const estDuration = estimateDurationFromBase64(finalBase64);

      setCurrentAudioUrl(finalAudioUrl);
      setCurrentAudioBase64(finalBase64);
      setAudioTitle(scriptText.substring(0, 30) + '...');
      setAudioSpeakerName(currentSpeaker.name);

      // Save to History
      const historyItem: AudioHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: scriptText.substring(0, 35) + '...',
        text: scriptText,
        speakerName: currentSpeaker.name,
        voiceName: parameters.voiceName,
        style: parameters.style,
        audioUrl: finalAudioUrl,
        base64Data: finalBase64,
        duration: estDuration,
        parameters: { ...parameters },
      };

      setHistory((prev) => [historyItem, ...prev]);
    } catch (error: any) {
      alert(`Synthesis Error: ${error.message || 'Server error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Multi-Speaker Dialogue Synthesis
  const handleSynthesizeDialogue = async (turns: MultiSpeakerTurn[]) => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts/multi-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate dialogue audio');
      }

      const audioUrl = base64ToAudioUrl(data.audioBase64);
      const estDuration = estimateDurationFromBase64(data.audioBase64);

      setCurrentAudioUrl(audioUrl);
      setCurrentAudioBase64(data.audioBase64);
      setAudioTitle(`Dialogue (${turns.length} turns)`);
      setAudioSpeakerName('Multi-Speaker');

      // Add to history
      const historyItem: AudioHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: `Multi-Speaker Dialogue (${turns.length} turns)`,
        text: turns.map((t) => `${t.speakerName}: ${t.text}`).join(' | '),
        speakerName: 'Multi-Speaker',
        voiceName: 'Kore',
        style: 'expressive',
        audioUrl,
        base64Data: data.audioBase64,
        duration: estDuration,
        parameters: { ...parameters },
        isMultiSpeaker: true,
      };

      setHistory((prev) => [historyItem, ...prev]);
    } catch (error: any) {
      alert(`Multi-Speaker Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Process Batch Item
  const handleProcessBatchItem = async (item: BatchItem) => {
    const spk = DEFAULT_SPEAKERS.find((s) => s.id === item.speakerId) || currentSpeaker;

    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: item.text,
        voiceName: item.voiceName,
        speakerName: spk.name,
        accent: spk.accent,
        style: item.style,
        speed: parameters.speed,
        pitch: parameters.pitch,
        emotionIntensity: parameters.emotionIntensity,
        temperature: parameters.temperature,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Batch item failed');
    }

    const estDuration = estimateDurationFromBase64(data.audioBase64);
    return { audioBase64: data.audioBase64, duration: estDuration };
  };

  // AI Script Polish
  const handlePolishScript = async () => {
    if (!scriptText.trim() || isPolishing) return;
    setIsPolishing(true);

    try {
      const response = await fetch('/api/ai/polish-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          targetStyle: parameters.style,
        }),
      });

      const data = await response.json();
      if (response.ok && data.polishedText) {
        setScriptText(data.polishedText);
      }
    } catch (err) {
      console.error('Polish failed:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  // Sample Script Loader
  const handleSelectSample = (sample: SampleScript) => {
    setScriptText(sample.text);
    const spk = DEFAULT_SPEAKERS.find((s) => s.id === sample.speakerId);
    if (spk) {
      setParameters({
        ...parameters,
        speakerId: spk.id,
        voiceName: spk.voiceName,
        accent: spk.accent,
        style: sample.style as any,
      });
    }
  };

  // Test voice sample in gallery
  const handleTestVoiceSample = (spk: SpeakerProfile) => {
    const sampleText = `Hello! I am ${spk.name}, speaking with a ${spk.accent} accent. How can I assist your project today?`;
    setScriptText(sampleText);
    setParameters({
      ...parameters,
      speakerId: spk.id,
      voiceName: spk.voiceName,
      accent: spk.accent,
    });
    setActiveTab('editor');
    setTimeout(() => handleSynthesizeSpeech(), 300);
  };

  return (
    <div className="h-screen w-screen bg-[#131314] text-gray-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Google AI Studio Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSynthesize={handleSynthesizeSpeech}
        isGenerating={isGenerating}
        onOpenGetCode={() => setIsGetCodeOpen(true)}
        onOpenVoiceGallery={() => setIsVoiceGalleryOpen(true)}
        toggleParametersDrawer={() => setIsParametersOpen(!isParametersOpen)}
        isParametersOpen={isParametersOpen}
      />

      {/* Main Studio Body Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation & Sample Presets Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSelectSample={handleSelectSample}
          historyCount={history.length}
          clonedVoicesCount={clonedVoices.length}
        />

        {/* Workspace Canvas Tabs */}
        {activeTab === 'editor' && (
          <PromptEditor
            text={scriptText}
            setText={setScriptText}
            systemStyleInstruction={systemStyleInstruction}
            setSystemStyleInstruction={setSystemStyleInstruction}
            onPolishScript={handlePolishScript}
            isPolishing={isPolishing}
            speakerName={currentSpeaker.name}
            selectedSpeakerId={parameters.speakerId}
            onSpeakerChange={handleSpeakerChange}
            clonedVoices={clonedVoices}
            onSynthesize={handleSynthesizeSpeech}
            isGenerating={isGenerating}
            speed={parameters.speed}
            onSpeedChange={(newSpeed) => setParameters({ ...parameters, speed: newSpeed })}
          />
        )}

        {activeTab === 'multi-speaker' && (
          <MultiSpeakerStudio
            onSynthesizeDialogue={handleSynthesizeDialogue}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'batch' && (
          <BatchProcessing onProcessItem={handleProcessBatchItem} />
        )}

        {activeTab === 'clone' && (
          <VoiceCloneStudio
            clonedVoices={clonedVoices}
            onVoiceCreated={handleVoiceCreated}
            onVoiceDeleted={handleVoiceDeleted}
            onSelectVoiceForCanvas={handleSelectVoiceForCanvas}
            onTestClonedVoice={handleTestClonedVoice}
            isGeneratingAudio={isGenerating}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            onPlayItem={(item) => {
              setCurrentAudioUrl(item.audioUrl);
              setCurrentAudioBase64(item.base64Data);
              setAudioTitle(item.title);
              setAudioSpeakerName(item.speakerName);
            }}
            onRestoreItem={(item) => {
              setScriptText(item.text);
              setActiveTab('editor');
            }}
            onClearHistory={() => setHistory([])}
          />
        )}

        {activeTab === 'voices' && (
          <div className="flex-1 flex flex-col bg-[#f8f9fa] p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto w-full">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Voice & Speaker Library</h2>
              <p className="text-xs text-slate-500 mb-6">Select a speaker to test their voice or configure parameters for the canvas</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEFAULT_SPEAKERS.map((spk) => (
                  <div
                    key={spk.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 shadow-2xs transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${spk.avatarColor} flex items-center justify-center text-white text-sm font-bold shadow-xs`}
                        >
                          {spk.name[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{spk.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{spk.accent} Accent • {spk.gender}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{spk.description}</p>
                    </div>
                    <button
                      onClick={() => handleTestVoiceSample(spk)}
                      className="w-full py-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                    >
                      Use Speaker in Canvas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right Collapsible Parameters Side Drawer */}
        {activeTab === 'editor' && (
          <ParametersPanel
            parameters={parameters}
            onChange={setParameters}
            isOpen={isParametersOpen}
            onClose={() => setIsParametersOpen(false)}
            clonedVoices={clonedVoices}
            scriptText={scriptText}
          />
        )}
      </div>

      {/* Sticky Real-Time Audio Playback Bar */}
      <AudioPlayer
        audioUrl={currentAudioUrl}
        base64Data={currentAudioBase64}
        title={audioTitle}
        speakerName={audioSpeakerName}
      />

      {/* Modals */}
      <GetCodeModal
        parameters={parameters}
        text={scriptText}
        isOpen={isGetCodeOpen}
        onClose={() => setIsGetCodeOpen(false)}
      />

      <VoiceGalleryModal
        selectedSpeakerId={parameters.speakerId}
        onSelectSpeaker={(spk) => {
          setParameters({
            ...parameters,
            speakerId: spk.id,
            voiceName: spk.voiceName,
            accent: spk.accent,
          });
        }}
        isOpen={isVoiceGalleryOpen}
        onClose={() => setIsVoiceGalleryOpen(false)}
        onTestVoiceSample={handleTestVoiceSample}
      />
    </div>
  );
}
