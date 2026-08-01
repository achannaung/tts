import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Repeat,
  Radio,
  Sparkles,
} from 'lucide-react';
import { downloadAudioFile } from '../utils/wav';
import { D3WaveformVisualizer } from './D3WaveformVisualizer';

interface AudioPlayerProps {
  audioUrl: string | null;
  base64Data: string | null;
  title?: string;
  speakerName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  base64Data,
  title = 'Synthesized Audio',
  speakerName = 'Algith',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio Context & Analyser
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = audioUrl;
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      if (!isLooping) setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, isLooping]);

  // Handle Play / Pause with Canvas Spectrum Visualizer
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setupAudioAnalyser();
        })
        .catch((err) => console.error('Playback error:', err));
    }
  };

  const setupAudioAnalyser = () => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      try {
        if (!sourceRef.current) {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          sourceRef.current = source;
        }
      } catch (e) {
        // Source already created or connected
      }
    }

    drawVisualizer();
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(0.5, '#4f46e5');
        gradient.addColorStop(1, '#6366f1');

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 2;
      }
    };

    renderFrame();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      audioRef.current.muted = nextMute;
    }
  };

  const handleRateChange = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        Math.max(0, audioRef.current.currentTime + seconds),
        duration
      );
    }
  };

  const handleCopyBase64 = () => {
    if (!base64Data) return;
    navigator.clipboard.writeText(base64Data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioUrl) {
    return (
      <div className="min-h-16 py-3 bg-white border-t border-gray-200 px-4 sm:px-8 flex items-center justify-between text-xs text-slate-500 font-mono select-none shrink-0 mb-12 lg:mb-0">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
          <span className="font-sans font-medium text-slate-600 text-xs sm:text-sm truncate">Awaiting TTS generation output...</span>
        </div>
        <span className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:inline">24kHz PCM Audio Engine Ready</span>
      </div>
    );
  }

  return (
    <div className="min-h-20 py-2 sm:py-3 bg-white border-t border-gray-200 px-3 sm:px-8 z-20 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-6 select-none shrink-0 mb-12 lg:mb-0">
      <audio ref={audioRef} />

      {/* Info & Canvas Spectrum Visualizer */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        {/* Play button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md transition-all active:scale-95 shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />}
        </button>

        {/* Canvas spectrum */}
        <div className="relative w-20 sm:w-28 h-8 sm:h-10 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center hidden min-[380px]:flex">
          <canvas ref={canvasRef} width={110} height={40} className="w-full h-full" />
        </div>

        <div className="min-w-0 hidden sm:block">
          <p className="text-[10px] font-bold text-blue-600 tracking-tight uppercase">REAL-TIME PREVIEW</p>
          <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{title}</p>
          <p className="text-[10px] text-slate-400 font-mono">Speaker: {speakerName} • {formatTime(duration)}</p>
        </div>
      </div>

      {/* Mobile-only compact scrub slider */}
      <div className="flex md:hidden items-center space-x-2 flex-1 min-w-[120px] font-mono text-[10px] text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => {
            const newTime = parseFloat(e.target.value);
            setCurrentTime(newTime);
            if (audioRef.current) audioRef.current.currentTime = newTime;
          }}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg accent-blue-600 cursor-pointer"
        />
        <span>{formatTime(duration)}</span>
      </div>

      {/* Center Timeline (Desktop) */}
      <div className="flex-1 max-w-xl hidden md:flex flex-col items-center space-y-1.5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSkip(-5)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-gray-100 transition-colors"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-gray-100 transition-colors"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRateChange}
            className="px-2 py-0.5 text-[11px] font-mono text-slate-700 font-semibold bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded transition-colors"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded transition-colors ${
              isLooping ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* D3.js Real-time Waveform Visualizer & Seek Bar */}
        <div className="w-full flex items-center space-x-3 font-mono text-[10px] text-slate-500">
          <span className="w-9 text-right shrink-0">{formatTime(currentTime)}</span>
          <div className="flex-1 min-w-0">
            <D3WaveformVisualizer
              audioUrl={audioUrl}
              base64Data={base64Data}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={(seekTime) => {
                setCurrentTime(seekTime);
                if (audioRef.current) {
                  audioRef.current.currentTime = seekTime;
                }
              }}
              height={44}
            />
          </div>
          <span className="w-9 shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Volume & Export Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 justify-end shrink-0">
        {/* Volume */}
        <div className="hidden xl:flex items-center space-x-2">
          <button onClick={toggleMute} className="text-slate-500 hover:text-slate-800">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 accent-blue-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Download File */}
        {base64Data && (
          <button
            onClick={() => downloadAudioFile(base64Data, `google_ai_studio_tts_${Date.now()}.wav`)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-slate-900 text-white rounded-lg font-medium text-xs hover:bg-slate-800 transition-colors shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Download WAV</span>
            <span className="sm:hidden">WAV</span>
          </button>
        )}

        {/* Copy Base64 */}
        {base64Data && (
          <button
            onClick={handleCopyBase64}
            className="p-1.5 sm:p-2.5 text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
            title="Copy Base64 Audio String"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
