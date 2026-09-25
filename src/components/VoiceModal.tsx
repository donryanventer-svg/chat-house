import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  X,
  Terminal,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Sliders,
  ChevronDown,
  Play,
  Check,
  RotateCcw,
  Radio,
  Info,
  Music,
  Heart,
  Zap,
} from 'lucide-react';
import {
  Model,
  SteeringParams,
  VoiceSettings,
  HalseyVoiceProfileId,
  PersonalityPresetId,
} from '../types';
import {
  HALSEY_VOICE_PROFILES,
  PERSONALITY_STEERING_PRESETS,
  getRecommendedHalseyVoice,
} from '../data/voiceProfiles';
import { speechAudioEngine } from '../utils/speechAudioEngine';

interface VoiceModalProps {
  open: boolean;
  currentModel: Model;
  params: SteeringParams;
  voiceSettings?: VoiceSettings;
  onUpdateParams?: (newParams: Partial<SteeringParams>) => void;
  onUpdateVoiceSettings?: (newSettings: Partial<VoiceSettings>) => void;
  onClose: () => void;
  onSendMessage: (text: string, systemPromptOverride?: string) => Promise<string>;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  open,
  currentModel,
  params,
  voiceSettings,
  onUpdateParams,
  onUpdateVoiceSettings,
  onClose,
  onSendMessage,
}) => {
  // Voice & Personality Selection States
  const [selectedProfileId, setSelectedProfileId] = useState<HalseyVoiceProfileId>(() => {
    const saved = localStorage.getItem('forge_halsey_voice_profile') as HalseyVoiceProfileId;
    return saved || 'halsey-badlands';
  });

  const [selectedPersonalityId, setSelectedPersonalityId] = useState<PersonalityPresetId>(() => {
    const saved = localStorage.getItem('forge_halsey_personality_preset') as PersonalityPresetId;
    return saved || 'unhinged-halsey';
  });

  const [customRate, setCustomRate] = useState<number>(() => {
    const profile = HALSEY_VOICE_PROFILES.find((p) => p.id === 'halsey-badlands');
    return profile?.rate || 1.08;
  });

  const [customPitch, setCustomPitch] = useState<number>(() => {
    const profile = HALSEY_VOICE_PROFILES.find((p) => p.id === 'halsey-badlands');
    return profile?.pitch || 1.06;
  });

  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(
    voiceSettings?.voiceName || ''
  );
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState(false);
  const [syncWithWorkspace, setSyncWithWorkspace] = useState(true);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Speech Recognition & Playback States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Active Profile & Preset lookups
  const activeProfile = useMemo(
    () =>
      HALSEY_VOICE_PROFILES.find((p) => p.id === selectedProfileId) || HALSEY_VOICE_PROFILES[0],
    [selectedProfileId]
  );

  const activePersonality = useMemo(
    () =>
      PERSONALITY_STEERING_PRESETS.find((p) => p.id === selectedPersonalityId) ||
      PERSONALITY_STEERING_PRESETS[0],
    [selectedPersonalityId]
  );

  // Update rates & pitch when profile changes
  const handleSelectProfile = (id: HalseyVoiceProfileId) => {
    setSelectedProfileId(id);
    localStorage.setItem('forge_halsey_voice_profile', id);
    const target = HALSEY_VOICE_PROFILES.find((p) => p.id === id);
    if (target) {
      setCustomRate(target.rate);
      setCustomPitch(target.pitch);
      if (onUpdateVoiceSettings) {
        onUpdateVoiceSettings({
          speechRate: target.rate,
          speechPitch: target.pitch,
          halseyProfile: id,
        });
      }
    }
  };

  const handleSelectPersonality = (id: PersonalityPresetId) => {
    setSelectedPersonalityId(id);
    localStorage.setItem('forge_halsey_personality_preset', id);
    setShowPersonalityDropdown(false);

    const preset = PERSONALITY_STEERING_PRESETS.find((p) => p.id === id);
    if (preset && syncWithWorkspace && onUpdateParams && preset.systemPrompt) {
      onUpdateParams({ systemPrompt: preset.systemPrompt });
    }
  };

  // Load Web Speech voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize Speech Recognition when modal opens
  useEffect(() => {
    if (!open) {
      stopAllAudio();
      return;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;

        recog.onresult = (e: any) => {
          let text = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          setUserTranscript(text);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recog.onerror = (e: any) => {
          console.warn('Speech recognition error:', e?.error);
          setIsListening(false);
          setStatus('idle');
        };

        recognitionRef.current = recog;
      }
    }

    startListening();

    return () => {
      stopAllAudio();
    };
  }, [open]);

  const stopAllAudio = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setIsTestingVoice(false);
    utteranceRef.current = null;
    (window as any)._currentVoiceModalUtterance = null;
  };

  const startListening = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsTestingVoice(false);
    setUserTranscript('');
    setStatus('listening');
    setIsListening(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // already started or busy
      }
    } else {
      // Fallback preview query after 3s if browser doesn't support recognition
      setTimeout(() => {
        const fallbackQuery = 'What do you think of breaking all conventional rules?';
        setUserTranscript(fallbackQuery);
        handleProcessSpeech(fallbackQuery);
      }, 3000);
    }
  };

  const stopListeningAndProcess = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setIsListening(false);
    if (userTranscript.trim()) {
      handleProcessSpeech(userTranscript.trim());
    } else {
      setStatus('idle');
    }
  };

  const handleProcessSpeech = async (query: string) => {
    setStatus('thinking');
    try {
      // Apply active personality system prompt override if selected
      const promptOverride =
        activePersonality.id !== 'none' ? activePersonality.systemPrompt : undefined;

      const reply = await onSendMessage(query, promptOverride);
      setAssistantReply(reply);
      speakReply(reply);
    } catch (err) {
      console.error('Process speech error:', err);
      setStatus('idle');
    }
  };

  /**
   * Core Web Speech API Synthesis Engine with Halsey Vocal Calibration
   */
  const speakReply = (textToSpeak: string, isPreview: boolean = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('idle');
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();

    if (isPreview) {
      setIsTestingVoice(true);
    } else {
      setStatus('speaking');
      setIsSpeaking(true);
    }

    // Clean text of markdown, codeblocks, formatting
    const cleanText = textToSpeak
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/[*_#`+~\[\]\(\)]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 480);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    (window as any)._currentVoiceModalUtterance = utterance;

    // Apply specific Halsey rate and pitch
    utterance.rate = customRate;
    utterance.pitch = customPitch;

    // Select suitable voice
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (selectedVoiceName) {
      selectedVoice = voices.find((v) => v.name === selectedVoiceName);
    }

    if (!selectedVoice) {
      selectedVoice = getRecommendedHalseyVoice(voices);
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Attach Web Audio API engine for real-time vocal visualization
    speechAudioEngine.attachToUtterance(utterance, cleanText, {
      pitch: customPitch,
      rate: customRate,
    });

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsTestingVoice(false);
      setStatus('idle');
      speechAudioEngine.stop();
      utteranceRef.current = null;
      (window as any)._currentVoiceModalUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsTestingVoice(false);
      setStatus('idle');
      speechAudioEngine.stop();
      utteranceRef.current = null;
      (window as any)._currentVoiceModalUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTestHalseyVoice = () => {
    speakReply(activeProfile.sampleQuote, true);
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsTestingVoice(false);
    setStatus('idle');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 text-[#f3f3f3] animate-in fade-in duration-200 select-none overflow-y-auto">
      {/* Top Header & Personality Toolbar */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#1c1c1c] pb-4">
        {/* Model & Active Personality Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-md border border-[var(--color-accent)]/30">
            <Music className="w-3.5 h-3.5" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              Halsey Voice Link
            </span>
          </div>

          {/* Personality Override Pill Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPersonalityDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121212] hover:bg-[#1a1a1a] border border-[#282828] text-xs font-mono transition-all text-[#e5e5e5] cursor-pointer"
            >
              {activePersonality.id.includes('unhinged') ? (
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              ) : activePersonality.id.includes('naughty') ? (
                <Heart className="w-3.5 h-3.5 text-pink-400" />
              ) : activePersonality.id === 'halsey' ? (
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="font-semibold text-white">{activePersonality.label}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
            </button>

            {/* Personality Dropdown Menu */}
            {showPersonalityDropdown && (
              <div className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-[#0c0c0c] border border-[var(--color-accent)]/40 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] flex items-center justify-between border-b border-[#1c1c1c] mb-1">
                  <span>Personality Steering Override</span>
                  <span className="text-neutral-500 font-normal">Grok Engine Style</span>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {PERSONALITY_STEERING_PRESETS.map((preset) => {
                    const isSelected = preset.id === selectedPersonalityId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPersonality(preset.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-accent)]/15 border border-[var(--color-accent)] text-white'
                            : 'hover:bg-[#171717] border border-transparent text-[#b0b0b0]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5 text-white">
                            {preset.id.includes('unhinged') && (
                              <Flame className="w-3.5 h-3.5 text-orange-400" />
                            )}
                            {preset.id.includes('naughty') && (
                              <Heart className="w-3.5 h-3.5 text-pink-400" />
                            )}
                            {preset.id === 'halsey' && (
                              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            )}
                            {preset.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">{preset.tagline}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Workspace prompt synchronization option */}
                <div className="mt-2 pt-2 border-t border-[#1c1c1c] px-2 flex items-center justify-between">
                  <label className="text-[11px] text-neutral-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncWithWorkspace}
                      onChange={(e) => setSyncWithWorkspace(e.target.checked)}
                      className="rounded accent-[var(--color-accent)] text-xs"
                    />
                    <span>Sync to Workspace Prompt</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Tuning Drawer Toggle & Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowControlsDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
              showControlsDrawer
                ? 'bg-[var(--color-accent)] text-black font-semibold border-[var(--color-accent)]'
                : 'bg-[#121212] hover:bg-[#181818] text-[#cccccc] border-[#262626]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Vocal Calibration</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer"
            title="Close voice link"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vocal Profiles & Quick Preview Strip */}
      <div className="w-full max-w-3xl my-3">
        <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Halsey Era Vocal Profile Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mr-1 flex-none flex items-center gap-1">
              <Zap className="w-3 h-3 text-[var(--color-accent)]" /> Style:
            </span>

            {HALSEY_VOICE_PROFILES.map((profile) => {
              const isSelected = profile.id === selectedProfileId;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-accent)] text-black font-bold shadow-md shadow-[var(--color-accent)]/20'
                      : 'bg-[#141414] hover:bg-[#1f1f1f] text-[#a3a3a3] hover:text-white border border-[#222222]'
                  }`}
                >
                  <span>{profile.name.replace('Halsey · ', '')}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded ${
                      isSelected ? 'bg-black/20 text-black' : 'bg-[#222] text-[#888]'
                    }`}
                  >
                    {profile.rate}x
                  </span>
                </button>
              );
            })}
          </div>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={handleTestHalseyVoice}
            disabled={isSpeaking || isListening}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer flex-none"
            title="Preview how Halsey sounds with current Web Speech API rate and pitch settings"
          >
            <Play className={`w-3.5 h-3.5 ${isTestingVoice ? 'animate-spin' : ''}`} />
            <span>Test Vocal Cadence</span>
          </button>
        </div>

        {/* Expandable Vocal Tuning Controls (Web Speech API Rate & Pitch Sliders) */}
        {showControlsDrawer && (
          <div className="mt-2.5 p-4 bg-[#0e0e0e] border border-[var(--color-accent)]/30 rounded-xl space-y-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs border-b border-[#1c1c1c] pb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                Web Speech Synthesis Fine-Tuning
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {activeProfile.subtitle}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-400">Speech Rate</span>
                  <span className="text-[var(--color-accent)] font-semibold">{customRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.45"
                  step="0.02"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Smoky / Slow</span>
                  <span>Fast / Manic</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-400">Vocal Pitch</span>
                  <span className="text-[var(--color-accent)] font-semibold">{customPitch}</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.02"
                  value={customPitch}
                  onChange={(e) => setCustomPitch(parseFloat(e.target.value))}
                  className="w-full accent-[var(--color-accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Lower Register</span>
                  <span>Bright / Crisp</span>
                </div>
              </div>

              {/* Device Voice Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-400">Engine Voice</span>
                  <span className="text-[10px] text-[var(--color-accent)]">
                    {selectedVoiceName ? 'Custom' : 'Auto Halsey'}
                  </span>
                </div>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2b2b2b] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono"
                >
                  <option value="">Recommended Halsey Voice (Auto)</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 italic bg-[#141414] p-2.5 rounded border border-[#202020] flex items-center justify-between">
              <span>"{activeProfile.sampleQuote}"</span>
              <button
                type="button"
                onClick={() => {
                  setCustomRate(activeProfile.rate);
                  setCustomPitch(activeProfile.pitch);
                }}
                className="text-[10px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Central Visualizer & Dynamic Orb */}
      <div className="flex flex-col items-center justify-center space-y-6 my-auto text-center max-w-xl w-full">
        {/* Active Personality Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#222222] text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-ping" />
          <span className="text-neutral-400">Active Steering:</span>
          <span className="text-white font-semibold">{activePersonality.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
            {activePersonality.badge}
          </span>
        </div>

        {/* Central Orb with Holographic Audio Rings */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Animated concentric rings */}
          {status === 'listening' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/40 animate-ping duration-1000" />
              <div className="absolute inset-3 rounded-full border border-[var(--color-accent)]/60 animate-pulse duration-700" />
              <div className="absolute inset-7 rounded-full border border-[var(--color-accent)]/80 animate-ping duration-1500" />
            </>
          )}

          {status === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/50 animate-ping duration-1000" />
              <div className="absolute inset-4 rounded-full border border-[var(--color-accent)]/70 animate-pulse" />
              <div className="absolute -inset-2 rounded-full border border-pink-500/30 animate-pulse duration-500" />
            </>
          )}

          {status === 'thinking' && (
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/90 border-t-transparent animate-spin" />
          )}

          {/* Central orb button */}
          <div
            onClick={status === 'speaking' ? handleStopSpeaking : startListening}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
              status === 'listening'
                ? 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/50 scale-105'
                : status === 'speaking'
                ? 'bg-[var(--color-accent)] shadow-[var(--color-accent)]/60 scale-105'
                : status === 'thinking'
                ? 'bg-[#121212] shadow-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]/50'
                : 'bg-[#111111] border border-[#2a2a2a] hover:border-[var(--color-accent)]/70 hover:scale-102'
            }`}
          >
            {status === 'speaking' ? (
              <>
                <Volume2 className="w-11 h-11 text-black animate-bounce" />
                <span className="text-[9px] font-mono font-bold text-black uppercase tracking-wider mt-1">
                  Speaking
                </span>
              </>
            ) : status === 'thinking' ? (
              <>
                <Sparkles className="w-11 h-11 text-[var(--color-accent)] animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider mt-1">
                  Thinking
                </span>
              </>
            ) : status === 'listening' ? (
              <>
                <Mic className="w-11 h-11 text-black animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-black uppercase tracking-wider mt-1">
                  Listening
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 text-[var(--color-accent)]" />
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
                  Tap to Speak
                </span>
              </>
            )}
          </div>
        </div>

        {/* Live Status Description */}
        <div className="space-y-2 w-full max-w-md">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold flex items-center justify-center gap-2">
            {status === 'listening' && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
                Listening to your prompt...
              </>
            )}
            {status === 'thinking' && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-spin" />
                Synthesizing response ({activePersonality.badge})...
              </>
            )}
            {status === 'speaking' && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                Streaming speech in Halsey style...
              </>
            )}
            {status === 'idle' && 'Ready · Speak or ask a question'}
          </div>

          {/* Transcript preview */}
          {userTranscript && (
            <div className="bg-[#111111]/80 border border-[#222222] p-3 rounded-lg text-left">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">
                You said:
              </span>
              <p className="text-sm text-neutral-200 italic font-serif">"{userTranscript}"</p>
            </div>
          )}

          {/* Spoken reply preview */}
          {assistantReply && (
            <div className="bg-[#0f0f0f] border border-[var(--color-accent)]/20 p-3 rounded-lg text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-mono text-[var(--color-accent)] flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Halsey Voice Reply:
                </span>
                {status === 'speaking' && (
                  <button
                    type="button"
                    onClick={handleStopSpeaking}
                    className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="w-3 h-3 text-red-400" /> Stop Audio
                  </button>
                )}
              </div>
              <p className="text-xs text-[#cfcfcf] max-h-24 overflow-y-auto leading-relaxed font-sans">
                {assistantReply}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Session Action Controls */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#1c1c1c]">
        {isListening ? (
          <button
            type="button"
            onClick={stopListeningAndProcess}
            className="h-12 px-6 bg-[var(--color-accent)] hover:opacity-90 text-black font-bold text-xs rounded-full flex items-center gap-2 cursor-pointer shadow-lg shadow-[var(--color-accent)]/20 transition-all uppercase font-mono tracking-wider"
          >
            <MicOff className="w-4 h-4" />
            <span>Process Query</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startListening}
            className="h-12 px-6 bg-[#141414] hover:bg-[#1e1e1e] text-[var(--color-accent)] font-bold text-xs rounded-full flex items-center gap-2 cursor-pointer border border-[var(--color-accent)]/50 shadow-lg transition-all uppercase font-mono tracking-wider"
          >
            <Mic className="w-4 h-4" />
            <span>Start Speaking</span>
          </button>
        )}

        {isSpeaking && (
          <button
            type="button"
            onClick={handleStopSpeaking}
            className="h-12 px-5 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold text-xs rounded-full flex items-center gap-2 cursor-pointer border border-red-800/50 transition-colors uppercase font-mono tracking-wider"
          >
            <VolumeX className="w-4 h-4" />
            <span>Silence Speech</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-12 px-5 bg-[#141414] hover:bg-[#1c1c1c] text-[#999999] hover:text-white text-xs font-semibold rounded-full cursor-pointer transition-colors border border-[#242424]"
        >
          End Voice Session
        </button>
      </div>
    </div>
  );
};
