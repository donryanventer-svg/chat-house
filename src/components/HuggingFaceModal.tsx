import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Unlink,
  Layers,
  Database,
  Globe,
  Key,
  Shield,
  Loader2,
  Sparkles,
  Search,
  Zap,
  Plus,
  Trash2,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { HuggingFaceUser, HuggingFaceRepo, Model } from '../types';
import { CURATED_HF_MODELS, convertHfToAppModel, HuggingFaceHubModel } from '../data/huggingFaceModels';

interface HuggingFaceModalProps {
  open: boolean;
  onClose: () => void;
  user: HuggingFaceUser | null;
  onUserUpdated: (user: HuggingFaceUser | null) => void;
  onShowToast: (msg: string) => void;
  integratedModels: Model[];
  onIntegrateModel: (model: Model, selectImmediately?: boolean) => void;
  onRemoveIntegratedModel?: (modelId: string) => void;
  initialTab?: 'hub' | 'repos' | 'connect';
}

export const HuggingFaceModal: React.FC<HuggingFaceModalProps> = ({
  open,
  onClose,
  user,
  onUserUpdated,
  onShowToast,
  integratedModels,
  onIntegrateModel,
  onRemoveIntegratedModel,
  initialTab = 'hub',
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'repos' | 'connect'>(initialTab);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Search & Filter state for Hub
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'fast' | 'code' | 'reasoning' | 'general'>('all');
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [isSearchingHub, setIsSearchingHub] = useState(false);
  const [isLiveSearchActive, setIsLiveSearchActive] = useState(false);

  // Quick custom model import state
  const [customRepoInput, setCustomRepoInput] = useState('');
  const [customRepoLoading, setCustomRepoLoading] = useState(false);
  const [customRepoError, setCustomRepoError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [repos, setRepos] = useState<{ models: HuggingFaceRepo[]; datasets: HuggingFaceRepo[] }>({
    models: [],
    datasets: [],
  });
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{
    oauthConfigured: boolean;
    redirectUri: string;
    devRedirectUri: string;
    sharedRedirectUri: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      fetchStatus();
      if (user) {
        fetchRepos();
      }
    }
  }, [open, user]);

  // Handle tab init
  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/huggingface/status');
      if (res.ok) {
        const data = await res.json();
        setOauthStatus({
          oauthConfigured: data.oauthConfigured,
          redirectUri: data.redirectUri,
          devRedirectUri: data.devRedirectUri,
          sharedRedirectUri: data.sharedRedirectUri,
        });
        if (data.user && !user) {
          onUserUpdated(data.user);
        }
      }
    } catch {}
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/huggingface/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos({
          models: data.models || [],
          datasets: data.datasets || [],
        });
      }
    } catch {
    } finally {
      setLoadingRepos(false);
    }
  };

  // Live search debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLiveSearchResults([]);
      setIsLiveSearchActive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingHub(true);
      try {
        const res = await fetch(`/api/huggingface/search?q=${encodeURIComponent(trimmed)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setLiveSearchResults(data.models);
            setIsLiveSearchActive(true);
          } else {
            setLiveSearchResults([]);
          }
        }
      } catch {
        setLiveSearchResults([]);
      } finally {
        setIsSearchingHub(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    onShowToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 1. OAuth Popup Flow
  const handleStartOAuth = async () => {
    setOauthLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/huggingface/url');
      const data = await res.json();

      if (!data.configured || !data.url) {
        setErrorMsg(
          data.message ||
            'HF_CLIENT_ID is not configured in environment. You can set HF_CLIENT_ID and HF_CLIENT_SECRET, or instantly link with a User Access Token below.'
        );
        setOauthLoading(false);
        return;
      }

      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        data.url,
        'hf_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );

      if (!authWindow) {
        setErrorMsg('Popup was blocked by your browser. Please allow popups to connect with Hugging Face.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Hugging Face OAuth.');
    } finally {
      setOauthLoading(false);
    }
  };

  // 2. Token Link Flow (hf_...)
  const handleLinkToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Please enter your Hugging Face access token.');
      return;
    }

    setTokenLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/huggingface/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify Hugging Face token.');
      }

      onUserUpdated(data.user);
      localStorage.setItem('forge_hf_user', JSON.stringify(data.user));
      setTokenInput('');
      onShowToast(`Hugging Face linked as @${data.user.username}`);
      setActiveTab('hub');
      fetchRepos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check your token.');
    } finally {
      setTokenLoading(false);
    }
  };

  // 3. Disconnect Flow
  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/huggingface/disconnect', { method: 'POST' });
      onUserUpdated(null);
      localStorage.removeItem('forge_hf_user');
      setRepos({ models: [], datasets: [] });
      onShowToast('Hugging Face account unlinked.');
      setActiveTab('connect');
    } catch (err: any) {
      onShowToast('Failed to unlink account.');
    }
  };

  // 4. Quick validate and integrate custom repo ID
  const handleIntegrateCustomRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = customRepoInput.trim();
    if (!rawInput) return;

    // Clean input if user pasted full URL
    const cleanRepoId = rawInput
      .replace(/^https?:\/\/huggingface\.co\//i, '')
      .replace(/^hf[:_-]/, '')
      .trim();

    setCustomRepoLoading(true);
    setCustomRepoError(null);

    try {
      let modelInfo: any = null;
      try {
        const res = await fetch(`/api/huggingface/model-info?id=${encodeURIComponent(cleanRepoId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.model) {
            modelInfo = data.model;
          }
        }
      } catch {
        // Fall back to direct ID parsing below
      }

      if (!modelInfo) {
        const parts = cleanRepoId.split('/');
        const author = parts.length > 1 ? parts[0] : 'Hugging Face';
        const modelName = parts.length > 1 ? parts.slice(1).join('/') : cleanRepoId;
        modelInfo = {
          id: cleanRepoId,
          name: modelName.replace(/[-_]/g, ' '),
          author,
          downloads: 0,
          likes: 0,
          pipelineTag: 'text-generation',
          context: '32K',
        };
      }

      const appModel: Model = {
        id: `hf:${modelInfo.id}`,
        name: modelInfo.name,
        local: false,
        speed: 'Balanced',
        context: modelInfo.context || '32K',
        desc: `Hugging Face repository ${modelInfo.id} (${modelInfo.pipelineTag || 'text-generation'}).`,
        tags: ['Hugging Face', modelInfo.author || 'Hub', modelInfo.context || '32K', 'Custom'],
        isHf: true,
        hfModelId: modelInfo.id,
        hfLikes: modelInfo.likes,
        hfDownloads: modelInfo.downloads,
      };

      onIntegrateModel(appModel, true);
      setCustomRepoInput('');
      setShowCustomInput(false);
      onShowToast(`Integrated and activated ${appModel.name}`);
      onClose();
    } catch (err: any) {
      setCustomRepoError(err.message || 'Failed to validate model repository.');
    } finally {
      setCustomRepoLoading(false);
    }
  };

  // Helper to check if an HF model is already integrated
  const isModelIntegrated = (hfId: string) => {
    return integratedModels.some(
      (m) => m.id === `hf:${hfId}` || m.hfModelId === hfId || m.id === hfId
    );
  };

  // Filter curated models
  const filteredCuratedModels = useMemo(() => {
    return CURATED_HF_MODELS.filter((m) => {
      // Category filter
      if (categoryFilter !== 'all' && m.category !== categoryFilter) {
        return false;
      }
      // Search text filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(query);
        const matchId = m.hfId.toLowerCase().includes(query);
        const matchAuthor = m.author.toLowerCase().includes(query);
        const matchDesc = m.desc.toLowerCase().includes(query);
        const matchTags = m.tags.some((t) => t.toLowerCase().includes(query));
        return matchName || matchId || matchAuthor || matchDesc || matchTags;
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  if (!open) return null;

  const callbackUrl =
    oauthStatus?.redirectUri ||
    'https://ais-dev-vathmrms3dgdyxmha2rfi4-57484645991.europe-west2.run.app/auth/callback';

  return (
    <div className="fixed inset-0 z-50 bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="blueprint bg-[#0d0d0d] border border-[#222222] shadow-2xl rounded-sm w-full max-w-2xl flex flex-col overflow-hidden text-xs max-h-[90vh]">
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c1c1c] bg-[#111111]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#ff9d00]/15 border border-[#ff9d00]/30 flex items-center justify-center text-base shadow-sm">
              🤗
            </div>
            <div>
              <div className="font-serif italic text-sm text-[#f3f3f3] flex items-center gap-2">
                <span>Hugging Face Hub Integration</span>
                {user ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 text-[#ff9d00] bg-[#ff9d00]/15 rounded border border-[#ff9d00]/30 not-italic font-normal">
                    <Check className="w-2.5 h-2.5" /> @{user.username}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 text-[#888888] bg-[#181818] rounded border border-[#2a2a2a] not-italic font-normal">
                    Public Hub Access
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#737373]">
                1-Click model integration, Serverless Router inference, and repository access
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#888888] hover:text-[#f3f3f3] hover:bg-[#1a1a1a] rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1c1c1c] bg-[#0a0a0a] px-5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('hub')}
            className={`py-2 px-3 text-xs font-medium border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'hub'
                ? 'border-[#ff9d00] text-[#ff9d00]'
                : 'border-transparent text-[#777777] hover:text-[#cccccc]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hub Models ({CURATED_HF_MODELS.length})</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={() => setActiveTab('repos')}
              className={`py-2 px-3 text-xs font-medium border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'repos'
                  ? 'border-[#ff9d00] text-[#ff9d00]'
                  : 'border-transparent text-[#777777] hover:text-[#cccccc]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Repos ({repos.models.length + repos.datasets.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-2 px-3 text-xs font-medium border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ml-auto ${
              activeTab === 'connect'
                ? 'border-[#ff9d00] text-[#ff9d00]'
                : 'border-transparent text-[#777777] hover:text-[#cccccc]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{user ? 'Account Settings' : 'Connect Token / OAuth'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-none text-red-400 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMsg}</div>
            </div>
          )}

          {/* TAB 1: HUB MODELS EXPLORER */}
          {activeTab === 'hub' && (
            <div className="space-y-4">
              {/* Token Notice Banner if not linked */}
              {!user && (
                <div className="p-3 bg-[#ff9d00]/10 border border-[#ff9d00]/25 rounded flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base flex-none">💡</span>
                    <span className="text-[#e2e2e2]">
                      Link your free Hugging Face token to enable unmetered Serverless Inference and private repositories.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('connect')}
                    className="px-2.5 py-1 bg-[#ff9d00] text-black font-semibold rounded text-[11px] hover:bg-[#ffb020] transition-colors flex-none cursor-pointer"
                  >
                    Connect Token
                  </button>
                </div>
              )}

              {/* Top Controls: Search Bar & Quick Add Toggle */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Hugging Face models (e.g., Llama, Qwen, DeepSeek, Mistral)..."
                    className="w-full bg-[#111111] border border-[#242424] rounded px-3 pl-8 py-2 text-xs text-[#f3f3f3] placeholder-[#555555] focus:border-[#ff9d00] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#cccccc]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Add By ID Button */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="px-3 py-2 bg-[#181818] hover:bg-[#202020] text-[#ff9d00] border border-[#ff9d00]/30 rounded text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCustomInput ? 'Hide Custom Input' : 'Add by Repo ID'}</span>
                </button>
              </div>

              {/* Quick Add Custom Model Box */}
              {showCustomInput && (
                <form
                  onSubmit={handleIntegrateCustomRepo}
                  className="p-3.5 bg-[#141414] border border-[#ff9d00]/30 rounded space-y-2.5 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#f3f3f3] flex items-center gap-1.5">
                      <span>Enter Any Hugging Face Model ID</span>
                    </span>
                    <span className="text-[10px] text-[#888888]">e.g. meta-llama/Llama-3.1-8B-Instruct</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customRepoInput}
                      onChange={(e) => setCustomRepoInput(e.target.value)}
                      placeholder="organization/model-name or full URL"
                      className="flex-1 bg-[#090909] border border-[#282828] rounded px-3 py-1.5 text-xs font-mono text-[#f3f3f3] placeholder-[#555555] focus:border-[#ff9d00] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={customRepoLoading || !customRepoInput.trim()}
                      className="px-3 py-1.5 bg-[#ff9d00] hover:bg-[#ffb020] text-black font-semibold rounded text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 font-mono"
                    >
                      {customRepoLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Integrate</span>
                        </>
                      )}
                    </button>
                  </div>

                  {customRepoError && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-none" />
                      <span>{customRepoError}</span>
                    </div>
                  )}
                </form>
              )}

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                    categoryFilter === 'all'
                      ? 'bg-[#ff9d00] text-black font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  All Curated
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('fast')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                    categoryFilter === 'fast'
                      ? 'bg-[#ff9d00] text-black font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  ⚡ Fast & Lightweight
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('code')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                    categoryFilter === 'code'
                      ? 'bg-[#ff9d00] text-black font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  💻 Code & Engineering
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('reasoning')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                    categoryFilter === 'reasoning'
                      ? 'bg-[#ff9d00] text-black font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  🧠 Deep Reasoning / CoT
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('general')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                    categoryFilter === 'general'
                      ? 'bg-[#ff9d00] text-black font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                  }`}
                >
                  🌐 Frontier Open Weights
                </button>
              </div>

              {/* Live Hub Search Status */}
              {isSearchingHub && (
                <div className="py-2 text-center text-[#888888] flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff9d00]" />
                  <span>Searching Hugging Face Hub live...</span>
                </div>
              )}

              {/* Live Hub Results Section if query matches live Hub */}
              {isLiveSearchActive && liveSearchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-[#ff9d00] uppercase tracking-wider flex items-center justify-between">
                    <span>Live Hub Results ({liveSearchResults.length})</span>
                    <span className="text-[10px] text-[#777777] font-normal">huggingface.co</span>
                  </div>
                  <div className="space-y-2">
                    {liveSearchResults.map((lm) => {
                      const integrated = isModelIntegrated(lm.id);
                      return (
                        <div
                          key={lm.id}
                          className="p-3 bg-[#111111] border border-[#202020] hover:border-[#333333] rounded transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[#f3f3f3]">{lm.name}</span>
                              <span className="font-mono text-[10px] text-[#888888]">{lm.id}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#ff9d00]/10 text-[#ff9d00] rounded font-mono">
                                {lm.pipelineTag}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#666666] mt-1">
                              <span>❤️ {lm.likes || 0}</span>
                              <span>📥 {lm.downloads ? `${lm.downloads.toLocaleString()}` : '0'} downloads</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-none">
                            {integrated ? (
                              <span className="px-2.5 py-1 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1 font-medium">
                                <Check className="w-3 h-3" /> Integrated
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const model = convertHfToAppModel({
                                    hfId: lm.id,
                                    name: lm.name,
                                    desc: `Hugging Face model repository ${lm.id}`,
                                    downloads: lm.downloads,
                                    likes: lm.likes,
                                    tags: ['Hugging Face', lm.author || 'Hub'],
                                  });
                                  onIntegrateModel(model, false);
                                }}
                                className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] text-[#cccccc] border border-[#333333] rounded text-xs font-medium cursor-pointer transition-colors"
                              >
                                + Integrate
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const model = convertHfToAppModel({
                                  hfId: lm.id,
                                  name: lm.name,
                                  desc: `Hugging Face model repository ${lm.id}`,
                                  downloads: lm.downloads,
                                  likes: lm.likes,
                                  tags: ['Hugging Face', lm.author || 'Hub'],
                                });
                                onIntegrateModel(model, true);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-[#ff9d00] hover:bg-[#ffb020] text-black font-semibold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Curated Models Grid / List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider flex items-center justify-between">
                  <span>Curated Verified Open Weights ({filteredCuratedModels.length})</span>
                  <span className="text-[10px] text-[#666666] font-normal">Serverless Router Ready</span>
                </div>

                {filteredCuratedModels.length === 0 && (
                  <div className="p-8 text-center border border-[#1c1c1c] bg-[#111111] rounded text-[#888888]">
                    No curated models matched your filters. You can integrate any model using the "Add by Repo ID" button above.
                  </div>
                )}

                <div className="space-y-2.5">
                  {filteredCuratedModels.map((m) => {
                    const integrated = isModelIntegrated(m.hfId);
                    return (
                      <div
                        key={m.hfId}
                        className="p-3.5 bg-[#111111] border border-[#1e1e1e] hover:border-[#333333] rounded transition-all flex flex-col gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-[#f3f3f3]">{m.name}</span>
                              {m.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-[#ff9d00]/15 text-[#ff9d00] border border-[#ff9d00]/30 rounded font-mono">
                                  {m.badge}
                                </span>
                              )}
                              <span className="text-[10px] text-[#777777] font-mono">({m.author})</span>
                            </div>
                            <div className="font-mono text-[10px] text-[#666666] truncate mt-0.5">
                              {m.hfId}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-none">
                            {integrated ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1 font-medium">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                                {onRemoveIntegratedModel && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveIntegratedModel(`hf:${m.hfId}`)}
                                    className="p-1 text-[#666666] hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                    title="Remove from model list"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const appModel = convertHfToAppModel({
                                    hfId: m.hfId,
                                    name: m.name,
                                    desc: m.desc,
                                    context: m.context,
                                    speed: m.speed,
                                    tags: m.tags,
                                  });
                                  onIntegrateModel(appModel, false);
                                }}
                                className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-[#e0e0e0] border border-[#333333] rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3 text-[#ff9d00]" />
                                <span>Integrate</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const appModel = convertHfToAppModel({
                                  hfId: m.hfId,
                                  name: m.name,
                                  desc: m.desc,
                                  context: m.context,
                                  speed: m.speed,
                                  tags: m.tags,
                                });
                                onIntegrateModel(appModel, true);
                                onClose();
                              }}
                              className="px-3 py-1 bg-[#ff9d00] hover:bg-[#ffb020] text-black font-semibold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Chat Now</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#999999] leading-relaxed line-clamp-2">{m.desc}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#181818] text-[10px] text-[#666666]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 bg-[#181818] text-[#a3a3a3] rounded font-mono">
                              {m.context}
                            </span>
                            <span className="px-1.5 py-0.2 bg-[#181818] text-[#a3a3a3] rounded font-mono">
                              {m.speed}
                            </span>
                            {m.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.2 bg-[#181818] text-[#888888] rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <span>❤️ {m.likes}</span>
                            <span>📥 {m.downloads}</span>
                            <a
                              href={`https://huggingface.co/${m.hfId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#888888] hover:text-[#ff9d00] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY REPOSITORIES */}
          {activeTab === 'repos' && user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#a3a3a3] font-medium">
                  Models and datasets authored by <strong className="text-[#f3f3f3]">@{user.username}</strong>
                </span>
                <button
                  type="button"
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                  className="text-[11px] text-[#ff9d00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {loadingRepos && <Loader2 className="w-3 h-3 animate-spin" />}
                  Refresh
                </button>
              </div>

              {loadingRepos && repos.models.length === 0 && (
                <div className="py-8 text-center text-[#737373]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#ff9d00]" />
                  Fetching repositories from Hugging Face Hub...
                </div>
              )}

              {!loadingRepos && repos.models.length === 0 && repos.datasets.length === 0 && (
                <div className="p-6 text-center border border-[#1f1f1f] bg-[#111111] rounded">
                  <Layers className="w-6 h-6 mx-auto mb-2 text-[#666666]" />
                  <div className="text-sm text-[#f3f3f3] font-medium">No published models found</div>
                  <div className="text-[11px] text-[#737373] mt-1">
                    Models you push to Hugging Face under @{user.username} will appear here.
                  </div>
                  <a
                    href="https://huggingface.co/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#ff9d00]/15 text-[#ff9d00] border border-[#ff9d00]/30 rounded hover:bg-[#ff9d00]/25 transition-colors"
                  >
                    <span>Create New Model on HF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* User Models List */}
              {repos.models.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-[#ff9d00]" />
                    <span>My Models ({repos.models.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {repos.models.map((m) => {
                      const integrated = isModelIntegrated(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded bg-[#111111] border border-[#1c1c1c] hover:border-[#333333] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#f3f3f3] truncate">{m.id}</span>
                              {m.private && (
                                <span className="text-[9px] px-1 py-0.2 bg-[#222] text-[#888] rounded">
                                  Private
                                </span>
                              )}
                              {m.pipelineTag && (
                                <span className="text-[9px] px-1 py-0.2 bg-[#ff9d00]/10 text-[#ff9d00] rounded">
                                  {m.pipelineTag}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#666666] mt-0.5 flex items-center gap-3">
                              <span>❤️ {m.likes || 0}</span>
                              <span>📥 {m.downloads || 0}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {integrated ? (
                              <span className="px-2 py-1 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const model = convertHfToAppModel({
                                    hfId: m.id,
                                    name: m.name,
                                    desc: `Authored by @${user.username} on Hugging Face`,
                                    tags: ['Hugging Face', `@${user.username}`, 'Personal'],
                                    likes: m.likes,
                                    downloads: m.downloads,
                                  });
                                  onIntegrateModel(model, false);
                                }}
                                className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] border border-[#333] rounded text-[11px] cursor-pointer transition-colors"
                              >
                                + Integrate
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const model = convertHfToAppModel({
                                  hfId: m.id,
                                  name: m.name,
                                  desc: `Authored by @${user.username} on Hugging Face`,
                                  tags: ['Hugging Face', `@${user.username}`, 'Personal'],
                                  likes: m.likes,
                                  downloads: m.downloads,
                                });
                                onIntegrateModel(model, true);
                                onClose();
                              }}
                              className="px-2 py-1 bg-[#ff9d00] hover:bg-[#ffb020] text-black font-semibold rounded text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>Chat</span>
                            </button>

                            <a
                              href={`https://huggingface.co/${m.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-[#888888] hover:text-[#ff9d00] transition-colors"
                              title="View on Hugging Face"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Datasets List */}
              {repos.datasets.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>My Datasets ({repos.datasets.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {repos.datasets.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded bg-[#111111] border border-[#1c1c1c]"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-xs text-[#f3f3f3] truncate block">{d.id}</span>
                          <span className="text-[10px] text-[#666666]">❤️ {d.likes || 0}</span>
                        </div>
                        <a
                          href={`https://huggingface.co/datasets/${d.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-[#888888] hover:text-[var(--color-accent)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT & TOKEN CONNECTION */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {/* Linked Profile Banner if Connected */}
              {user ? (
                <div className="p-4 bg-[#111111] border border-[#ff9d00]/30 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-10 h-10 rounded-full border border-[#ff9d00]/40 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#ff9d00]/15 border border-[#ff9d00]/40 flex items-center justify-center text-sm font-bold text-[#ff9d00]">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-[#f3f3f3] flex items-center gap-2">
                          <span>@{user.username}</span>
                          {user.isPro && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#ff9d00] text-black font-bold rounded">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#888888]">
                          {user.fullname || 'Hugging Face Community Member'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Unlink</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1c1c1c] text-center">
                    <div className="bg-[#0a0a0a] p-2 rounded border border-[#1a1a1a]">
                      <div className="text-xs font-semibold text-[#f3f3f3]">{repos.models.length}</div>
                      <div className="text-[10px] text-[#666666]">Models</div>
                    </div>
                    <div className="bg-[#0a0a0a] p-2 rounded border border-[#1a1a1a]">
                      <div className="text-xs font-semibold text-[#f3f3f3]">{repos.datasets.length}</div>
                      <div className="text-[10px] text-[#666666]">Datasets</div>
                    </div>
                    <div className="bg-[#0a0a0a] p-2 rounded border border-[#1a1a1a]">
                      <div className="text-xs font-semibold text-[#ff9d00]">Active</div>
                      <div className="text-[10px] text-[#666666]">Inference</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Instant Token Linking Form */}
              <div className="p-4 bg-[#111111] border border-[#222222] rounded space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#ff9d00]" />
                  <span className="font-semibold text-sm text-[#f3f3f3]">
                    {user ? 'Update Access Token' : 'Link Access Token (Instant & Free)'}
                  </span>
                </div>

                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Paste your personal user access token (starts with <code className="text-[#f3f3f3]">hf_</code>) from your Hugging Face settings. Enables high-speed serverless inference and private model access.
                </p>

                <form onSubmit={handleLinkToken} className="space-y-2.5">
                  <div className="relative">
                    <input
                      type="password"
                      id="input-hf-token"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-[#080808] border border-[#262626] rounded px-3 py-2 text-xs font-mono text-[#f3f3f3] placeholder-[#555555] focus:border-[#ff9d00] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#ff9d00] hover:underline flex items-center gap-1"
                    >
                      <span>Get a token at huggingface.co/settings/tokens</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="submit"
                      id="btn-verify-hf-token"
                      disabled={tokenLoading || !tokenInput.trim()}
                      className="px-4 py-1.5 bg-[#ff9d00] hover:bg-[#ffb020] text-black font-semibold rounded text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 font-mono"
                    >
                      {tokenLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Link</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* OAuth Option */}
              <div className="p-4 bg-[#111111] border border-[#222222] rounded space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="font-semibold text-sm text-[#f3f3f3]">
                    OAuth 2.0 Integration
                  </span>
                </div>

                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Authenticate using standard Hugging Face OAuth. If configured, you can click below to log in directly via browser popup.
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-[#777777]">
                    OAuth App Status: {oauthStatus?.oauthConfigured ? 'Configured' : 'Client ID not set'}
                  </div>
                  <button
                    type="button"
                    onClick={handleStartOAuth}
                    disabled={oauthLoading}
                    className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#cccccc] border border-[#333333] rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {oauthLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span>Sign in with HF OAuth</span>
                    )}
                  </button>
                </div>

                {/* Redirect URI reference */}
                <div className="space-y-1 text-[#aaaaaa] pt-1">
                  <div className="flex items-center justify-between bg-[#141414] p-1.5 rounded border border-[#222]">
                    <span className="text-[10px] font-mono truncate mr-2">{callbackUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(callbackUrl, 'Callback URL')}
                      className="text-[10px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer flex-none"
                    >
                      {copiedText === 'Callback URL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-[#777]" />}
                      <span>Copy URL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1c1c1c] bg-[#0c0c0c] flex items-center justify-between text-[11px] text-[#666666]">
          <div className="flex items-center gap-2">
            <span>Powered by Hugging Face Hub & Serverless Router</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#222] text-[#cccccc] rounded border border-[#333] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
