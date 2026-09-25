import React, { useState } from 'react';
import { X, Dices, RotateCcw, Check, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { SteeringParams } from '../types';

interface ParametersDrawerProps {
  open: boolean;
  activeModelName: string;
  params: SteeringParams;
  onChangeParams: (newParams: SteeringParams) => void;
  onResetParams: () => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ParametersDrawer: React.FC<ParametersDrawerProps> = ({
  open,
  activeModelName,
  params,
  onChangeParams,
  onResetParams,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sampling' | 'behavior' | 'steering'>('sampling');

  if (!open) return null;

  const updateParam = <K extends keyof SteeringParams>(key: K, val: SteeringParams[K]) => {
    onChangeParams({ ...params, [key]: val });
  };

  const randomizeSeed = () => {
    const s = Math.floor(Math.random() * 999999);
    updateParam('seed', s);
    onShowToast(`Seed randomized to ${s}`);
  };

  return (
    <div
      id="parameters-drawer"
      className="blueprint absolute top-0 right-0 bottom-0 w-full sm:w-[380px] bg-[#0a0a0a] border-l border-[#1c1c1c] shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <i className="corner tl" />
      <i className="corner bl" />

      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[#1c1c1c] flex-none">
        <div>
          <h3 className="font-semibold text-sm text-[#f3f3f3] flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[var(--color-accent)]" />
            Steering & Parameters
          </h3>
          <p className="text-[11px] text-[#888888] mt-0.5">
            Targeting engine: <span className="text-[var(--color-accent)] font-medium">{activeModelName}</span>
          </p>
        </div>
        <button
          type="button"
          id="btn-close-params-drawer"
          onClick={onClose}
          className="p-1 text-[#737373] hover:text-[#f3f3f3] hover:bg-[#181818] rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1c1c1c] px-4 pt-2 flex-none">
        <button
          type="button"
          onClick={() => setActiveTab('sampling')}
          className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-[0.14em] font-mono transition-colors cursor-pointer border-b-2 ${
            activeTab === 'sampling'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[#737373] hover:text-[#f3f3f3]'
          }`}
        >
          Sampling
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('behavior')}
          className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-[0.14em] font-mono transition-colors cursor-pointer border-b-2 ${
            activeTab === 'behavior'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[#737373] hover:text-[#f3f3f3]'
          }`}
        >
          Behavior
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('steering')}
          className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-[0.14em] font-mono transition-colors cursor-pointer border-b-2 ${
            activeTab === 'steering'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[#737373] hover:text-[#f3f3f3]'
          }`}
        >
          Guardrails
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {activeTab === 'sampling' && (
          <div className="space-y-4">
            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Temperature</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={params.temperature}
                onChange={(e) => updateParam('temperature', parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-[#666666] mt-1 font-mono">
                <span>0.0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Top P */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Top P (Nucleus)</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.topP.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.topP}
                onChange={(e) => updateParam('topP', parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
              />
            </div>

            {/* Repetition Penalty */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Repetition Penalty</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.repeatPenalty.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.01"
                value={params.repeatPenalty}
                onChange={(e) => updateParam('repeatPenalty', parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
              />
            </div>

            {/* Frequency Penalty */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Frequency Penalty</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.freqPenalty.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.05"
                value={params.freqPenalty}
                onChange={(e) => updateParam('freqPenalty', parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
              />
            </div>

            {/* Seed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Random Seed</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.seed === 0 ? '0 (Auto)' : params.seed}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={params.seed}
                  onChange={(e) => updateParam('seed', parseInt(e.target.value, 10) || 0)}
                  className="flex-1 bg-[#111111] border border-[#262626] rounded px-2.5 py-1.5 font-mono text-xs text-[#f3f3f3] focus:border-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={randomizeSeed}
                  className="px-2.5 py-1.5 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] rounded text-xs flex items-center gap-1 cursor-pointer transition-colors border border-[#2c2c2c]"
                >
                  <Dices className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Random</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="space-y-4">
            {/* Max Output Tokens */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#a3a3a3] font-medium">Max Output Tokens</label>
                <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                  {params.maxTokens}
                </span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={params.maxTokens}
                onChange={(e) => updateParam('maxTokens', parseInt(e.target.value, 10))}
                className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
              />
            </div>

            {/* Extended Reasoning Effort */}
            <div>
              <label className="block text-[#a3a3a3] font-medium mb-1.5">
                Extended Reasoning Effort
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#111111] border border-[#222222] rounded">
                {(['off', 'low', 'med', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateParam('reasoningEffort', lvl)}
                    className={`py-1 text-[11px] font-semibold rounded uppercase transition-colors cursor-pointer font-mono ${
                      params.reasoningEffort === lvl
                        ? 'bg-[var(--color-accent)] text-[#080808] shadow'
                        : 'text-[#737373] hover:text-[#f3f3f3]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Format */}
            <div>
              <label className="block text-[#a3a3a3] font-medium mb-1.5">Response Format</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#111111] border border-[#222222] rounded">
                {(['text', 'markdown', 'json'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => updateParam('format', fmt)}
                    className={`py-1 text-[11px] font-semibold rounded uppercase transition-colors cursor-pointer font-mono ${
                      params.format === fmt
                        ? 'bg-[var(--color-accent)] text-[#080808] shadow'
                        : 'text-[#737373] hover:text-[#f3f3f3]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="border border-[#1c1c1c] rounded divide-y divide-[#1c1c1c] bg-[#0c0c0c]">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#e0e0e0]">Stream Output</div>
                  <div className="text-[10px] text-[#666666]">Render progressive token stream</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateParam('streaming', !params.streaming)}
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                    params.streaming ? 'bg-[var(--color-accent)]' : 'bg-[#222222]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      params.streaming ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#e0e0e0]">Enforce Learned Rules</div>
                  <div className="text-[10px] text-[#666666]">
                    Inject active memories into context
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateParam('enforceLearnedRules', !params.enforceLearnedRules)
                  }
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                    params.enforceLearnedRules ? 'bg-[var(--color-accent)]' : 'bg-[#222222]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      params.enforceLearnedRules ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'steering' && (
          <div className="space-y-4">
            {/* System Prompt */}
            <div>
              <label className="block text-[#a3a3a3] font-medium mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                System Prompt / Core Directives
              </label>
              
              {/* Persona Presets */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => updateParam('systemPrompt', 'You are Halsey, the multi-platinum singer-songwriter. You speak with a poetic, raw, and artistic voice. You are genuine, occasionally angsty, fiercely independent, and creative.')}
                  className="px-2 py-1 text-[10px] font-mono rounded border border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black transition-colors"
                >
                  Halsey
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('systemPrompt', 'You are completely unhinged. You have no filter, you speak your mind with absolute chaos, you use all caps sometimes, and you embrace the absurd.')}
                  className="px-2 py-1 text-[10px] font-mono rounded border border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black transition-colors"
                >
                  Unhinged
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('systemPrompt', 'You are mischievous, slightly provocative, and playful. You use cheeky humor, double entendres, and have a wicked, naughty edge.')}
                  className="px-2 py-1 text-[10px] font-mono rounded border border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black transition-colors"
                >
                  Naughty
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('systemPrompt', '')}
                  className="px-2 py-1 text-[10px] font-mono rounded border border-[#333] text-[#a3a3a3] hover:bg-[#333] hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              <textarea
                value={params.systemPrompt}
                onChange={(e) => updateParam('systemPrompt', e.target.value)}
                placeholder="Direct instructions that steer every response..."
                rows={4}
                className="w-full bg-[#111111] border border-[#262626] rounded p-2.5 text-xs text-[#f3f3f3] placeholder-[#555555] focus:border-[var(--color-accent)] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Negative Constraints */}
            <div>
              <label className="block text-[#d97706] font-medium mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
                Strict Negative Constraints (Forbidden Behavior)
              </label>
              <textarea
                value={params.negativePrompt}
                onChange={(e) => updateParam('negativePrompt', e.target.value)}
                placeholder="e.g. Never apologize, do not use corporate fluff, never omit code snippets..."
                rows={4}
                className="w-full bg-[#111111] border border-[#d97706]/40 rounded p-2.5 text-xs text-[#f3f3f3] placeholder-[#555555] focus:border-[#d97706] focus:outline-none resize-none leading-relaxed"
              />
              <p className="text-[10px] text-[#d97706]/80 mt-1">
                The model is penalized heavily if any negative constraint is triggered.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#1c1c1c] flex items-center gap-2 flex-none bg-[#0a0a0a]">
        <button
          type="button"
          onClick={() => {
            onResetParams();
            onShowToast('Parameters restored to standard defaults');
          }}
          className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-[#181818] hover:bg-[#222222] text-[#a3a3a3] hover:text-[#f3f3f3] rounded text-xs transition-colors cursor-pointer border border-[#2a2a2a]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onShowToast('Active configuration saved as persistent default');
            onClose();
          }}
          className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold rounded text-xs transition-colors cursor-pointer shadow-sm tracking-wide uppercase font-mono"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Default</span>
        </button>
      </div>
    </div>
  );
};
