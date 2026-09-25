import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Dice5,
  Sliders,
  Image as ImageIcon,
  Download,
  Copy,
  Trash2,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  Settings2,
  Check,
  AlertCircle,
  HelpCircle,
  Shuffle,
  Lock,
  Unlock,
  Upload,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  Camera,
  Cpu,
  SplitSquareVertical,
} from 'lucide-react';
import { GeneratedImage, ImageAdjustments } from '../../types';
import {
  STYLE_PRESETS,
  MODIFIER_PILLS,
  SAMPLE_PROMPTS,
  NEGATIVE_PROMPT_PRESETS,
  DEFAULT_IMAGE_ADJUSTMENTS,
} from '../../data/imagePresets';
import { ImageAdjustmentsPanel } from './ImageAdjustmentsPanel';
import { ImageCompareSlider } from './ImageCompareSlider';

interface ImageGeneratorViewProps {
  onShowToast: (msg: string) => void;
  huggingFaceToken?: string;
}

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
  onShowToast,
  huggingFaceToken,
}) => {
  // --- Prompt State ---
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [negativePrompt, setNegativePrompt] = useState('blurry, deformed, low resolution, bad anatomy');
  const [showNegative, setShowNegative] = useState(false);

  // --- Generation Parameters ---
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>(['l-golden', 'c-85mm']);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '4:1' | '1:4'>('16:9');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [guidanceScale, setGuidanceScale] = useState<number>(7.5);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 899999) + 100000);
  const [isSeedLocked, setIsSeedLocked] = useState<boolean>(false);
  const [engine, setEngine] = useState<'gemini' | 'huggingface' | 'procedural'>('gemini');
  const [hfModel, setHfModel] = useState<string>('black-forest-labs/FLUX.1-schnell');

  // --- Image Studio State ---
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExpandingPrompt, setIsExpandingPrompt] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // --- History & Active Image ---
  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem('forge_image_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(() => {
    return history.length > 0 ? history[0] : null;
  });

  // --- Live Post-Processing Adjustments ---
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(() => {
    return activeImage?.adjustments || DEFAULT_IMAGE_ADJUSTMENTS;
  });
  const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState<boolean>(false);

  // --- Remix / Image-to-Image Modal State ---
  const [showRemixModal, setShowRemixModal] = useState<boolean>(false);
  const [remixInstruction, setRemixInstruction] = useState<string>('');
  const [remixStrength, setRemixStrength] = useState<number>(0.75);
  const [isRemixing, setIsRemixing] = useState<boolean>(false);

  // --- View Mode: Normal or Split Compare ---
  const [viewMode, setViewMode] = useState<'normal' | 'compare'>('normal');

  // --- Canvas Zoom State ---
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('forge_image_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {}
  }, [history]);

  // Sync adjustments when active image changes
  useEffect(() => {
    if (activeImage?.adjustments) {
      setAdjustments(activeImage.adjustments);
    } else {
      setAdjustments(DEFAULT_IMAGE_ADJUSTMENTS);
    }
  }, [activeImage?.id]);

  // If no initial image, synthesize a sample one on first load
  useEffect(() => {
    if (!activeImage && history.length === 0) {
      handleGenerate();
    }
  }, []);

  // --- Helper: Toggle Modifier Pill ---
  const toggleModifier = (modId: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // --- Helper: Randomize Prompt ---
  const handleRandomPrompt = () => {
    const nextPrompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(nextPrompt);
    if (!isSeedLocked) {
      setSeed(Math.floor(Math.random() * 899999) + 100000);
    }
    onShowToast('Randomized prompt inspiration');
  };

  // --- AI Expand Prompt ---
  const handleExpandPrompt = async () => {
    if (!prompt.trim()) return;
    setIsExpandingPrompt(true);
    try {
      const activeStyleObj = STYLE_PRESETS.find((s) => s.id === selectedStyle);
      const res = await fetch('/api/image/expand-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: activeStyleObj?.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.expandedPrompt) {
        setPrompt(data.expandedPrompt);
        onShowToast('✨ AI expanded and enriched your prompt');
      }
    } catch (err) {
      onShowToast('Could not expand prompt automatically');
    } finally {
      setIsExpandingPrompt(false);
    }
  };

  // --- Primary Generation Flow ---
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationNotice(null);

    const currentSeed = isSeedLocked ? seed : Math.floor(Math.random() * 899999) + 100000;
    if (!isSeedLocked) setSeed(currentSeed);

    const activeStyleObj = STYLE_PRESETS.find((s) => s.id === selectedStyle);
    const activeModSnippets = selectedModifiers
      .map((id) => MODIFIER_PILLS.find((m) => m.id === id)?.snippet)
      .filter(Boolean) as string[];

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: showNegative ? negativePrompt : undefined,
          aspectRatio,
          imageSize,
          engine,
          hfModel,
          hfToken: huggingFaceToken,
          seed: currentSeed,
          guidanceScale,
          stylePreset: activeStyleObj?.promptSnippet,
          modifiers: activeModSnippets,
        }),
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        const newImg: GeneratedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          prompt,
          fullPrompt: data.fullPrompt || prompt,
          negativePrompt,
          aspectRatio,
          imageSize,
          seed: currentSeed,
          guidanceScale,
          steps: 28,
          engine,
          modelName: data.model || engine,
          imageUrl: data.imageUrl,
          source: data.source || 'gemini',
          createdAt: Date.now(),
          stylePreset: selectedStyle,
          modifiers: selectedModifiers,
          adjustments: DEFAULT_IMAGE_ADJUSTMENTS,
          notice: data.notice,
        };

        setHistory((prev) => [newImg, ...prev]);
        setActiveImage(newImg);
        setViewMode('normal');

        if (data.notice) {
          setGenerationNotice(data.notice);
        }
        onShowToast(`Artwork generated with ${data.model || 'model'}`);
      } else {
        onShowToast(`Generation error: ${data.error || 'Failed to synthesize'}`);
      }
    } catch (err: any) {
      onShowToast(`Network error generating image: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Image-to-Image / Multimodal Remix Flow ---
  const handleRemix = async () => {
    if (!activeImage || !remixInstruction.trim() || isRemixing) return;

    setIsRemixing(true);
    const activeStyleObj = STYLE_PRESETS.find((s) => s.id === selectedStyle);

    try {
      const res = await fetch('/api/image/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: activeImage.imageUrl,
          instruction: remixInstruction,
          aspectRatio: activeImage.aspectRatio,
          strength: remixStrength,
          stylePreset: activeStyleObj?.name,
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        const remixedImg: GeneratedImage = {
          id: `remix-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          prompt: `${activeImage.prompt} // Modified: ${remixInstruction}`,
          negativePrompt: activeImage.negativePrompt,
          aspectRatio: activeImage.aspectRatio,
          imageSize: activeImage.imageSize,
          seed: Math.floor(Math.random() * 899999) + 100000,
          guidanceScale,
          steps: 28,
          engine: 'gemini',
          modelName: data.model || 'gemini-3.1-flash-lite-image',
          imageUrl: data.imageUrl,
          source: data.source || 'gemini-modified',
          createdAt: Date.now(),
          parentImageId: activeImage.id,
          parentImageUrl: activeImage.imageUrl,
          instruction: remixInstruction,
          adjustments: DEFAULT_IMAGE_ADJUSTMENTS,
          notice: data.notice,
        };

        setHistory((prev) => [remixedImg, ...prev]);
        setActiveImage(remixedImg);
        setShowRemixModal(false);
        setViewMode('compare');
        onShowToast('Artwork remixed & transformed');
      } else {
        onShowToast(`Remix error: ${data.error || 'Modification failed'}`);
      }
    } catch (err: any) {
      onShowToast(`Network error remixing image: ${err.message}`);
    } finally {
      setIsRemixing(false);
    }
  };

  // --- Download & Export Function (combining adjustments if applied) ---
  const handleDownload = async (format: 'png' | 'jpeg' | 'webp' = 'png') => {
    if (!activeImage) return;

    try {
      // If image is SVG or adjustments applied, render to offscreen canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeImage.imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1024;
      canvas.height = img.naturalHeight || 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');

      // Apply transforms
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (adjustments.rotation) {
        ctx.rotate((adjustments.rotation * Math.PI) / 180);
      }
      ctx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);

      // Apply CSS-like filter string
      const filters = [
        `brightness(${100 + adjustments.brightness}%)`,
        `contrast(${100 + adjustments.contrast}%)`,
        `saturate(${100 + adjustments.saturation}%)`,
        adjustments.hueRotate ? `hue-rotate(${adjustments.hueRotate}deg)` : '',
        adjustments.sepia ? `sepia(${adjustments.sepia}%)` : '',
        adjustments.invert ? 'invert(100%)' : '',
        adjustments.blur ? `blur(${adjustments.blur}px)` : '',
      ].filter(Boolean).join(' ');

      ctx.filter = filters || 'none';
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();

      // Apply Watermark if set
      if (adjustments.watermarkText.trim()) {
        ctx.save();
        ctx.font = `600 ${Math.max(16, Math.floor(canvas.width * 0.024))}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${adjustments.watermarkOpacity})`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;

        const text = adjustments.watermarkText.trim();
        const textMetrics = ctx.measureText(text);
        let x = canvas.width - textMetrics.width - 24;
        let y = canvas.height - 24;

        if (adjustments.watermarkPosition === 'bottom-left') {
          x = 24;
        } else if (adjustments.watermarkPosition === 'top-right') {
          y = 36;
        } else if (adjustments.watermarkPosition === 'center') {
          x = (canvas.width - textMetrics.width) / 2;
          y = canvas.height / 2;
        }

        ctx.fillText(text, x, y);
        ctx.restore();
      }

      // Download
      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `forge-artwork-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast(`Downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      // Fallback: direct download original URL
      const link = document.createElement('a');
      link.href = activeImage.imageUrl;
      link.download = `forge-artwork-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Downloaded original image');
    }
  };

  // --- Compute Filter String for Live CSS Preview ---
  const getFilterStyle = (): React.CSSProperties => {
    const filters = [
      adjustments.brightness !== 0 ? `brightness(${100 + adjustments.brightness}%)` : '',
      adjustments.contrast !== 0 ? `contrast(${100 + adjustments.contrast}%)` : '',
      adjustments.saturation !== 0 ? `saturate(${100 + adjustments.saturation}%)` : '',
      adjustments.hueRotate !== 0 ? `hue-rotate(${adjustments.hueRotate}deg)` : '',
      adjustments.sepia > 0 ? `sepia(${adjustments.sepia}%)` : '',
      adjustments.invert ? 'invert(100%)' : '',
      adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : '',
    ].filter(Boolean).join(' ');

    const transforms = [
      `scale(${zoomLevel})`,
      adjustments.flipH ? 'scaleX(-1)' : '',
      adjustments.flipV ? 'scaleY(-1)' : '',
      adjustments.rotation ? `rotate(${adjustments.rotation}deg)` : '',
    ].filter(Boolean).join(' ');

    return {
      filter: filters || undefined,
      transform: transforms || undefined,
      transition: 'transform 0.15s ease-out, filter 0.1s linear',
    };
  };

  return (
    <div
      id="image-studio-view"
      className="flex-1 flex flex-col min-h-0 bg-[#070709] text-[#e3e3e8] select-none overflow-hidden"
    >
      {/* Studio Top Control Strip */}
      <div className="flex-none h-11 border-b border-[#1b1b22] px-3 md:px-4 flex items-center justify-between bg-[#0a0a0e]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] font-mono text-white">
              Neural Image Studio
            </span>
          </div>
          <span className="text-[#444450] text-xs hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#8b8b99]">
            <span>Engine:</span>
            <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded border border-[var(--color-accent)]/25">
              {engine === 'gemini' ? 'Gemini 3.1 Flash Image' : engine === 'huggingface' ? 'HF FLUX.1' : 'Procedural Synth'}
            </span>
          </div>
        </div>

        {/* View Mode & Adjustments Toggles */}
        <div className="flex items-center gap-2">
          {activeImage?.parentImageUrl && (
            <div className="flex items-center border border-[#24242e] rounded bg-[#111116] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('normal')}
                className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  viewMode === 'normal' ? 'bg-[var(--color-accent)]/20 text-white font-medium' : 'text-[#888892]'
                }`}
              >
                Canvas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  viewMode === 'compare' ? 'bg-[var(--color-accent)]/20 text-white font-medium' : 'text-[#888892]'
                }`}
              >
                <SplitSquareVertical className="w-3 h-3 text-[var(--color-accent)]" />
                <span>Diff Compare</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdjustmentsPanel(!showAdjustmentsPanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              showAdjustmentsPanel
                ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                : 'bg-[#121217] border-[#22222a] text-[#a0a0b0] hover:text-white hover:border-[#383844]'
            }`}
            title="Toggle Canvas Modifiers & Post-FX Panel"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span className="hidden sm:inline">Post-FX</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Column: Comprehensive Generator Controls */}
        <div className="w-full md:w-[380px] lg:w-[410px] flex-none border-r border-[#1a1a20] bg-[#09090c] flex flex-col min-h-0 overflow-y-auto">
          <div className="p-3.5 space-y-4">
            {/* Primary Prompt Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] font-mono flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Creative Prompt</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRandomPrompt}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#a3a3a3] hover:text-[var(--color-accent)] bg-[#141418] hover:bg-[#1e1e24] rounded border border-[#222228] transition-colors"
                    title="Load random inspiration prompt"
                  >
                    <Dice5 className="w-3 h-3 text-[var(--color-accent)]" />
                    <span>Inspiration</span>
                  </button>
                  <button
                    type="button"
                    disabled={isExpandingPrompt || !prompt.trim()}
                    onClick={handleExpandPrompt}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 rounded border border-[var(--color-accent)]/30 transition-colors disabled:opacity-40"
                    title="Use Gemini AI to enhance and expand prompt details"
                  >
                    <Sparkles className={`w-3 h-3 ${isExpandingPrompt ? 'animate-spin' : ''}`} />
                    <span>{isExpandingPrompt ? 'Expanding...' : 'AI Expand'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your subject, scene, atmosphere, lighting, camera and colors..."
                  className="w-full px-3 py-2 text-xs bg-[#111116] border border-[#22222a] rounded text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none leading-relaxed"
                />
                <div className="absolute right-2 bottom-2 text-[9px] font-mono text-[#666672]">
                  {prompt.length} chars
                </div>
              </div>
            </div>

            {/* Style Presets Grid */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] font-mono">
                  Art Style Direction
                </label>
                <span className="text-[10px] font-mono text-[var(--color-accent)]">
                  {STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name || 'Custom'}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {STYLE_PRESETS.map((preset) => {
                  const isSelected = selectedStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyle(preset.id);
                        if (preset.recommendedAspect) setAspectRatio(preset.recommendedAspect);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white shadow-sm'
                          : 'bg-[#111116] border-[#22222a] text-[#8e8e9c] hover:text-white hover:border-[#3a3a46]'
                      }`}
                    >
                      <span className="text-base mb-1">{preset.icon}</span>
                      <span className="text-[10px] font-medium leading-tight truncate w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clickable Modifier Matrix Pills */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] mb-1.5 font-mono">
                Steering Modifiers & Optics
              </label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                {MODIFIER_PILLS.map((pill) => {
                  const active = selectedModifiers.includes(pill.id);
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => toggleModifier(pill.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-full border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                          : 'bg-[#121217] border-[#202028] text-[#848492] hover:text-[#d0d0d8] hover:border-[#343440]'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {pill.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] mb-1.5 font-mono">
                Aspect Ratio Canvas
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { ratio: '1:1', label: '1:1 Square', iconClass: 'w-3.5 h-3.5 border' },
                  { ratio: '16:9', label: '16:9 Cinema', iconClass: 'w-4 h-2.5 border' },
                  { ratio: '9:16', label: '9:16 Story', iconClass: 'w-2.5 h-4 border' },
                  { ratio: '4:3', label: '4:3 Classic', iconClass: 'w-3.5 h-3 border' },
                  { ratio: '3:4', label: '3:4 Portrait', iconClass: 'w-3 h-3.5 border' },
                  { ratio: '21:9', label: '21:9 Ultra', iconClass: 'w-5 h-2 border' },
                  { ratio: '4:1', label: '4:1 Ribbon', iconClass: 'w-5 h-1.5 border' },
                  { ratio: '1:4', label: '1:4 Banner', iconClass: 'w-1.5 h-5 border' },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setAspectRatio(item.ratio as any)}
                    className={`flex flex-col items-center justify-center p-1.5 rounded border transition-colors cursor-pointer ${
                      aspectRatio === item.ratio
                        ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white font-medium'
                        : 'bg-[#111116] border-[#22222a] text-[#888896] hover:text-white hover:border-[#33333e]'
                    }`}
                  >
                    <div className={`${item.iconClass} border-current mb-1 opacity-70`} />
                    <span className="text-[10px] font-mono leading-tight">{item.ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Parameter Sliders: Quality, CFG, Seed */}
            <div className="space-y-3 pt-2 border-t border-[#1b1b22]">
              {/* Resolution / Image Size */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] font-mono">
                  Output Quality
                </span>
                <div className="flex items-center border border-[#22222a] rounded bg-[#111116] p-0.5">
                  {(['512px', '1K', '2K', '4K'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setImageSize(sz)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                        imageSize === sz ? 'bg-[var(--color-accent)]/20 text-white font-medium' : 'text-[#777784]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* CFG / Guidance Scale */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#8e8e9c] font-mono text-[10px] uppercase tracking-wider">
                    Prompt Guidance (CFG)
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-accent)]">{guidanceScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="18"
                  step="0.5"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1b1b22] rounded-lg appearance-none"
                />
              </div>

              {/* Seed Control */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] font-mono">
                  Seed (Determinism)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="w-24 px-2 py-0.5 text-[10px] font-mono bg-[#111116] border border-[#22222a] rounded text-white focus:outline-none focus:border-[var(--color-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setSeed(Math.floor(Math.random() * 899999) + 100000)}
                    className="p-1 text-[#888894] hover:text-white bg-[#141419] border border-[#22222a] rounded"
                    title="Generate new random seed"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSeedLocked(!isSeedLocked)}
                    className={`p-1 rounded border transition-colors ${
                      isSeedLocked
                        ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                        : 'bg-[#141419] border-[#22222a] text-[#888894]'
                    }`}
                    title={isSeedLocked ? 'Seed locked for reproducible edits' : 'Seed free (randomized on generate)'}
                  >
                    {isSeedLocked ? <Lock className="w-3.5 h-3.5 text-[var(--color-accent)]" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Engine Selection */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] mb-1 font-mono">
                  Inference Engine
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'gemini', label: 'Gemini 3.1', desc: 'Google GenAI' },
                    { id: 'huggingface', label: 'FLUX.1', desc: 'HF Router' },
                    { id: 'procedural', label: 'Synth', desc: 'Deterministic' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => setEngine(eng.id as any)}
                      className={`py-1.5 px-2 rounded border text-left transition-colors ${
                        engine === eng.id
                          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-white'
                          : 'bg-[#111116] border-[#22222a] text-[#888894] hover:border-[#33333e]'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-medium">{eng.label}</div>
                      <div className="text-[8px] opacity-60 truncate">{eng.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Negative Constraints Toggle */}
            <div className="pt-2 border-t border-[#1b1b22]">
              <button
                type="button"
                onClick={() => setShowNegative(!showNegative)}
                className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] font-mono hover:text-white"
              >
                <span>Negative Constraints ({showNegative ? 'Active' : 'Off'})</span>
                {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showNegative && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Things to avoid (e.g. blurry, text watermark, deformed limbs)..."
                    className="w-full px-2.5 py-1.5 text-xs bg-[#111116] border border-[#22222a] rounded text-white focus:outline-none focus:border-[var(--color-accent)] resize-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    {NEGATIVE_PROMPT_PRESETS.slice(0, 4).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNegativePrompt((prev) => (prev ? `${prev}, ${preset}` : preset))}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#141419] border border-[#22222a] text-[#7a7a88] hover:text-white"
                      >
                        + {preset.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Generate Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="w-full py-2.5 px-4 rounded bg-[var(--color-accent)] text-black font-semibold text-xs uppercase tracking-wider font-mono hover:bg-[#d6b793] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Synthesizing Canvas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generate Artwork</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center Stage: Interactive Canvas Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#060608] relative overflow-hidden">
          {/* Canvas Floating Top Toolbar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {activeImage && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0c0c10]/85 backdrop-blur-md border border-[#22222a] text-[10px] font-mono text-[#a0a0ae]">
                  <span className="text-[var(--color-accent)] font-semibold">{activeImage.aspectRatio}</span>
                  <span>•</span>
                  <span>Seed: {activeImage.seed}</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">{activeImage.modelName}</span>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#0c0c10]/85 backdrop-blur-md border border-[#22222a] rounded p-0.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 text-[#888894] hover:text-white rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 text-[#a0a0b0]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1 text-[#888894] hover:text-white rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-1.5 py-0.5 text-[9px] font-mono text-[#888894] hover:text-white border-l border-[#22222a]"
                title="Reset Zoom"
              >
                1:1
              </button>
            </div>
          </div>

          {/* Main Visual Display Area */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center space-y-3 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                <div className="text-xs font-mono text-[var(--color-accent)] tracking-widest uppercase animate-pulse">
                  Neural Diffusion in Progress...
                </div>
                <div className="text-[11px] text-[#717180] max-w-sm text-center font-sans">
                  Steering prompt matrices, applying {selectedStyle} aesthetics and lighting optics...
                </div>
              </div>
            ) : activeImage ? (
              viewMode === 'compare' && activeImage.parentImageUrl ? (
                <div className="w-full h-full max-h-[75vh] flex items-center justify-center">
                  <ImageCompareSlider
                    originalUrl={activeImage.parentImageUrl}
                    modifiedUrl={activeImage.imageUrl}
                    originalLabel="Original Baseline"
                    modifiedLabel="Remixed Transformation"
                  />
                </div>
              ) : (
                <div className="relative max-w-full max-h-[78vh] flex items-center justify-center group">
                  {/* The Rendered Image with Non-Destructive Filters */}
                  <img
                    src={activeImage.imageUrl}
                    alt={activeImage.prompt}
                    style={getFilterStyle()}
                    className="max-h-[75vh] max-w-full object-contain rounded border border-[#22222a] shadow-2xl"
                    referrerPolicy="no-referrer"
                  />

                  {/* Watermark preview overlay if active */}
                  {adjustments.watermarkText.trim() && (
                    <div
                      className={`absolute pointer-events-none text-xs font-mono font-semibold text-white/80 drop-shadow-md p-3 ${
                        adjustments.watermarkPosition === 'bottom-left'
                          ? 'bottom-3 left-3'
                          : adjustments.watermarkPosition === 'top-right'
                          ? 'top-3 right-3'
                          : adjustments.watermarkPosition === 'center'
                          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                          : 'bottom-3 right-3'
                      }`}
                      style={{ opacity: adjustments.watermarkOpacity }}
                    >
                      {adjustments.watermarkText}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center text-[#666675] space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-[#333340]" />
                <p className="text-xs font-mono">No artwork loaded. Enter a prompt and click Generate.</p>
              </div>
            )}
          </div>

          {/* Notice banner if any */}
          {generationNotice && (
            <div className="flex-none px-4 py-1.5 bg-[#14120e] border-t border-[#2e261b] text-[10px] font-mono text-[#d6b793] flex items-center justify-between">
              <span className="truncate">{generationNotice}</span>
              <button
                type="button"
                onClick={() => setGenerationNotice(null)}
                className="text-[#998064] hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Toolbar on Bottom of Stage */}
          {activeImage && (
            <div className="flex-none h-12 border-t border-[#1a1a20] px-3 sm:px-5 flex items-center justify-between bg-[#0a0a0e]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemixModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors cursor-pointer"
                  title="Modify this image with multimodal image-to-image instruction"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Remix / Modify This</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrompt(activeImage.prompt);
                    setSeed(activeImage.seed);
                    setAspectRatio(activeImage.aspectRatio);
                    onShowToast('Loaded parameters into prompt editor');
                  }}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-[#a0a0b0] hover:text-white bg-[#141419] border border-[#22222a] rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-[var(--color-accent)]" />
                  <span>Reuse Recipe</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#16161d] border border-[#282834] text-white hover:bg-[#20202a] transition-colors cursor-pointer"
                  title="Download artwork with current modifiers applied"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Export PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeImage.prompt);
                    onShowToast('Copied prompt to clipboard');
                  }}
                  className="p-1.5 text-[#888894] hover:text-white bg-[#141419] border border-[#22222a] rounded"
                  title="Copy Prompt"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* History Filmstrip at Bottom */}
          {history.length > 0 && (
            <div className="flex-none h-20 border-t border-[#1a1a20] px-3 py-2 bg-[#08080b] flex items-center gap-2 overflow-x-auto select-none">
              <div className="flex-none text-[9px] font-mono uppercase tracking-wider text-[#666675] pr-1">
                History ({history.length})
              </div>
              {history.map((item) => {
                const isActive = activeImage?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveImage(item);
                      setViewMode('normal');
                    }}
                    className={`flex-none h-16 w-16 relative rounded overflow-hidden border transition-all cursor-pointer group ${
                      isActive ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'border-[#22222a] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono text-center text-[var(--color-accent)] truncate px-0.5">
                      {item.aspectRatio}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Drawer: Canvas Post-Processing Adjustments Panel */}
        {showAdjustmentsPanel && (
          <div className="w-72 lg:w-80 flex-none h-full z-20">
            <ImageAdjustmentsPanel
              adjustments={adjustments}
              onChange={setAdjustments}
              onReset={() => setAdjustments(DEFAULT_IMAGE_ADJUSTMENTS)}
              onClose={() => setShowAdjustmentsPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Remix / Image-to-Image Modal */}
      {showRemixModal && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0e0e12] border border-[#24242e] rounded-lg shadow-2xl overflow-hidden text-[#e0e0e6] select-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#202028] bg-[#111116]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[var(--color-accent)]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-white">
                  Remix & Modify Image
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRemixModal(false)}
                className="text-[#888894] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Thumbnail of active image being modified */}
              <div className="flex items-center gap-3 p-2 bg-[#08080b] rounded border border-[#1b1b22]">
                <img
                  src={activeImage.imageUrl}
                  alt="Base"
                  className="w-16 h-16 object-cover rounded border border-[#282832]"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 text-xs">
                  <div className="text-[10px] font-mono text-[var(--color-accent)] uppercase">Source Baseline</div>
                  <div className="truncate text-[#a0a0b0] text-[11px]">{activeImage.prompt}</div>
                  <div className="text-[10px] font-mono text-[#666672]">
                    Aspect: {activeImage.aspectRatio} • Seed: {activeImage.seed}
                  </div>
                </div>
              </div>

              {/* Modification Instruction Input */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e8e9c] mb-1.5 font-mono">
                  Modification Instruction
                </label>
                <textarea
                  rows={3}
                  value={remixInstruction}
                  onChange={(e) => setRemixInstruction(e.target.value)}
                  placeholder="e.g. Add a glowing cybernetic helmet with neon visor, turn the background into a stormy night..."
                  className="w-full px-3 py-2 text-xs bg-[#14141a] border border-[#24242e] rounded text-white focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              {/* Transformation Strength */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono text-[#8e8e9c] uppercase">Transformation Strength</span>
                  <span className="font-mono text-[10px] text-[var(--color-accent)]">{Math.round(remixStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={remixStrength}
                  onChange={(e) => setRemixStrength(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1b1b22] rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#666675] mt-1">
                  <span>Subtle tweak (10%)</span>
                  <span>Balanced (75%)</span>
                  <span>Radical redo (100%)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b1b22]">
                <button
                  type="button"
                  onClick={() => setShowRemixModal(false)}
                  className="px-3 py-1.5 text-xs font-mono rounded bg-[#14141a] border border-[#22222a] text-[#888894] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRemixing || !remixInstruction.trim()}
                  onClick={handleRemix}
                  className="px-4 py-1.5 text-xs font-mono font-semibold rounded bg-[var(--color-accent)] text-black hover:bg-[#d6b793] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isRemixing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Remixing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-black" />
                      <span>Synthesize Remix</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
