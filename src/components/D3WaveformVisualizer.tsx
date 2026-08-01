import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface D3WaveformVisualizerProps {
  audioUrl: string | null;
  base64Data: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  height?: number;
}

export const D3WaveformVisualizer: React.FC<D3WaveformVisualizerProps> = ({
  audioUrl,
  base64Data,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  height = 48,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [peaks, setPeaks] = useState<number[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(500);

  // 1. Decode Audio Waveform Peaks or Generate Deterministic Pattern
  useEffect(() => {
    let isCancelled = false;

    const extractPeaks = async () => {
      if (!audioUrl) {
        setPeaks([]);
        return;
      }

      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (isCancelled) return;

        const rawData = audioBuffer.getChannelData(0);
        const samplesCount = 100;
        const blockSize = Math.floor(rawData.length / samplesCount);
        const extractedPeaks: number[] = [];

        for (let i = 0; i < samplesCount; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j += 4) {
            sum += Math.abs(rawData[blockStart + j] || 0);
          }
          extractedPeaks.push(sum / (blockSize / 4));
        }

        const maxPeak = Math.max(...extractedPeaks, 0.001);
        const normalized = extractedPeaks.map((p) => Math.max(0.08, p / maxPeak));

        setPeaks(normalized);
        audioCtx.close();
      } catch (err) {
        console.warn('Audio decoding fallback to acoustic pattern:', err);
        // Fallback pattern if decode fails
        const fallback = Array.from({ length: 90 }, (_, i) => {
          const sinVal = Math.sin((i / 90) * Math.PI);
          const noise = 0.2 + 0.8 * Math.abs(Math.sin(i * 12.345));
          return Math.max(0.12, sinVal * noise);
        });
        if (!isCancelled) setPeaks(fallback);
      }
    };

    extractPeaks();

    return () => {
      isCancelled = true;
    };
  }, [audioUrl, base64Data]);

  // Fallback default peaks if audio not decoded yet
  const displayPeaks = peaks.length > 0
    ? peaks
    : Array.from({ length: 90 }, (_, i) => Math.max(0.15, Math.sin((i / 90) * Math.PI) * (0.3 + 0.7 * (i % 3 === 0 ? 0.9 : 0.4))));

  // 2. Resize Observer for fluid responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect) {
        setContainerWidth(Math.max(200, entries[0].contentRect.width));
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Render D3 Waveform
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || containerWidth <= 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const w = containerWidth;
    const h = height;

    const xScale = d3.scaleLinear().domain([0, displayPeaks.length]).range([0, w]);
    const barWidth = Math.max(2, (w / displayPeaks.length) - 1.5);

    const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const currentBarIndex = Math.floor(progressRatio * displayPeaks.length);

    // SVG Defs for Gradients
    const defs = svg.append('defs');

    // Played Waveform Gradient
    const playedGrad = defs.append('linearGradient')
      .attr('id', 'played-waveform-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    playedGrad.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
    playedGrad.append('stop').attr('offset', '50%').attr('stop-color', '#4f46e5');
    playedGrad.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb');

    // Active Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'playhead-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Group for Waveform Bars
    const gBars = svg.append('g').attr('class', 'waveform-bars');

    // Center baseline rendering
    const centerY = h / 2;

    displayPeaks.forEach((peak, i) => {
      const x = xScale(i);
      const isPlayed = i <= currentBarIndex;
      const amplitude = peak * (h * 0.42);

      gBars.append('rect')
        .attr('x', x)
        .attr('y', centerY - amplitude)
        .attr('width', barWidth)
        .attr('height', amplitude * 2)
        .attr('rx', Math.min(2, barWidth / 2))
        .attr('ry', Math.min(2, barWidth / 2))
        .attr('fill', isPlayed ? 'url(#played-waveform-grad)' : '#cbd5e1')
        .attr('opacity', isPlayed ? 1 : 0.7)
        .style('transition', 'fill 150ms ease, opacity 150ms ease');
    });

    // Playhead Vertical Line
    const playheadX = progressRatio * w;

    if (duration > 0) {
      // Glow line
      svg.append('line')
        .attr('x1', playheadX)
        .attr('y1', 2)
        .attr('x2', playheadX)
        .attr('y2', h - 2)
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#playhead-glow)');

      // Top handle circle
      svg.append('circle')
        .attr('cx', playheadX)
        .attr('cy', 4)
        .attr('r', 4)
        .attr('fill', '#1d4ed8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      // Bottom handle circle
      svg.append('circle')
        .attr('cx', playheadX)
        .attr('cy', h - 4)
        .attr('r', 4)
        .attr('fill', '#1d4ed8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

  }, [displayPeaks, currentTime, duration, containerWidth, height]);

  // Helper for converting mouse position to seek time
  const calculateTimeFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return { time: 0, x: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    return { time: ratio * duration, x };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    setIsDragging(true);
    const { time } = calculateTimeFromEvent(e);
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const { time, x } = calculateTimeFromEvent(e);
    setHoverTime(time);
    setHoverX(x);

    if (isDragging) {
      onSeek(time);
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      className="relative w-full h-12 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 flex items-center justify-center cursor-pointer select-none group hover:border-blue-300 transition-colors"
      title="Click or drag on waveform to seek"
    >
      <svg
        ref={svgRef}
        width={containerWidth}
        height={height}
        className="w-full h-full overflow-visible"
      />

      {/* Hover Hoverline & Tooltip */}
      {hoverX !== null && hoverTime !== null && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
          style={{ left: `${hoverX}px` }}
        >
          {/* Dashed Hover Line */}
          <div className="w-px h-full border-r border-dashed border-blue-500/80" />

          {/* Floating Time Badge */}
          <div className="absolute -top-7 bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap transform -translate-x-1/2">
            {formatTime(hoverTime)}
          </div>
        </div>
      )}
    </div>
  );
};
