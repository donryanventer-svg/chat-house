import React from 'react';
import { MessageSquare, Sliders, FlaskConical, Download, Menu, Settings, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppView } from '../types';

interface MobileBottomNavProps {
  currentView: AppView;
  paramsDrawerOpen: boolean;
  onGoToView: (view: AppView) => void;
  onToggleSidebar: () => void;
  onToggleParamsDrawer: () => void;
  onOpenInstallModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  paramsDrawerOpen,
  onGoToView,
  onToggleSidebar,
  onToggleParamsDrawer,
  onOpenInstallModal,
}) => {
  const { isInstalled } = usePWAInstall();

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="md:hidden flex-none z-30 flex items-center justify-around px-2 py-1.5 border-t border-[#1c1c1c] select-none bg-[#0a0a0a]/95 backdrop-blur-md"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
      }}
    >
      {/* 1. Threads / Drawer Toggle */}
      <button
        type="button"
        id="mobile-nav-threads"
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3] transition-colors"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-mono tracking-tight">Threads</span>
      </button>

      {/* 2. Chat View */}
      <button
        type="button"
        id="mobile-nav-chat"
        onClick={() => onGoToView('chat')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          currentView === 'chat'
            ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-semibold'
            : 'text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3]'
        }`}
      >
        <MessageSquare className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-mono tracking-tight">Chat</span>
      </button>

      {/* 3. Parameters Drawer Toggle (Quick access during chat) */}
      <button
        type="button"
        id="mobile-nav-params"
        onClick={() => {
          if (currentView !== 'chat') onGoToView('chat');
          onToggleParamsDrawer();
        }}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          paramsDrawerOpen && currentView === 'chat'
            ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-semibold'
            : 'text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3]'
        }`}
      >
        <Sliders className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-mono tracking-tight">Params</span>
      </button>

      {/* 4. Neural Image Studio */}
      <button
        type="button"
        id="mobile-nav-image-studio"
        onClick={() => onGoToView('imageStudio')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          currentView === 'imageStudio'
            ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-semibold'
            : 'text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3]'
        }`}
      >
        <Sparkles className="w-5 h-5 mb-0.5 text-[var(--color-accent)]" />
        <span className="text-[10px] font-mono tracking-tight">Studio</span>
      </button>

      {/* 5. Model Lab */}
      <button
        type="button"
        id="mobile-nav-model-lab"
        onClick={() => onGoToView('modelLab')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          currentView === 'modelLab'
            ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-semibold'
            : 'text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3]'
        }`}
      >
        <FlaskConical className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-mono tracking-tight">Lab</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        id="mobile-nav-settings"
        onClick={() => onGoToView('settings')}
        className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
          currentView === 'settings'
            ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-semibold'
            : 'text-[#888888] active:bg-[#1f1f1f] hover:text-[#f3f3f3]'
        }`}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-mono tracking-tight">Settings</span>
      </button>

      {/* 6. Install (If not already running installed) */}
      {!isInstalled && (
        <button
          type="button"
          id="mobile-nav-install"
          onClick={onOpenInstallModal}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-[var(--color-accent)] bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 active:scale-95 transition-all"
        >
          <Download className="w-5 h-5 mb-0.5 animate-pulse" />
          <span className="text-[10px] font-mono font-medium tracking-tight">Install</span>
        </button>
      )}
    </nav>
  );
};
