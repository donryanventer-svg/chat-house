import React from 'react';
import {
  Smartphone,
  Monitor,
  Download,
  CheckCircle2,
  X,
  Share2,
  Sparkles,
  Layers,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, isPC, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'accepted') {
        onShowToast('Installation initiated! Adding Forge to your device.');
        onClose();
      } else if (result === 'dismissed') {
        onShowToast('Installation cancelled.');
      }
    } else {
      if (isAndroid) {
        onShowToast('Tap the browser menu (⋮) in Chrome and select "Install app" or "Add to Home screen"');
      } else if (isIOS) {
        onShowToast('Tap the Share button in Safari and select "Add to Home Screen"');
      } else {
        onShowToast('Click the install icon in your browser address bar to install on PC');
      }
    }
  };

  return (
    <div
      id="pwa-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="pwa-install-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0e0e0e] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1c] bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Install Forge Control Engine
                {isInstalled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                    Installed
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#888888]">Native experience for Android and PC</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#888888] hover:text-white hover:bg-[#202020] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Dual Platform Feature Highlights */}
          <div className="grid grid-cols-2 gap-3">
            {/* Android Tile */}
            <div className={`p-3.5 rounded-lg border transition-all ${
              isAndroid
                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40'
                : 'bg-[#141414] border-[#222222]'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
                <Smartphone className="w-4 h-4" />
                <span className="text-xs font-semibold tracking-wider uppercase font-mono">
                  Android App
                </span>
              </div>
              <ul className="text-[11px] text-[#a3a3a3] space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Full-screen standalone display
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Bottom touch navigation
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Home screen adaptive icon
                </li>
              </ul>
            </div>

            {/* PC Tile */}
            <div className={`p-3.5 rounded-lg border transition-all ${
              isPC
                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40'
                : 'bg-[#141414] border-[#222222]'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-semibold tracking-wider uppercase font-mono">
                  PC Desktop App
                </span>
              </div>
              <ul className="text-[11px] text-[#a3a3a3] space-y-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Standalone desktop window
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Pin to Taskbar & Start Menu
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-none" />
                  Full keyboard shortcuts
                </li>
              </ul>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="bg-[#121212] border border-[#1f1f1f] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-start gap-3">
              <WifiOff className="w-4 h-4 text-[var(--color-accent)] mt-0.5 flex-none" />
              <div>
                <div className="text-xs font-medium text-[#e5e5e5]">Offline Capability & Instant Launch</div>
                <div className="text-[11px] text-[#888888]">Service workers precache code, UI, and custom parameters for ultra-fast startup without internet latency.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers className="w-4 h-4 text-[var(--color-accent)] mt-0.5 flex-none" />
              <div>
                <div className="text-xs font-medium text-[#e5e5e5]">Unified Sync & Local Privacy</div>
                <div className="text-[11px] text-[#888888]">Your custom models, learned memories, and steering presets persist safely in local storage across both platforms.</div>
              </div>
            </div>
          </div>

          {/* Installation Instructions if automated prompt isn't directly triggered */}
          {!isInstallable && !isInstalled && (
            <div className="p-3 bg-[#171717] rounded-lg border border-[#2a2a2a] text-xs text-[#b0b0b0] space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                How to install manually on your browser:
              </div>
              {isAndroid ? (
                <p className="leading-relaxed">
                  In Chrome / Samsung Internet on Android, tap the three dots (<span className="font-bold text-white">⋮</span>) in the top-right corner, then tap <span className="font-medium text-[var(--color-accent)]">"Install app"</span> or <span className="font-medium text-[var(--color-accent)]">"Add to Home screen"</span>.
                </p>
              ) : isIOS ? (
                <p className="leading-relaxed flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[var(--color-accent)] inline" />
                  Tap the Share button at the bottom of Safari, then tap <span className="font-medium text-[var(--color-accent)]">"Add to Home Screen"</span>.
                </p>
              ) : (
                <p className="leading-relaxed">
                  On Chrome or Edge for PC, look for the install icon (<Download className="w-3.5 h-3.5 inline text-[var(--color-accent)]" />) on the right side of the address bar, or click Menu (<span className="font-bold text-white">⋮</span>) &rarr; <span className="font-medium text-[var(--color-accent)]">"Install Forge Control Engine"</span>.
                </p>
              )}
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-none" />
              <span>Forge is running in standalone application mode. You're all set!</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#1c1c1c] bg-[#121212] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#888888] hover:text-white transition-colors"
          >
            Dismiss
          </button>

          {!isInstalled && (
            <button
              type="button"
              id="btn-confirm-install-pwa"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[#d8b58d] text-black font-semibold text-xs rounded-md shadow transition-all cursor-pointer font-mono uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              {isAndroid ? 'Install on Android' : isPC ? 'Install on PC' : 'Install App'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
