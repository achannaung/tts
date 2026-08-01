import { pcmToWav } from './wav';
import { AmbianceType } from '../types';

/**
 * Procedural Web Audio API soundscape generator & buffer mixer for background ambiance.
 */

export interface AmbiancePreset {
  id: AmbianceType;
  name: string;
  description: string;
  iconName: string;
  badge: string;
}

export const AMBIANCE_PRESETS: AmbiancePreset[] = [
  {
    id: 'none',
    name: 'None (Pure Voice)',
    description: 'Clean dry voice recording with zero background ambiance.',
    iconName: 'VolumeX',
    badge: 'Dry',
  },
  {
    id: 'studio',
    name: 'Acoustic Studio',
    description: 'Subtle high-end studio room tone and warm acoustic depth.',
    iconName: 'Mic2',
    badge: 'Pro Voice',
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    description: 'Bustling cafe murmur, soft ambient warmth, and distant room life.',
    iconName: 'Coffee',
    badge: 'Atmospheric',
  },
  {
    id: 'office',
    name: 'Modern Office',
    description: 'Gentle HVAC air ventilation, subtle workspace hum, and crisp room acoustics.',
    iconName: 'Building2',
    badge: 'Corporate',
  },
  {
    id: 'radio',
    name: 'Radio Broadcast',
    description: 'Vintage broadcast warmth, subtle analog static, and radio texture.',
    iconName: 'Radio',
    badge: 'Media',
  },
  {
    id: 'rain',
    name: 'Soft Rain',
    description: 'Calm atmospheric rainfall and gentle window acoustics.',
    iconName: 'CloudRain',
    badge: 'Calm',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Lounge',
    description: 'Warm vinyl crackle, gentle tape hiss, and cozy analog vibe.',
    iconName: 'Disc',
    badge: 'Aesthetic',
  },
  {
    id: 'nature',
    name: 'Forest Breeze',
    description: 'Soft outdoor breeze and gentle natural resonance.',
    iconName: 'Trees',
    badge: 'Outdoor',
  },
];

// Active preview state tracking
let activePreviewStopFn: (() => void) | null = null;

/**
 * Creates noise buffer for procedural audio generation
 */
function createNoiseBuffer(ctx: BaseAudioContext, durationSec: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.ceil(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise approximation
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    channel[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  return buffer;
}

/**
 * Configures procedural Web Audio graph for a given ambiance type
 */
function buildAmbianceGraph(
  ctx: BaseAudioContext,
  type: AmbianceType,
  volumeRatio: number,
  durationSec: number
): AudioNode {
  const masterGain = ctx.createGain();
  masterGain.gain.value = Math.max(0, Math.min(1, volumeRatio * 0.35));

  if (type === 'none') {
    masterGain.gain.value = 0;
    return masterGain;
  }

  const noiseBuf = createNoiseBuffer(ctx, durationSec);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuf;
  noiseSource.loop = true;

  if (type === 'studio') {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 180;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 30;

    noiseSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(masterGain);
  } else if (type === 'cafe') {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 650;
    bandpass.Q.value = 0.8;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.4; // 0.4Hz sweep
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    noiseSource.connect(bandpass);
    bandpass.connect(masterGain);
  } else if (type === 'office') {
    const hvacOsc = ctx.createOscillator();
    hvacOsc.type = 'sine';
    hvacOsc.frequency.value = 68; // HVAC hum
    const hvacGain = ctx.createGain();
    hvacGain.gain.value = 0.15;
    hvacOsc.connect(hvacGain);
    hvacGain.connect(masterGain);
    hvacOsc.start();

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 280;

    noiseSource.connect(lowpass);
    lowpass.connect(masterGain);
  } else if (type === 'radio') {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 1.2;

    const notch = ctx.createBiquadFilter();
    notch.type = 'notch';
    notch.frequency.value = 1000;

    noiseSource.connect(bandpass);
    bandpass.connect(notch);
    notch.connect(masterGain);
  } else if (type === 'rain') {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1200;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start();

    noiseSource.connect(lowpass);
    lowpass.connect(masterGain);
  } else if (type === 'lofi') {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 500;

    // Vinyl crackle simulation
    const crackleBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
    const data = crackleBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < 0.0008) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      }
    }
    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuf;
    crackleSource.loop = true;
    crackleSource.connect(masterGain);
    crackleSource.start();

    noiseSource.connect(lowpass);
    lowpass.connect(masterGain);
  } else if (type === 'nature') {
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 450;
    bandpass.Q.value = 1.5;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    noiseSource.connect(bandpass);
    bandpass.connect(masterGain);
  } else {
    noiseSource.connect(masterGain);
  }

  noiseSource.start();
  return masterGain;
}

