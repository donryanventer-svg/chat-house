import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, Cpu, Sparkles, Activity } from 'lucide-react';
import { TrainingRun } from '../types';

interface FineTuneModalProps {
  open: boolean;
  onClose: () => void;
  onFinishTraining: (newRun: TrainingRun) => void;
  onShowToast: (msg: string) => void;
}

export const FineTuneModal: React.FC<FineTuneModalProps> = ({
  open,
  onClose,
  onFinishTraining,
  onShowToast,
}) => {
  const [running, setRunning] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0.42);
  const [isFinished, setIsFinished] = useState(false);
  const [adapterRank, setAdapterRank] = useState<number>(16);
  const [learningRate, setLearningRate] = useState<string>('2e-4');
  const [runName, setRunName] = useState('Senior Candor LoRA (v2.5)');

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setEpoch(0);
      setLoss(0.42);
      setIsFinished(false);
    }
  }, [open]);

  useEffect(() => {
    let timer: any;
    if (running && epoch < 5) {
      timer = setTimeout(() => {
        setEpoch((prev) => prev + 1);
        setLoss((prev) => parseFloat((prev * 0.52).toFixed(3)));
      }, 700);
    } else if (running && epoch >= 5) {
      setRunning(false);
      setIsFinished(true);
      onShowToast('Fine-tuning cycle complete! Weights compiled.');
    }
    return () => clearTimeout(timer);
  }, [running, epoch]);

  if (!open) return null;

  const startTraining = () => {
    setRunning(true);
    setEpoch(1);
    setLoss(0.385);
    setIsFinished(false);
  };

  const handleApplyNewRun = () => {
    const run: TrainingRun = {
      id: `tr-${Date.now()}`,
      name: runName.trim() || 'Custom LoRA Adapter',
      from: 'Live Verified Response Pairs',
      status: 'ready',
      applied: true,
      date: 'Just now',
      epochs: 5,
      finalLoss: loss,
    };
    onFinishTraining(run);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="blueprint bg-[#0a0a0a] border border-[#1f1f1f] shadow-2xl rounded w-full max-w-lg flex flex-col overflow-hidden text-xs"
      >
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Activity className="w-4 h-4" />
            <h3 className="font-serif italic text-base text-[#f3f3f3]">
              Fine-Tuning & Adapter Training Cycle
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

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[#a3a3a3] font-medium mb-1">Checkpoint Run Name</label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              disabled={running || isFinished}
              className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#a3a3a3] font-medium mb-1">LoRA Rank (r)</label>
              <select
                value={adapterRank}
                onChange={(e) => setAdapterRank(parseInt(e.target.value, 10))}
                disabled={running || isFinished}
                className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)]"
              >
                <option value={8}>r = 8 (Lightweight)</option>
                <option value={16}>r = 16 (Standard Candor)</option>
                <option value={32}>r = 32 (High Capacity)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#a3a3a3] font-medium mb-1">Learning Rate</label>
              <select
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
                disabled={running || isFinished}
                className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)]"
              >
                <option value="2e-4">2e-4 (Cosine Decay)</option>
                <option value="5e-5">5e-5 (Conservative)</option>
                <option value="1e-3">1e-3 (Aggressive)</option>
              </select>
            </div>
          </div>

          {/* Training Progress Box */}
          {(running || isFinished) && (
            <div className="blueprint bg-[#080808] border border-[#1f1f1f] p-4 rounded space-y-3">
              <i className="corner tl" />
              <i className="corner tr" />
              <div className="flex items-center justify-between font-mono">
                <span className="text-[var(--color-accent)] font-semibold">
                  {running ? `Epoch ${epoch} of 5 in progress...` : 'Epoch 5/5 Finished'}
                </span>
                <span className="text-[var(--color-accent)]/80">Loss: {loss}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${(epoch / 5) * 100}%` }}
                />
              </div>

              {isFinished && (
                <div className="pt-2 border-t border-[#1a1a1a] flex items-center gap-2 text-[var(--color-accent)]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">
                    Adapter weights converged. Zero-downtime constraints adhered.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#080808] border-t border-[#1a1a1a] flex items-center justify-end gap-2">
          {!isFinished ? (
            <button
              type="button"
              onClick={startTraining}
              disabled={running}
              className="blueprint h-8 px-4 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 uppercase font-mono tracking-wider"
            >
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />
              <Play className="w-3.5 h-3.5" />
              <span>{running ? 'Running Epochs...' : 'Start Training Cycle'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyNewRun}
              className="blueprint h-8 px-4 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 uppercase font-mono tracking-wider"
            >
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />
              <span>Apply Checkpoint to Active Engine</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
