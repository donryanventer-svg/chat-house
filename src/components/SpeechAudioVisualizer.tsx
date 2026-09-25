import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Activity,
  BarChart3,
  Waves,
  Disc,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { speechAudioEngine, SpeechVocalStats } from '../utils/speechAudioEngine';
import { VoiceSettings } from '../types';

export type VisualizerMode = 'spectrum' | 'waveform' | 'ribbon' | 'radial';
export type VisualizerTheme = 'accent' | 'cyan' | 'magenta' | 'emerald';

interface SpeechAudioVisualizerProps {
  currentText: string;
  activeMessageId: string | null;
  voiceSettings?: VoiceSettings;
  onStop: () => void;
  onPauseToggle?: () => void;
  onReplay?: () => void;
}

export const SpeechAudioVisualizer: React.FC<SpeechAudioVisualizerProps> = ({
  currentText,
  activeMessageId,
  voiceSettings,
  onStop,
  onPauseToggle,
  onReplay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engineState, setEngineState] = useState({
    isRunning: speechAudioEngine.getIsRunning(),
    isPaused: speechAudioEngine.getIsPaused(),
    word: '',
  });

  const [mode, setMode] = useState<VisualizerMode>('spectrum');
  const [theme, setTheme] = useState<VisualizerTheme>('accent');
  const [sensitivity, setSensitivity] = useState<number>(1.4);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [stats, setStats] = useState<SpeechVocalStats>({
    rms: 0,
    energy: 0,
    peakFreq: 0,
    decibels: -60,
  });

  // Track peak caps for spectrum bars
  const peaksRef = useRef<number[]>([]);
  const animIdRef = useRef<number | null>(null);

  // Subscribe to engine state
  useEffect(() => {
    const unsubscribe = speechAudioEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => unsubscribe();
  }, []);

  // Theme color definitions
  const themeColors = {
    accent: {
      primary: '#e5a93c',
      glow: 'rgba(229, 169, 60, 0.45)',
      gradientTop: '#ffd277',
      gradientBottom: '#b87c14',
      bgGlow: 'rgba(229, 169, 60, 0.08)',
    },
    cyan: {
      primary: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.5)',
      gradientTop: '#a6fbff',
      gradientBottom: '#008599',
      bgGlow: 'rgba(0, 240, 255, 0.08)',
    },
    magenta: {
      primary: '#ff2d78',
      glow: 'rgba(255, 45, 120, 0.5)',
      gradientTop: '#ff94be',
      gradientBottom: '#b30043',
      bgGlow: 'rgba(255, 45, 120, 0.08)',
    },
    emerald: {
      primary: '#10b981',
      glow: 'rgba(16, 185, 129, 0.5)',
      gradientTop: '#6ee7b7',
      gradientBottom: '#047857',
      bgGlow: 'rgba(16, 185, 129, 0.08)',
    },
  }[theme];

  // Real-time animation loop reading directly from Web Audio API AnalyserNode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameCount = 0;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with slight dark fade for motion blur
      ctx.fillStyle = 'rgba(8, 8, 8, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const isRunning = speechAudioEngine.getIsRunning();
      const isPaused = speechAudioEngine.getIsPaused();

      // Read real Web Audio data
      const freqData = speechAudioEngine.getFrequencyData();
      const timeData = speechAudioEngine.getTimeDomainData();

      // Periodically update telemetry stats
      frameCount++;
      if (frameCount % 6 === 0) {
        setStats(speechAudioEngine.getAudioStats());
      }

      const activeColor = themeColors;

      if (mode === 'spectrum') {
        // === MODE 1: FREQUENCY SPECTRUM (EQUALIZER BARS WITH SMOOTH PEAK CAPS) ===
        const barCount = Math.min(48, Math.floor(width / 6));
        const barWidth = Math.max(3, (width - (barCount - 1) * 2) / barCount);
        const step = Math.floor(freqData.length / barCount);

        // Ensure peaks array is properly sized
        if (peaksRef.current.length !== barCount) {
          peaksRef.current = new Array(barCount).fill(0);
        }

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, activeColor.gradientBottom);
        gradient.addColorStop(0.65, activeColor.primary);
        gradient.addColorStop(1, activeColor.gradientTop);

        for (let i = 0; i < barCount; i++) {
          const rawVal = isRunning && !isPaused ? freqData[i * step] || 0 : 4;
          const boosted = Math.min(255, rawVal * sensitivity);
          const barHeight = Math.max(3, (boosted / 255) * (height - 14));

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Render bar
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Update and render peak cap
          if (barHeight > (peaksRef.current[i] || 0)) {
            peaksRef.current[i] = barHeight;
          } else {
            peaksRef.current[i] = Math.max(0, (peaksRef.current[i] || 0) - 1.2);
          }

          const peakY = height - (peaksRef.current[i] || 0) - 2;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = activeColor.glow;
          ctx.shadowBlur = 6;
          ctx.fillRect(x, peakY, barWidth, 2);
          ctx.shadowBlur = 0;
        }
      } else if (mode === 'waveform') {
        // === MODE 2: OSCILLOSCOPE TIME-DOMAIN WAVEFORM ===
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = activeColor.primary;
        ctx.shadowColor = activeColor.glow;
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = isRunning && !isPaused ? timeData[i] / 128.0 : 1.0;
          const centered = (v - 1.0) * sensitivity + 1.0;
          const y = (centered * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Subtle baseline center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (mode === 'ribbon') {
        // === MODE 3: HOLOGRAPHIC VOCAL RIBBON / DUAL SINE ENERGY WAVE ===
        const centerY = height / 2;
        const segments = 60;
        const segmentWidth = width / segments;

        const time = Date.now() * 0.004;
        const rms = isRunning && !isPaused ? stats.rms * sensitivity : 0.04;

        // Draw multiple harmonic energy ribbon waves
        for (let waveIndex = 0; waveIndex < 3; waveIndex++) {
          const alpha = 0.9 - waveIndex * 0.28;
          const freqMult = 1.2 + waveIndex * 0.9;
          const phase = time * (1.2 + waveIndex * 0.4);

          ctx.beginPath();
          ctx.strokeStyle = activeColor.primary;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 2 - waveIndex * 0.4;
          ctx.shadowColor = activeColor.glow;
          ctx.shadowBlur = 8;

          for (let i = 0; i <= segments; i++) {
            const progress = i / segments;
            const envelope = Math.sin(progress * Math.PI); // Pinches at edges
            const freqSample =
              isRunning && !isPaused
                ? (freqData[Math.floor(progress * 30)] || 30) / 255
                : 0.1;

            const yOffset =
              Math.sin(progress * Math.PI * 4 * freqMult + phase) *
              rms *
              (height * 0.45) *
              envelope *
              (1 + freqSample);

            const x = i * segmentWidth;
            const y = centerY + yOffset;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      } else if (mode === 'radial') {
        // === MODE 4: CIRCULAR RADIAL AUDIO AURA ===
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.55;
        const barCount = 48;
        const step = Math.floor(freqData.length / barCount);

        // Pulsing core orb
        const coreRadius = Math.max(8, radius * (0.35 + (stats.rms || 0.05) * sensitivity * 0.5));
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, 2 * Math.PI);
        ctx.fillStyle = activeColor.glow;
        ctx.fill();

        ctx.strokeStyle = activeColor.primary;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = activeColor.glow;
        ctx.shadowBlur = 8;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const rawVal = isRunning && !isPaused ? freqData[i * step] || 0 : 5;
          const barLen = ((rawVal * sensitivity) / 255) * (radius * 0.85);

          const xStart = centerX + Math.cos(angle) * (radius * 0.45);
          const yStart = centerY + Math.sin(angle) * (radius * 0.45);

          const xEnd = centerX + Math.cos(angle) * (radius * 0.45 + barLen);
          const yEnd = centerY + Math.sin(angle) * (radius * 0.45 + barLen);

          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [mode, theme, sensitivity, stats.rms]);

  // Adjust canvas size to match layout container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const activeWord = engineState.word;

  return (
    <div
      id="speech-audio-visualizer"
      className="w-full bg-[#0a0a0a] border-b border-[#1f1f1f] shadow-lg animate-in slide-in-from-top-3 duration-200 transition-all select-none overflow-hidden relative"
      style={{
        boxShadow: `0 8px 30px -10px ${themeColors.bgGlow}`,
      }}
    >
      {/* Blueprint structural accent corners */}
      <i className="corner tl" />
      <i className="corner tr" />

      {/* Main Visualizer Bar */}
      <div className="px-3 md:px-5 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Side: Voice Profile Status & Active Word Stream */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Active Audio State Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#141414] border border-[#282828] text-xs font-mono flex-none">
            <span
              className={`h-2 w-2 rounded-full ${
                engineState.isRunning && !engineState.isPaused
                  ? 'bg-[var(--color-accent)] animate-ping'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-semibold text-white">
              {engineState.isPaused
                ? 'PAUSED'
                : engineState.isRunning
                ? 'VOCAL SYNTHESIS'
                : 'IDLE'}
            </span>
            <span className="text-[10px] text-neutral-400">
              {voiceSettings?.halseyProfile?.replace('halsey-', '') || 'Halsey'} · {voiceSettings?.speechRate || 1.05}x
            </span>
          </div>

          {/* Active Spoken Word Ticker */}
          <div className="flex items-center gap-2 min-w-0 flex-1 bg-[#0f0f0f] px-3 py-1 rounded border border-[#1e1e1e]">
            <span className="text-[10px] uppercase font-mono text-neutral-500 flex items-center gap-1 flex-none">
              <Zap className="w-3 h-3 text-[var(--color-accent)]" /> Word:
            </span>
            <span className="text-xs font-mono text-white font-bold truncate tracking-wide">
              {activeWord ? (
                <span
                  className="px-1.5 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30 inline-block animate-in zoom-in-95"
                >
                  {activeWord}
                </span>
              ) : (
                <span className="text-neutral-500 italic">Streaming voice boundaries...</span>
              )}
            </span>
          </div>
        </div>

        {/* Center: Live Acoustic Telemetry Chips */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-neutral-400 flex-none">
          <div className="px-2 py-0.5 bg-[#121212] rounded border border-[#222222]">
            <span className="text-neutral-500">ENERGY: </span>
            <span className="text-[var(--color-accent)] font-semibold">{stats.energy}%</span>
          </div>
          <div className="px-2 py-0.5 bg-[#121212] rounded border border-[#222222]">
            <span className="text-neutral-500">PEAK: </span>
            <span className="text-white font-semibold">{stats.peakFreq} Hz</span>
          </div>
          <div className="px-2 py-0.5 bg-[#121212] rounded border border-[#222222]">
            <span className="text-neutral-500">LEVEL: </span>
            <span className="text-white font-semibold">{stats.decibels} dB</span>
          </div>
        </div>

        {/* Right Side: Mode Switcher & Session Controls */}
        <div className="flex items-center gap-1.5 flex-none justify-end">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-[#121212] p-0.5 rounded border border-[#262626]">
            <button
              type="button"
              onClick={() => setMode('spectrum')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                mode === 'spectrum'
                  ? 'bg-[var(--color-accent)] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Frequency Spectrum Bars"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('waveform')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                mode === 'waveform'
                  ? 'bg-[var(--color-accent)] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Oscilloscope Waveform"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('ribbon')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                mode === 'ribbon'
                  ? 'bg-[var(--color-accent)] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Holographic Energy Ribbon"
            >
              <Waves className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('radial')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                mode === 'radial'
                  ? 'bg-[var(--color-accent)] text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Circular Radial Voice Aura"
            >
              <Disc className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Palette Switcher */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-[#121212] rounded border border-[#262626]">
            <button
              type="button"
              onClick={() => setTheme('accent')}
              className={`w-3 h-3 rounded-full bg-[#e5a93c] transition-transform cursor-pointer ${
                theme === 'accent' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title="Amber Gold"
            />
            <button
              type="button"
              onClick={() => setTheme('cyan')}
              className={`w-3 h-3 rounded-full bg-[#00f0ff] transition-transform cursor-pointer ${
                theme === 'cyan' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title="Halsey Cyan"
            />
            <button
              type="button"
              onClick={() => setTheme('magenta')}
              className={`w-3 h-3 rounded-full bg-[#ff2d78] transition-transform cursor-pointer ${
                theme === 'magenta' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title="Badlands Pink"
            />
            <button
              type="button"
              onClick={() => setTheme('emerald')}
              className={`w-3 h-3 rounded-full bg-[#10b981] transition-transform cursor-pointer ${
                theme === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title="Neon Emerald"
            />
          </div>

          {/* Pause / Resume Speech */}
          {onPauseToggle && (
            <button
              type="button"
              onClick={onPauseToggle}
              className="p-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-[#cfcfcf] hover:text-white border border-[#2b2b2b] rounded cursor-pointer transition-colors"
              title={engineState.isPaused ? 'Resume Speech' : 'Pause Speech'}
            >
              {engineState.isPaused ? <Play className="w-3.5 h-3.5 text-[var(--color-accent)]" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Replay */}
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="p-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-[#cfcfcf] hover:text-white border border-[#2b2b2b] rounded cursor-pointer transition-colors"
              title="Replay Voice Speech"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand / Collapse Studio Deck */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-[#cfcfcf] hover:text-white border border-[#2b2b2b] rounded cursor-pointer transition-colors"
            title={isExpanded ? 'Compact Visualizer' : 'Expand Studio Deck'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Stop / Close Visualizer */}
          <button
            type="button"
            onClick={onStop}
            className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded cursor-pointer transition-colors"
            title="Silence and Close Visualizer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HTML5 Web Audio Canvas Stage */}
      <div
        className={`w-full relative px-3 md:px-5 pb-2 transition-all ${
          isExpanded ? 'h-40' : 'h-18'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded border border-[#1b1b1b] bg-[#070707]"
        />

        {/* Sensitivity slider overlay (when expanded) */}
        {isExpanded && (
          <div className="absolute top-2 right-8 flex items-center gap-2 bg-[#0c0c0c]/90 px-2.5 py-1 rounded border border-[#242424] text-[10px] font-mono text-neutral-400">
            <Sliders className="w-3 h-3 text-[var(--color-accent)]" />
            <span>Sensitivity:</span>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-16 accent-[var(--color-accent)] cursor-pointer"
            />
            <span className="text-white">{sensitivity.toFixed(1)}x</span>
          </div>
        )}
      </div>
    </div>
  );
};