/**
 * Previews the chosen background ambiance for 3.5 seconds
 */
export function playAmbiancePreview(type: AmbianceType, volumePercent: number): () => void {
  if (activePreviewStopFn) {
    activePreviewStopFn();
    activePreviewStopFn = null;
  }

  if (type === 'none') return () => {};

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const duration = 3.5;
    const volumeRatio = (volumePercent / 100);

    const ambianceNode = buildAmbianceGraph(ctx, type, volumeRatio, duration);
    ambianceNode.connect(ctx.destination);

    const timer = setTimeout(() => {
      ctx.close();
      if (activePreviewStopFn === stopFn) activePreviewStopFn = null;
    }, duration * 1000);

    const stopFn = () => {
      clearTimeout(timer);
      ctx.close();
    };

    activePreviewStopFn = stopFn;
    return stopFn;
  } catch (err) {
    console.warn('Ambiance preview failed:', err);
    return () => {};
  }
}

/**
 * Mixes background ambiance into a speech PCM base64 string using OfflineAudioContext,
 * returning a new WAV base64 and object URL.
 */
export async function overlayAmbianceOnAudio(
  speechBase64: string,
  ambiance: AmbianceType,
  volumePercent = 20
): Promise<{ audioBase64: string; audioUrl: string }> {
  if (!ambiance || ambiance === 'none' || !speechBase64) {
    return {
      audioBase64: speechBase64,
      audioUrl: '',
    };
  }

  try {
    const binaryString = atob(speechBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Standard 24kHz decode context
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const tempCtx = new AudioCtx({ sampleRate: 24000 });

    // Ensure speech is valid array buffer
    let speechArrayBuf: ArrayBuffer;
    const isWav = bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x49;
    if (isWav) {
      speechArrayBuf = bytes.buffer;
    } else {
      speechArrayBuf = pcmToWav(bytes, 24000, 1, 16);
    }

    const speechAudioBuffer = await tempCtx.decodeAudioData(speechArrayBuf);
    tempCtx.close();

    const duration = speechAudioBuffer.duration;
    const sampleRate = speechAudioBuffer.sampleRate;

    // Offline Context for deterministic export render
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

    // Speech Node
    const speechSource = offlineCtx.createBufferSource();
    speechSource.buffer = speechAudioBuffer;
    speechSource.connect(offlineCtx.destination);
    speechSource.start(0);

    // Ambiance Node
    const volumeRatio = volumePercent / 100;
    const ambianceGraph = buildAmbianceGraph(offlineCtx, ambiance, volumeRatio, duration);
    ambianceGraph.connect(offlineCtx.destination);

    // Render Master Mix
    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    // Convert Float32Array to 16-bit PCM Int16
    const pcm16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const pcmBytes = new Uint8Array(pcm16.buffer);
    const wavBuffer = pcmToWav(pcmBytes, sampleRate, 1, 16);

    // Convert to Base64
    const wavBytes = new Uint8Array(wavBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < wavBytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(wavBytes.subarray(i, i + chunkSize)));
    }
    const resultBase64 = btoa(binary);

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);

    return {
      audioBase64: resultBase64,
      audioUrl,
    };
  } catch (err) {
    console.error('Failed to overlay background ambiance:', err);
    return {
      audioBase64: speechBase64,
      audioUrl: '',
    };
  }
}
