export type PrebuiltVoice = 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck' | 'Charon' | 'Aoede' | 'Calliope' | 'Orpheus' | 'Algenib';

export type Accent = 'US' | 'UK' | 'AU' | 'IN' | 'CA' | 'Global';

export type NarrationStyle = 
  | 'expressive'
  | 'emotional'
  | 'robotic'
  | 'dramatic'
  | 'corporate'
  | 'news'
  | 'whisper'
  | 'energetic'
  | 'calm';

export type AmbianceType =
  | 'none'
  | 'studio'
  | 'cafe'
  | 'office'
  | 'radio'
  | 'rain'
  | 'lofi'
  | 'nature';

export interface SpeakerProfile {
  id: string;
  name: string;
  voiceName: PrebuiltVoice;
  accent: Accent;
  gender: 'Female' | 'Male' | 'Neutral';
  description: string;
  avatarColor: string;
  tags: string[];
}

export interface SpeechParameters {
  voiceName: PrebuiltVoice;
  speakerId: string;
  accent: Accent;
  style: NarrationStyle;
  speed: number; // 0.5 to 2.0
  pitch: number; // -50% to +50%
  emotionIntensity: number; // 0 to 100
  temperature: number; // 0.0 to 1.0
  systemStyleInstruction: string;
  exportFormat: 'wav' | 'mp3';
  ambiance?: AmbianceType;
  ambianceVolume?: number; // 0 to 100
}

export interface MultiSpeakerTurn {
  id: string;
  speakerName: string;
  voiceName: PrebuiltVoice;
  text: string;
  style?: NarrationStyle;
}

export interface BatchItem {
  id: string;
  text: string;
  speakerId: string;
  voiceName: PrebuiltVoice;
  style: NarrationStyle;
  status: 'idle' | 'generating' | 'completed' | 'error';
  audioUrl?: string;
  base64Data?: string;
  errorMessage?: string;
  duration?: number;
  wordCount?: number;
}

export interface AudioHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  text: string;
  speakerName: string;
  voiceName: PrebuiltVoice;
  style: NarrationStyle;
  audioUrl: string;
  base64Data: string;
  duration: number;
  parameters: SpeechParameters;
  isMultiSpeaker?: boolean;
}

export interface ClonedVoice {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  audioSampleUrl?: string;
  audioSampleBase64?: string;
  voiceName: PrebuiltVoice;
  accent: Accent;
  gender: 'Female' | 'Male' | 'Neutral';
  style: NarrationStyle;
  speed: number;
  pitch: number;
  systemStyleInstruction: string;
  analysisSummary: string;
  avatarColor: string;
}

export type ActiveTab = 'editor' | 'multi-speaker' | 'batch' | 'history' | 'voices' | 'clone';
