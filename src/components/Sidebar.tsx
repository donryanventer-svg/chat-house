import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit3, FlaskConical, Settings, MessageSquare, X, Download, Sparkles } from 'lucide-react';
import { Thread, HuggingFaceUser, AppView } from '../types';

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  currentView: AppView;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenInstallModal?: () => void;
  huggingFaceUser?: HuggingFaceUser | null;
  onOpenHuggingFaceModal?: () => void;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  onGoToView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  currentView,
  mobileOpen = false,
  onCloseMobile,
  onOpenInstallModal,
  huggingFaceUser,
  onOpenHuggingFaceModal,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  onGoToView,
}) => {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group threads
  const todayThreads = filteredThreads.filter((t) => t.group === 'Today');
  const yesterdayThreads = filteredThreads.filter((t) => t.group === 'Yesterday');
  const olderThreads = filteredThreads.filter(
    (t) => t.group !== 'Today' && t.group !== 'Yesterday'
  );

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameDraft(title);
  };

  const handleCommitRename = (id: string) => {
    if (renameDraft.trim()) {
      onRenameThread(id, renameDraft.trim());
    }
    setRenamingId(null);
  };

  const renderGroup = (name: string, list: Thread[]) => {
    if (list.length === 0) return null;
    return (
      <div key={name} className="mb-3">
        <div className="text-[10px] font-semibold tracking-[0.16em] text-[#737373] uppercase px-2 py-1 select-none">
          {name}
        </div>
        <div className="space-y-0.5">
          {list.map((t) => {
            const isActive = currentView === 'chat' && t.id === activeThreadId;
            const isRenaming = renamingId === t.id;

            return (
              <div
                key={t.id}
                id={`thread-item-${t.id}`}
                onClick={() => {
                  onSelectThread(t.id);
                  onGoToView('chat');
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group flex items-center justify-between px-2.5 py-2 text-xs rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-accent)]/15 text-[#ffffff] border border-[var(--color-accent)]/40'
                    : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-[#f3f3f3]'
                }`}
              >
                {isRenaming ? (
                  <input
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename(t.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => handleCommitRename(t.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#111111] text-[#f3f3f3] px-1.5 py-0.5 rounded border border-[var(--color-accent)] text-xs focus:outline-none"
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                      <MessageSquare className="w-3.5 h-3.5 flex-none opacity-80 text-[var(--color-accent)]" />
                      <div className="truncate">
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="text-[10px] text-[#555555] font-mono">{t.updated}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Rename Thread"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(t.id, t.title);
                        }}
                        className="p-1 text-[#888888] hover:text-[#f3f3f3] hover:bg-[#1f1f1f] rounded"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        title="Delete Thread"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(t.id);
                        }}
                        className="p-1 text-[#888888] hover:text-red-400 hover:bg-red-500/15 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        id="sidebar-panel"
        className={`fixed inset-y-0 left-0 z-40 w-72 md:static md:w-[272px] flex-none flex flex-col border-r select-none transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-divider)',
        }}
      >
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-3 border-b border-[#1c1c1c] bg-[#121212]">
          <span className="text-xs font-semibold text-[var(--color-accent)] font-mono uppercase tracking-wider">
            Threads & Workspaces
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded text-[#888888] hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Thread Button */}
        <div className="p-3 pb-2">
          <button
            type="button"
            id="btn-new-thread"
            onClick={() => {
              onNewThread();
              onGoToView('chat');
              if (onCloseMobile) onCloseMobile();
            }}
            className="blueprint w-full h-[38px] flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs transition-colors rounded-sm cursor-pointer shadow-sm tracking-wide uppercase font-mono"
          >
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            <Plus className="w-4 h-4 text-[#080808]" />
            <span>New Thread</span>
          </button>
        </div>

      {/* Search Threads */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#666666] pointer-events-none" />
          <input
            type="text"
            id="sidebar-search-threads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads"
            className="w-full bg-[#111111] border border-[#222222] rounded-sm pl-8 pr-2.5 py-1.5 text-xs text-[#f3f3f3] placeholder-[#555555] focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {renderGroup('Today', todayThreads)}
        {renderGroup('Yesterday', yesterdayThreads)}
        {renderGroup('Previous', olderThreads)}

        {filteredThreads.length === 0 && (
          <div className="py-8 text-center text-xs text-[#666666]">
            {search ? 'No matching threads.' : 'No threads yet.'}
          </div>
        )}
      </div>

      {/* Bottom Nav: Model Lab, Hugging Face & Settings */}
      <div className="p-2 border-t border-[#1c1c1c] space-y-1 bg-[#0a0a0a]">
        {onOpenHuggingFaceModal && (
          <button
            type="button"
            id="nav-huggingface"
            onClick={onOpenHuggingFaceModal}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer text-[#a3a3a3] hover:bg-[#141414] hover:text-[#f3f3f3] group border border-transparent hover:border-[#222]"
            title="Link Hugging Face Hub account"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm flex-none">🤗</span>
              <span className="truncate">Hugging Face</span>
            </div>
            {huggingFaceUser ? (
              <span className="text-[10px] font-mono text-[#ff9d00] bg-[#ff9d00]/15 px-1.5 py-0.5 rounded border border-[#ff9d00]/30 truncate max-w-[80px]">
                @{huggingFaceUser.username}
              </span>
            ) : (
              <span className="text-[10px] text-[#666666] group-hover:text-[var(--color-accent)] transition-colors font-mono">
                Connect
              </span>
            )}
          </button>
        )}

        {onOpenInstallModal && (
          <button
            type="button"
            id="nav-install-app-sidebar"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenInstallModal();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer text-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Download className="w-4 h-4 text-[var(--color-accent)] flex-none" />
              <span className="truncate">Install App</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-accent)] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15">
              Android / PC
            </span>
          </button>
        )}

        <button
          type="button"
          id="nav-image-studio"
          onClick={() => {
            onGoToView('imageStudio');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
            currentView === 'imageStudio'
              ? 'bg-[var(--color-accent)]/15 text-[#ffffff] border border-[var(--color-accent)]/40'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-[#f3f3f3]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)] flex-none" />
            <span className="truncate">Neural Image Studio</span>
          </div>
          <span className="text-[9px] font-mono text-[var(--color-accent)] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15">
            Gen & Remix
          </span>
        </button>

        <button
          type="button"
          id="nav-model-lab"
          onClick={() => {
            onGoToView('modelLab');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
            currentView === 'modelLab'
              ? 'bg-[var(--color-accent)]/15 text-[#ffffff] border border-[var(--color-accent)]/40'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-[#f3f3f3]'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-[var(--color-accent)] flex-none" />
          <span>Model Lab & Training</span>
        </button>
        <button
          type="button"
          id="nav-settings"
          onClick={() => {
            onGoToView('settings');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
            currentView === 'settings'
              ? 'bg-[var(--color-accent)]/15 text-[#ffffff] border border-[var(--color-accent)]/40'
              : 'text-[#a3a3a3] hover:bg-[#141414] hover:text-[#f3f3f3]'
          }`}
        >
          <Settings className="w-4 h-4 text-[var(--color-accent)] flex-none" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  </>
  );
};
