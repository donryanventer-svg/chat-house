import React from 'react';
import { X, SlidersHorizontal, Cpu, Cloud, Sparkles, Check } from 'lucide-react';
import { Model } from '../types';

interface CompareModalProps {
  open: boolean;
  models: Model[];
  currentModelId: string;
  onSelectModel: (m: Model) => void;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  open,
  models,
  currentModelId,
  onSelectModel,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="blueprint bg-[#0a0a0a] border border-[#1f1f1f] shadow-2xl rounded w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] flex-none">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <SlidersHorizontal className="w-4 h-4" />
            <h3 className="font-serif italic text-base text-[#f3f3f3]">
              Engine Specifications & Capabilities Matrix
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-x-auto p-4 text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-[#888888] font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 pr-4">Model Engine</th>
                <th className="pb-3 pr-4">Deployment</th>
                <th className="pb-3 pr-4">Context Window</th>
                <th className="pb-3 pr-4">Latency Profile</th>
                <th className="pb-3 pr-4">Specialized Domain</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818]">
              {models.map((m) => {
                const isSelected = m.id === currentModelId;
                return (
                  <tr key={m.id} className="hover:bg-[#141414] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-[#f3f3f3] flex items-center gap-2">
                        {m.isCustom ? (
                          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        ) : m.local ? (
                          <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        )}
                        <span>{m.name}</span>
                        {m.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded font-mono border border-[var(--color-accent)]/30">
                            Tuned
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#888888] line-clamp-1 mt-0.5 max-w-xs">
                        {m.desc}
                      </div>
                    </td>

                    <td className="py-3.5 pr-4 font-mono text-[#a3a3a3]">
                      {m.isCustom
                        ? 'Custom LoRA / Adapter'
                        : m.local
                        ? `Local Device (${m.size || 'Quantized'})`
                        : 'Google Cloud TPU'}
                    </td>

                    <td className="py-3.5 pr-4 font-mono text-[var(--color-accent)]">{m.context} tokens</td>

                    <td className="py-3.5 pr-4 font-mono text-[#a3a3a3]">{m.speed}</td>

                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {m.tags.map((tag, tIdx) => (
                          <span
                            key={`${m.id}-${tag}-${tIdx}`}
                            className="px-1.5 py-0.5 bg-[#141414] border border-[#222222] rounded text-[10px] text-[#999999] font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--color-accent)] font-semibold">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectModel(m);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[#181818] border border-[#2a2a2a] hover:bg-[var(--color-accent)] hover:text-[#080808] hover:border-[var(--color-accent)] text-[#e0e0e0] text-xs font-medium rounded transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#080808] border-t border-[#1a1a1a] text-[11px] text-[#737373] font-mono flex items-center justify-between">
          <span>All engines execute with strict negative constraint enforcement.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] border border-[#262626] rounded text-xs transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
