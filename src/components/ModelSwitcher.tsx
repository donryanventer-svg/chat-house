import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Cloud, Check, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Model } from '../types';

interface ModelSwitcherProps {
  currentModel: Model;
  allModels: Model[];
  onSelectModel: (model: Model) => void;
  onOpenModelLabNew: () => void;
  onOpenCompare: () => void;
  onOpenHuggingFaceModal?: () => void;
}

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  currentModel,
  allModels,
  onSelectModel,
  onOpenModelLabNew,
  onOpenCompare,
  onOpenHuggingFaceModal,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const hfModels = allModels.filter((m) => m.isHf || m.id.startsWith('hf:'));
  const customModels = allModels.filter((m) => m.isCustom && !m.isHf && !m.id.startsWith('hf:'));
  const cloudModels = allModels.filter((m) => !m.local && !m.isCustom && !m.isHf && !m.id.startsWith('hf:'));
  const localModels = allModels.filter((m) => m.local && !m.isCustom && !m.isHf && !m.id.startsWith('hf:'));

  const renderIcon = (model: Model) => {
    if (model.isHf || model.id.startsWith('hf:')) {
      return <span className="text-xs flex-none leading-none">🤗</span>;
    }
    if (model.isCustom) {
      return <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />;
    }
    if (model.local) {
      return <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />;
    }
    return <Cloud className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />;
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Switcher Button */}
      <button
        type="button"
        id="btn-model-switcher"
        onClick={() => setOpen(!open)}
        className="blueprint h-[34px] flex items-center gap-2 px-3 bg-[#111111] hover:bg-[#181818] text-[#f3f3f3] rounded-sm text-xs font-medium cursor-pointer border border-[#262626] shadow-sm transition-colors"
      >
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />
        {renderIcon(currentModel)}
        <span className="font-semibold tracking-wide text-[#f3f3f3]">
          {currentModel.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#737373] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {open && (
        <div
          id="model-switcher-popover"
          className="blueprint absolute right-0 top-10 w-[380px] max-h-[520px] overflow-y-auto bg-[#0a0a0a] border border-[#222222] shadow-2xl p-2.5 z-50 rounded-sm"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />

          {/* Hugging Face Hub Models */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#ff9d00] uppercase px-2 py-1 select-none flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <span>🤗 Hugging Face Hub</span>
              </span>
              <span className="text-[9px] text-[#737373] font-mono">
                {hfModels.length} active
              </span>
            </div>
            {hfModels.length > 0 ? (
              <div className="space-y-1">
                {hfModels.map((m) => {
                  const isSelected = m.id === currentModel.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m);
                        setOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#ff9d00]/15 border border-[#ff9d00]/40'
                          : 'hover:bg-[#141414] border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f3f3]">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#ff9d00]/20 text-[#ff9d00] rounded font-mono">
                            {m.context}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#888888] line-clamp-1 mt-0.5">
                          {m.desc}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#ff9d00] flex-none mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 bg-[#111111] border border-[#1c1c1c] rounded text-center space-y-1.5">
                <div className="text-[11px] text-[#888888]">No Hugging Face models added yet</div>
                {onOpenHuggingFaceModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenHuggingFaceModal();
                      setOpen(false);
                    }}
                    className="w-full py-1 text-xs bg-[#ff9d00]/15 hover:bg-[#ff9d00]/25 text-[#ff9d00] border border-[#ff9d00]/30 rounded cursor-pointer transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <span>+ Explore Hugging Face Hub</span>
                  </button>
                )}
              </div>
            )}
            {hfModels.length > 0 && onOpenHuggingFaceModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenHuggingFaceModal();
                  setOpen(false);
                }}
                className="w-full mt-1.5 py-1 text-[11px] text-[#ff9d00] hover:text-[#ffb020] hover:bg-[#161616] rounded cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <span>+ Explore / Add More HF Models</span>
              </button>
            )}
          </div>

          {/* Custom Models */}
          {customModels.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-accent)] uppercase px-2 py-1 select-none flex items-center justify-between font-mono">
                <span>Custom & Tuned Models</span>
                <span className="text-[9px] text-[#737373] font-mono">
                  {customModels.length} active
                </span>
              </div>
              <div className="space-y-1">
                {customModels.map((m) => {
                  const isSelected = m.id === currentModel.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m);
                        setOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40'
                          : 'hover:bg-[#141414] border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#f3f3f3]">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded font-mono">
                            Tuned
                          </span>
                        </div>
                        <p className="text-[11px] text-[#888888] line-clamp-2 mt-0.5">
                          {m.desc}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] flex-none mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cloud Engines */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-accent)] uppercase px-2 py-1 select-none flex items-center justify-between font-mono">
              <span>Cloud Engines</span>
              <span className="text-[9px] text-[#737373] font-mono">Frontier</span>
            </div>
            <div className="space-y-1">
              {cloudModels.map((m) => {
                const isSelected = m.id === currentModel.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40'
                        : 'hover:bg-[#141414] border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#f3f3f3]">{m.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#1c1c1c] text-[#a3a3a3] rounded font-mono">
                          {m.context}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] line-clamp-2 mt-0.5">{m.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] flex-none mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local On-Device */}
          <div className="mb-2">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-accent)] uppercase px-2 py-1 select-none flex items-center justify-between font-mono">
              <span>Local On-Device</span>
              <span className="text-[9px] text-[#737373] font-mono">Private</span>
            </div>
            <div className="space-y-1">
              {localModels.map((m) => {
                const isSelected = m.id === currentModel.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40'
                        : 'hover:bg-[#141414] border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#f3f3f3]">{m.name}</span>
                        {m.size && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#1c1c1c] text-[#a3a3a3] rounded font-mono">
                            {m.size}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#888888] line-clamp-2 mt-0.5">{m.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] flex-none mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions: Teach New Model & Compare & Hugging Face Hub */}
          <div className="pt-2 border-t border-[#1c1c1c] flex items-center gap-2 mt-2">
            <button
              type="button"
              id="btn-teach-new-model"
              onClick={() => {
                onOpenModelLabNew();
                setOpen(false);
              }}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222222] text-[var(--color-accent)] text-xs font-medium rounded-sm transition-colors cursor-pointer border border-[var(--color-accent)]/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Teach Model</span>
            </button>

            {onOpenHuggingFaceModal && (
              <button
                type="button"
                id="btn-open-hf-modal"
                onClick={() => {
                  onOpenHuggingFaceModal();
                  setOpen(false);
                }}
                className="h-8 px-2.5 flex items-center justify-center gap-1 bg-[#141414] hover:bg-[#1a1a1a] text-[#ff9d00] text-xs font-medium rounded-sm transition-colors cursor-pointer border border-[#ff9d00]/30"
                title="Explore Hugging Face Hub"
              >
                <span className="text-xs">🤗</span>
                <span>HF Hub</span>
              </button>
            )}

            <button
              type="button"
              id="btn-compare-models"
              onClick={() => {
                onOpenCompare();
                setOpen(false);
              }}
              className="h-8 px-2.5 flex items-center justify-center gap-1 text-[#888888] hover:text-[#f3f3f3] hover:bg-[#141414] text-xs font-medium rounded-sm transition-colors cursor-pointer border border-[#222222]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
