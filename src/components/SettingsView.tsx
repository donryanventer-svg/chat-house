import React, { useState, useEffect } from 'react';
import {
  Server,
  Volume2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Link,
  Unlink,
  ExternalLink,
  Layers,
  Globe,
  Key,
} from 'lucide-react';
import { CustomEndpointConfig, VoiceSettings, ThemeSettings, HuggingFaceUser } from '../types';

interface SettingsViewProps {
  customEndpoint: CustomEndpointConfig;
  onUpdateCustomEndpoint: (cfg: CustomEndpointConfig) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (cfg: VoiceSettings) => void;
  themeSettings: ThemeSettings;
  onUpdateThemeSettings: (cfg: ThemeSettings) => void;
  huggingFaceUser?: HuggingFaceUser | null;
  onOpenHuggingFaceModal: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onResetAllData: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  customEndpoint,
  onUpdateCustomEndpoint,
  voiceSettings,
  onUpdateVoiceSettings,
  themeSettings,
  onUpdateThemeSettings,
  huggingFaceUser,
  onOpenHuggingFaceModal,
  onExportData,
  onImportData,
  onResetAllData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'huggingface' | 'voice' | 'general'>('providers');
  const [urlDraft, setUrlDraft] = useState(customEndpoint.url);
  const [keyDraft, setKeyDraft] = useState(customEndpoint.apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setUrlDraft(customEndpoint.url);
    setKeyDraft(customEndpoint.apiKey);
  }, [customEndpoint]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        // Deduplicate voices with identical name & language tags
        const seen = new Set<string>();
        const unique: SpeechSynthesisVoice[] = [];
        for (const voice of v) {
          const sig = `${voice.name}__${voice.lang}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            unique.push(voice);
          }
        }
        setAvailableVoices(unique);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleTestConnection = async () => {
    if (!urlDraft.trim()) {
      onShowToast('Enter a URL to test');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlDraft.trim(), apiKey: keyDraft.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Endpoint reachable! Found ${data.models?.length || 0} model(s).`,
        });
        onShowToast('Connection test succeeded.');
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Endpoint responded with error.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Check if local server is running.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = () => {
    onUpdateCustomEndpoint({
      url: urlDraft.trim(),
      apiKey: keyDraft.trim(),
      connected: true,
    });
    onShowToast('Custom endpoint bound: chat prompts now route through proxy.');
  };

  const handleDisconnect = () => {
    onUpdateCustomEndpoint({
      ...customEndpoint,
      connected: false,
    });
    onShowToast('Endpoint unbound: falling back to integrated engine.');
  };

  return (
    <div id="settings-view" className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-[#080808]">
      {/* Settings Navigation Sidebar */}
      <div
        className="w-full md:w-52 flex-none border-b md:border-b-0 md:border-r py-3 md:py-6 flex md:flex-col justify-between select-none overflow-x-auto"
        style={{
          borderColor: 'var(--color-divider)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div>
          <div className="hidden md:flex font-serif italic text-base text-[#f3f3f3] px-6 mb-4 items-center gap-2">
            <span>Settings</span>
          </div>
          <div className="flex md:flex-col gap-1 px-3 min-w-max md:min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('providers')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'providers'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-[#f3f3f3]'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />
              <span>Inference APIs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('huggingface')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'huggingface'
                  ? 'bg-[#ff9d00]/15 text-[#ff9d00] font-semibold border border-[#ff9d00]/30'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-[#f3f3f3]'
              }`}
            >
              <span className="text-sm leading-none flex-none">🤗</span>
              <div className="flex-1 flex items-center justify-between gap-2">
                <span>Hugging Face</span>
                {huggingFaceUser && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9d00]" title="Linked" />
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'voice'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-[#f3f3f3]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />
              <span>Voice Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-[#f3f3f3]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)] flex-none" />
              <span>General & Data</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block px-6 text-[10px] text-[#555555] font-mono">
          Forge Engine v2.4.0
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl space-y-6">
        {/* ══ INFERENCE APIS TAB ══ */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-serif text-[#f3f3f3]">Inference Providers & Endpoints</h3>
              <p className="text-xs text-[#888888] mt-1">
                Connect external OpenAI-compatible endpoints such as Ollama, LM Studio, vLLM, or OpenAI.
              </p>
            </div>

            {/* Custom Endpoint Card */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-5 space-y-4">
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 flex items-center justify-center text-[var(--color-accent)]">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#f3f3f3]">
                      Local / Remote OpenAI-Compatible Endpoint
                    </div>
                    <div className="text-[11px] text-[#888888]">
                      Proxy server bypasses browser CORS for Ollama (localhost:11434) and LM Studio
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                    customEndpoint.connected
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40'
                      : 'bg-[#181818] text-[#737373] border border-[#262626]'
                  }`}
                >
                  {customEndpoint.connected ? 'Active & Bound' : 'Disconnected'}
                </span>
              </div>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="block text-[#a3a3a3] font-medium mb-1">Base URL</label>
                  <input
                    type="text"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="http://localhost:11434/v1 or https://api.openai.com/v1"
                    className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-[#f3f3f3] font-mono text-xs focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <div className="text-[10px] text-[#666666] mt-1">
                    Examples: Ollama: <code className="text-[#a3a3a3]">http://localhost:11434/v1</code> · LM Studio: <code className="text-[#a3a3a3]">http://localhost:1234/v1</code>
                  </div>
                </div>

                <div>
                  <label className="block text-[#a3a3a3] font-medium mb-1">
                    API Key (Optional for local models)
                  </label>
                  <input
                    type="password"
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-[#f3f3f3] font-mono text-xs focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-[var(--color-accent)]/15 text-[#e6d0b3] border border-[var(--color-accent)]/30'
                        : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 flex-none text-[var(--color-accent)]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-none text-red-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="h-8 px-3 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 border border-[#2a2a2a]"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  {!customEndpoint.connected ? (
                    <button
                      type="button"
                      onClick={handleConnect}
                      className="blueprint h-8 px-4 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm uppercase font-mono tracking-wider"
                    >
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <i className="corner bl" />
                      <i className="corner br" />
                      <Link className="w-3.5 h-3.5" />
                      <span>Bind & Connect</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="h-8 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cloud Engine Integration Status */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-4 space-y-2">
              <i className="corner tl" />
              <i className="corner tr" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--color-accent)]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold text-xs text-[#f3f3f3]">
                    Google Gemini Cloud Engine
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded border border-[var(--color-accent)]/30">
                  Production Integration Active
                </span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Atlas Large (powered by Gemini 3.1 Pro) and Atlas Fast (powered by Gemini 3.8 Flash) are natively supported server-side via the official <code className="text-[var(--color-accent)]">@google/genai</code> SDK with automatic fallback handling.
              </p>
            </div>
          </div>
        )}

        {/* ══ HUGGING FACE TAB ══ */}
        {activeTab === 'huggingface' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-serif text-[#f3f3f3] flex items-center gap-2">
                <span>Hugging Face Hub Integration</span>
                <span className="text-base">🤗</span>
              </h3>
              <p className="text-xs text-[#888888] mt-1">
                Link your Hugging Face account via OAuth or Personal Access Token to access your hosted models, datasets, and serverless inference.
              </p>
            </div>

            {/* Account Card */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-5 space-y-4">
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {huggingFaceUser?.avatarUrl ? (
                    <img
                      src={huggingFaceUser.avatarUrl}
                      alt={huggingFaceUser.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-[#ff9d00]/40 object-cover bg-[#1c1c1c]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#ff9d00]/15 border border-[#ff9d00]/30 flex items-center justify-center text-xl">
                      🤗
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#f3f3f3]">
                        {huggingFaceUser ? huggingFaceUser.fullname || huggingFaceUser.username : 'Hugging Face Account'}
                      </span>
                      {huggingFaceUser?.isPro && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#ff9d00] text-black font-bold uppercase font-mono">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#888888]">
                      {huggingFaceUser
                        ? `@${huggingFaceUser.username} · Linked via ${huggingFaceUser.connectionType === 'oauth' ? 'OAuth' : 'User Access Token'}`
                        : 'No Hugging Face account currently connected.'}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                    huggingFaceUser
                      ? 'bg-[#ff9d00]/20 text-[#ff9d00] border border-[#ff9d00]/40'
                      : 'bg-[#181818] text-[#737373] border border-[#262626]'
                  }`}
                >
                  {huggingFaceUser ? 'Linked & Active' : 'Not Linked'}
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  id="btn-settings-open-hf-modal"
                  onClick={onOpenHuggingFaceModal}
                  className="blueprint h-8 px-4 bg-[#ff9d00] hover:bg-[#ffb033] text-black font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <i className="corner bl" />
                  <i className="corner br" />
                  <span>🤗</span>
                  <span>{huggingFaceUser ? 'Manage Hub Account' : 'Link Hugging Face Account'}</span>
                </button>

                {huggingFaceUser && (
                  <a
                    href={`https://huggingface.co/${huggingFaceUser.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] border border-[#2a2a2a] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Hugging Face Features Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-[#0d0d0d] border border-[#1c1c1c] rounded space-y-1.5">
                <div className="flex items-center gap-2 text-[#ff9d00] font-medium">
                  <Layers className="w-4 h-4" />
                  <span>Hub Models & Weights</span>
                </div>
                <p className="text-[#777777] leading-relaxed text-[11px]">
                  Browse models published on your account, copy model IDs, and test inference directly through the playground.
                </p>
              </div>

              <div className="p-4 bg-[#0d0d0d] border border-[#1c1c1c] rounded space-y-1.5">
                <div className="flex items-center gap-2 text-[var(--color-accent)] font-medium">
                  <Key className="w-4 h-4" />
                  <span>OAuth & Access Tokens</span>
                </div>
                <p className="text-[#777777] leading-relaxed text-[11px]">
                  Secure popup OAuth support conforming with AI Studio iframe constraints, or instant linking using <code className="text-[#aaa]">hf_...</code> tokens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ VOICE MODE TAB ══ */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-serif text-[#f3f3f3]">Voice Mode & Audio Synthesis</h3>
              <p className="text-xs text-[#888888] mt-1">
                Configure SpeechSynthesis text-to-speech voices and real-time speech dictation parameters.
              </p>
            </div>

            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-5 space-y-4 text-xs">
              <i className="corner tl" />
              <i className="corner tr" />

              <div>
                <label className="block text-[#a3a3a3] font-medium mb-1.5">
                  Synthesized Speech Voice
                </label>
                <select
                  value={voiceSettings.voiceName}
                  onChange={(e) =>
                    onUpdateVoiceSettings({ ...voiceSettings, voiceName: e.target.value })
                  }
                  className="w-full bg-[#111111] border border-[#262626] rounded px-3 py-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="">Default System Voice</option>
                  {availableVoices.map((v, idx) => (
                    <option key={`voice-${v.voiceURI || v.name}-${v.lang}-${idx}`} value={v.name}>
                      {v.name} {v.lang ? `(${v.lang})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#a3a3a3] font-medium">Speech Rate</label>
                  <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                    {voiceSettings.speechRate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={voiceSettings.speechRate}
                  onChange={(e) =>
                    onUpdateVoiceSettings({
                      ...voiceSettings,
                      speechRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
                />
              </div>

              {/* Speech Pitch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#a3a3a3] font-medium">Speech Pitch</label>
                  <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded text-[11px] border border-[var(--color-accent)]/25">
                    {voiceSettings.speechPitch.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={voiceSettings.speechPitch}
                  onChange={(e) =>
                    onUpdateVoiceSettings({
                      ...voiceSettings,
                      speechPitch: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-[#1a1a1a] rounded-lg appearance-none"
                />
              </div>

              {/* Auto Read Assistant */}
              <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#f3f3f3]">Auto-Read Responses</div>
                  <div className="text-[11px] text-[#888888]">
                    Automatically speak completed assistant answers in voice mode
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVoiceSettings({
                      ...voiceSettings,
                      autoReadAloud: !voiceSettings.autoReadAloud,
                    })
                  }
                  className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                    voiceSettings.autoReadAloud ? 'bg-[var(--color-accent)]' : 'bg-[#222222]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      voiceSettings.autoReadAloud ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ GENERAL & DATA TAB ══ */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-serif text-[#f3f3f3]">General & Data Backup</h3>
              <p className="text-xs text-[#888888] mt-1">
                Manage appearance accent, export custom models and memories, or restore defaults.
              </p>
            </div>

            {/* Accent Theme */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-5 space-y-3 text-xs">
              <i className="corner tl" />
              <i className="corner tr" />
              <div className="font-semibold text-[#f3f3f3]">Refined Dark Accents</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'gold', label: 'Vintage Gold', color: 'var(--color-accent)' },
                  { id: 'steel', label: 'Steel Blue', color: '#38bdf8' },
                  { id: 'amber', label: 'Warm Amber', color: '#d97706' },
                  { id: 'emerald', label: 'Sage Emerald', color: '#10b981' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onUpdateThemeSettings({ ...themeSettings, accent: item.id as any });
                      document.documentElement.style.setProperty('--color-accent', item.color);
                      document.documentElement.style.setProperty(
                        '--color-accent-100',
                        `${item.color}1f`
                      );
                      onShowToast(`Accent changed to ${item.label}`);
                    }}
                    className={`p-2.5 rounded border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      themeSettings.accent === item.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15'
                        : 'border-[#222222] hover:border-[#333333] bg-[#111111]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-none"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-[#e0e0e0]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export / Import Backup */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-5 space-y-4 text-xs">
              <i className="corner tl" />
              <i className="corner tr" />
              <div className="font-semibold text-[#f3f3f3]">Workspace Data Backup</div>
              <p className="text-[#888888]">
                Export all custom models, few-shot exemplars, learned memories, skills, and discussion threads to a single JSON archive.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onExportData}
                  className="blueprint h-8 px-3.5 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] rounded flex items-center gap-2 cursor-pointer font-medium transition-colors border border-[#2a2a2a]"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <Download className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Export Backup (JSON)</span>
                </button>
                <label className="blueprint h-8 px-3.5 bg-[#181818] hover:bg-[#222222] text-[#e0e0e0] rounded flex items-center gap-2 cursor-pointer font-medium transition-colors border border-[#2a2a2a]">
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <Upload className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Import Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) onImportData(content);
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Factory Reset */}
            <div className="p-4 border border-red-500/20 bg-red-500/5 rounded text-xs space-y-2">
              <div className="font-semibold text-red-400">Danger Zone: Reset Workspace</div>
              <p className="text-[#888888]">
                Clear all custom models, threads, memories, and restored defaults.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset Forge to initial factory defaults?')) {
                    onResetAllData();
                    onShowToast('Workspace reset to factory state.');
                  }
                }}
                className="h-7 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded font-medium transition-colors cursor-pointer"
              >
                Reset All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
