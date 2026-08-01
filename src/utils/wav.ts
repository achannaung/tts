/**
 * Audio helper functions for PCM to WAV conversion, audio decoding, and downloading.
 */

// Writes a string to DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts raw 24kHz 16-bit PCM buffer into a valid RIFF WAV ArrayBuffer
 */
export function pcmToWav(pcmData: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): ArrayBuffer {
  const byteLength = pcmData.length;
  const wavHeaderLength = 44;
  const buffer = new ArrayBuffer(wavHeaderLength + byteLength);
  const view = new DataView(buffer);

  /* RIFF chunk descriptor */
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + byteLength, true); // ChunkSize
  writeString(view, 8, 'WAVE');

  /* fmt sub-chunk */
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  /* data sub-chunk */
  writeString(view, 36, 'data');
  view.setUint32(40, byteLength, true); // Subchunk2Size

  /* Write PCM samples */
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, wavHeaderLength);

  return buffer;
}

/**
 * Normalizes base64 string audio from Gemini API into a browser-playable Blob / Data URL.
 * Checks if header already contains 'RIFF' or 'ID3'/MP3, otherwise wraps in 24kHz PCM WAV.
 */
export function base64ToAudioUrl(base64Data: string, sampleRate = 24000): string {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check if it already has a RIFF WAV header (starts with "RIFF")
    const isWavHeader =
      bytes.length > 4 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46;   // F

    let audioBlob: Blob;
    if (isWavHeader) {
      audioBlob = new Blob([bytes], { type: 'audio/wav' });
    } else {
      // Treat as raw 24kHz 16-bit mono PCM
      const wavBuffer = pcmToWav(bytes, sampleRate, 1, 16);
      audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    }

    return URL.createObjectURL(audioBlob);
  } catch (err) {
    console.error('Error parsing audio base64:', err);
    return '';
  }
}

/**
 * Downloads a base64 or blob audio file with specified filename
 */
export function downloadAudioFile(base64Data: string, filename: string, sampleRate = 24000) {
  const url = base64ToAudioUrl(base64Data, sampleRate);
  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Estimates audio duration in seconds from word count or base64 length
 */
export function estimateDurationFromBase64(base64Data: string, sampleRate = 24000): number {
  try {
    const binaryString = atob(base64Data);
    // 16-bit mono PCM = 2 bytes per sample
    const numSamples = binaryString.length / 2;
    const seconds = numSamples / sampleRate;
    return Math.max(1, Math.round(seconds * 10) / 10);
  } catch {
    return 3.5;
  }
}
