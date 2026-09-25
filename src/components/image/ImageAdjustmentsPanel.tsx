import React from 'react';
import {
  Sliders,
  RotateCcw,
  Sun,
  Contrast,
  Droplets,
  Flame,
  CircleDot,
  Sparkles,
  Eye,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Type,
  X,
} from 'lucide-react';
import { ImageAdjustments } from '../../types';

interface ImageAdjustmentsPanelProps {
  adjustments: ImageAdjustments;
  onChange: (adjustments: ImageAdjustments) => void;
  onReset: () => void;
  onClose?: () => void;
}

export const ImageAdjustmentsPanel: React.FC<ImageAdjustmentsPanelProps> = ({
  adjustments,
  onChange,
  onReset,
  onClose,
}) => {
  const update = <K extends keyof ImageAdjustments>(key: K, value: ImageAdjustments[K]) => {
    onChange({ ...adjustments, [key]: value });
  };

  const applyPreset = (preset: ImageAdjustments['filterPreset']) => {
    let patch: Partial<ImageAdjustments> = { filterPreset: preset };
    switch (preset) {
      case 'noir':
        patch = {
          ...patch,
          saturation: -100,
          contrast: 35,
          brightness: -5,
          vignette: 40,
          grain: 25,
          sepia: 0,
        };
        break;
      case 'vintage':
        patch = {
          ...patch,
          saturation: -15,
          contrast: -10,
          brightness: 5,
          warmth: 30,
          vignette: 35,
          grain: 40,
          sepia: 25,
        };
        break;
      case 'cyberpunk':
        patch = {
          ...patch,
          saturation: 45,
          contrast: 25,
          brightness: 5,
          hueRotate: 310,
          vignette: 45,
          grain: 15,
          sepia: 0,
        };
        break;
      case 'warm-gold':
        patch = {
          ...patch,
          saturation: 20,
          contrast: 10,
          warmth: 45,
          brightness: 5,
          vignette: 20,
          grain: 10,
          sepia: 15,
        };
        break;
      case 'cool-matrix':
        patch = {
          ...patch,
          saturation: 30,
          contrast: 30,
          warmth: -40,
          hueRotate: 90,
          vignette: 30,
          grain: 20,
          sepia: 0,
        };
        break;
      case 'faded-dream':
        patch = {
          ...patch,
          saturation: -25,
          contrast: -20,
          brightness: 15,
          warmth: 15,
          blur: 0.8,
          vignette: 15,
          grain: 20,
        };
        break;
      case 'high-contrast':
        patch = {
          ...patch,
          contrast: 50,
          saturation: 25,
          brightness: -5,
          vignette: 25,
          grain: 0,
        };
        break;
      case 'none':
      default:
        patch = {
          filterPreset: 'none',
          brightness: 0,
          contrast: 0,
          saturation: 0,
          warmth: 0,
          vignette: 0,
          grain: 0,
          blur: 0,
          sepia: 0,
          invert: false,
          hueRotate: 0,
        };
        break;
    }
    onChange({ ...adjustments, ...patch });
  };

  return (
    <div
      id="image-adjustments-panel"
      className="flex flex-col h-full bg-[#0c0c0e] border-l border-[#1f1f24] text-[#ececee] select-none overflow-y-auto"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#1f1f24] flex-none bg-[#0e0e12]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono text-white">
            Canvas Modifiers & Post-FX
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            className="px-2 py-1 text-[11px] font-mono text-[#a3a3a3] hover:text-white hover:bg-[#1a1a20] rounded transition-colors flex items-center gap-1"
            title="Reset adjustments to zero"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#888888] hover:text-white hover:bg-[#1a1a20] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-4 text-xs">
        {/* Style LUT Presets */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888892] mb-2 font-mono">
            Color Grading LUTs
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'none', label: 'Default' },
              { id: 'noir', label: 'Noir B&W' },
              { id: 'vintage', label: 'Vintage' },
              { id: 'cyberpunk', label: 'Cyber' },
              { id: 'warm-gold', label: 'Gold' },
              { id: 'cool-matrix', label: 'Matrix' },
              { id: 'faded-dream', label: 'Dream' },
              { id: 'high-contrast', label: 'Punch' },
            ].map((p) => {
              const active = adjustments.filterPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as any)}
                  className={`px-2 py-1.5 rounded text-[11px] font-mono text-center transition-colors border cursor-pointer ${
                    active
                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white font-medium'
                      : 'bg-[#141418] border-[#222228] text-[#a0a0ab] hover:border-[#3a3a44] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Tone & Color */}
        <div className="space-y-3 pt-2 border-t border-[#1a1a20]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888892] font-mono">
            Light & Color Temperature
          </div>

          {/* Brightness */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Sun className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Brightness
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.brightness}
              onChange={(e) => update('brightness', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Contrast className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Contrast
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.contrast}
              onChange={(e) => update('contrast', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Droplets className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Saturation
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.saturation}
              onChange={(e) => update('saturation', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>

          {/* Warmth */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Flame className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Warmth / Temp
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.warmth}
              onChange={(e) => update('warmth', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Optical & Lens FX */}
        <div className="space-y-3 pt-2 border-t border-[#1a1a20]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888892] font-mono">
            Optical Shading & Texture
          </div>

          {/* Vignette */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <CircleDot className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Edge Vignette
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.vignette}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={adjustments.vignette}
              onChange={(e) => update('vignette', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>

          {/* Grain */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Film Grain
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.grain}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={adjustments.grain}
              onChange={(e) => update('grain', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>

          {/* Blur */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-[#b5b5c0]">
                <Eye className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Soft Focus / Blur
              </span>
              <span className="font-mono text-[10px] text-[#8e8e99]">{adjustments.blur.toFixed(1)}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={adjustments.blur}
              onChange={(e) => update('blur', Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1e1e24] rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Orientation & Canvas Transforms */}
        <div className="pt-2 border-t border-[#1a1a20]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888892] font-mono mb-2">
            Canvas Transforms
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => update('flipH', !adjustments.flipH)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-mono border transition-colors ${
                adjustments.flipH
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                  : 'bg-[#141418] border-[#24242c] text-[#a3a3a3] hover:text-white'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip H</span>
            </button>
            <button
              type="button"
              onClick={() => update('flipV', !adjustments.flipV)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-mono border transition-colors ${
                adjustments.flipV
                  ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                  : 'bg-[#141418] border-[#24242c] text-[#a3a3a3] hover:text-white'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip V</span>
            </button>
            <button
              type="button"
              onClick={() => update('rotation', (adjustments.rotation + 90) % 360)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-mono border bg-[#141418] border-[#24242c] text-[#a3a3a3] hover:text-white transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{adjustments.rotation}°</span>
            </button>
          </div>
        </div>

        {/* Typography & Watermark Stamp */}
        <div className="pt-2 border-t border-[#1a1a20]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#888892] font-mono mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Watermark Stamp
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. Created with Forge"
            value={adjustments.watermarkText}
            onChange={(e) => update('watermarkText', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-[#121216] border border-[#24242c] rounded text-white focus:outline-none focus:border-[var(--color-accent)]"
          />
          {adjustments.watermarkText && (
            <div className="grid grid-cols-4 gap-1 mt-2">
              {(['bottom-right', 'bottom-left', 'top-right', 'center'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => update('watermarkPosition', pos)}
                  className={`py-1 text-[10px] font-mono rounded border transition-colors ${
                    adjustments.watermarkPosition === pos
                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                      : 'bg-[#141418] border-[#222228] text-[#888888]'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
