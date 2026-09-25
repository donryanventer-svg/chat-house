import React from 'react';
import { Terminal, Minus, Square, X, ShieldCheck, Download, Menu, Smartphone, Monitor } from 'lucide-react';
import { HuggingFaceUser } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TitleBarProps {
  activeTitle: string;
  hasCustomEndpoint: boolean;
  huggingFaceUser?: HuggingFaceUser | null;
  onOpenHuggingFaceModal?: () => void;
  onOpenInstallModal?: () => void;
  onToggleSidebar?: () => void;
  onShowToast: (msg: string) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeTitle,
  hasCustomEndpoint,
  huggingFaceUser,
  onOpenHuggingFaceModal,
  onOpenInstallModal,
  onToggleSidebar,
  onShowToast,
}) => {
  const { isInstalled, isAndroid, isPC } = usePWAInstall();

  return (
    <div
      id="titlebar"
      className="h-[38px] md:h-[34px] flex-none flex items-center justify-between px-2.5 md:px-3 select-none z-20 border-b"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
        {/* Mobile Drawer Hamburger (Visible on small screens) */}
        {onToggleSidebar && (
          <button
            type="button"
            id="btn-toggle-mobile-sidebar"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 -ml-1 rounded text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            title="Toggle navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
          <Terminal className="w-3.5 h-3.5 flex-none" />
          <span className="text-xs font-semibold tracking-[0.18em] text-white uppercase font-mono">
            Forge
          </span>
        </div>
        <span className="text-[#555555] text-xs hidden sm:inline">—</span>
        <span className="text-xs text-[#a3a3a3] truncate max-w-[130px] sm:max-w-[200px] md:max-w-[280px] font-medium tracking-wide">
          {activeTitle || 'Workspace'}
        </span>
        {hasCustomEndpoint && (
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
            <ShieldCheck className="w-2.5 h-2.5" />
            Proxy
          </span>
        )}
        {onOpenHuggingFaceModal && (
          <button
            type="button"
            onClick={onOpenHuggingFaceModal}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors bg-[#141414] hover:bg-[#1f1f1f] border border-[#242424] text-[#cfcfcf]"
            title={huggingFaceUser ? `Connected to Hugging Face as @${huggingFaceUser.username}` : 'Connect your Hugging Face account'}
          >
            <span>🤗</span>
            {huggingFaceUser ? (
              <span className="text-[#ff9d00] font-medium truncate max-w-[70px]">@{huggingFaceUser.username}</span>
            ) : (
              <span className="text-[#888888] hover:text-[#ff9d00]">HF</span>
            )}
          </button>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1 h-full">
        {/* PWA Install Button (if not installed) */}
        {!isInstalled && onOpenInstallModal && (
          <button
            type="button"
            id="btn-titlebar-install-pwa"
            onClick={onOpenInstallModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium font-mono cursor-pointer transition-all bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/50 text-[#f5dfc6]"
            title={isAndroid ? 'Install Forge as Android App' : 'Install Forge as Desktop PC App'}
          >
            {isAndroid ? (
              <Smartphone className="w-3 h-3 text-[var(--color-accent)]" />
            ) : (
              <Monitor className="w-3 h-3 text-[var(--color-accent)]" />
            )}
            <span className="font-semibold">{isAndroid ? 'Get Android App' : 'Install PC App'}</span>
          </button>
        )}

        {/* Windows Chrome Control Buttons (PC Desktop) */}
        <div className="hidden md:flex items-stretch h-full -mr-3 ml-1">
          <button
            type="button"
            id="btn-window-minimize"
            title="Minimize"
            onClick={() => onShowToast('Forge session minimized to system tray')}
            className="w-10 h-full flex items-center justify-center text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f3f3f3] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="btn-window-maximize"
            title="Toggle Fullscreen"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                onShowToast('Fullscreen mode engaged');
              } else {
                document.exitFullscreen().catch(() => {});
                onShowToast('Window restored');
              }
            }}
            className="w-10 h-full flex items-center justify-center text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f3f3f3] transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            id="btn-window-close"
            title="Close Workspace"
            onClick={() => onShowToast('Workspace state saved safely')}
            className="w-11 h-full flex items-center justify-center text-[#888888] hover:bg-[#b91c1c] hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
