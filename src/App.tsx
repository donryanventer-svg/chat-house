import React, { useState, useEffect } from 'react';
import {
  BASE_MODELS,
  INITIAL_CUSTOM_MODELS,
  INITIAL_THREADS,
  INITIAL_THREAD_MESSAGES,
  INITIAL_MEMORIES,
  INITIAL_TRAINING_RUNS,
  INITIAL_SKILLS,
  INITIAL_MCP_SERVERS,
  DEFAULT_STEERING_PARAMS,
} from './data/defaultData';
import {
  Model,
  Thread,
  Message,
  SteeringParams,
  LearnedMemory,
  TrainingRun,
  SkillProtocol,
  McpServer,
  CustomEndpointConfig,
  VoiceSettings,
  ThemeSettings,
  Attachment,
  HuggingFaceUser,
} from './types';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ParametersDrawer } from './components/ParametersDrawer';
import { ModelLabView } from './components/ModelLabView';
import { SettingsView } from './components/SettingsView';
import { VoiceModal } from './components/VoiceModal';
import { CompareModal } from './components/CompareModal';
import { FineTuneModal } from './components/FineTuneModal';
import { HuggingFaceModal } from './components/HuggingFaceModal';
import { InstallModal } from './components/InstallModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ImageGeneratorView } from './components/image/ImageGeneratorView';
import { AppView } from './types';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<AppView>('chat');

  // Threads & Messages
  const [threads, setThreads] = useState<Thread[]>(() => {
    const saved = localStorage.getItem('forge_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    return threads[0]?.id || 't1';
  });

  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('forge_messages');
    return saved ? JSON.parse(saved) : INITIAL_THREAD_MESSAGES;
  });

  // Models
  const [customModels, setCustomModels] = useState<Model[]>(() => {
    const saved = localStorage.getItem('forge_custom_models');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_MODELS;
  });

  const allModels: Model[] = [...BASE_MODELS, ...customModels];

  const [currentModelId, setCurrentModelId] = useState<string>('cm-sec-auditor');
  const currentModel = allModels.find((m) => m.id === currentModelId) || allModels[0];

  // Parameters
  const [params, setParams] = useState<SteeringParams>(() => {
    const saved = localStorage.getItem('forge_params');
    return saved ? JSON.parse(saved) : DEFAULT_STEERING_PARAMS;
  });
  const [paramsDrawerOpen, setParamsDrawerOpen] = useState(false);

  // Memories & Training
  const [memories, setMemories] = useState<LearnedMemory[]>(() => {
    const saved = localStorage.getItem('forge_memories');
    return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
  });

  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>(() => {
    const saved = localStorage.getItem('forge_training_runs');
    return saved ? JSON.parse(saved) : INITIAL_TRAINING_RUNS;
  });

  // Skills & MCP
  const [skills, setSkills] = useState<SkillProtocol[]>(() => {
    const saved = localStorage.getItem('forge_skills');
    return saved ? JSON.parse(saved) : INITIAL_SKILLS;
  });

  const [mcpServers, setMcpServers] = useState<McpServer[]>(() => {
    const saved = localStorage.getItem('forge_mcp_servers');
    return saved ? JSON.parse(saved) : INITIAL_MCP_SERVERS;
  });

  // Settings
  const [customEndpoint, setCustomEndpoint] = useState<CustomEndpointConfig>(() => {
    const saved = localStorage.getItem('forge_custom_endpoint');
    return saved
      ? JSON.parse(saved)
      : { url: 'http://localhost:11434/v1', apiKey: '', connected: false };
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('forge_voice_settings');
    return saved
      ? JSON.parse(saved)
      : { voiceName: '', speechRate: 1.05, speechPitch: 1.0, autoReadAloud: false };
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('forge_theme_settings');
    return saved ? JSON.parse(saved) : { accent: 'steel', ground: 'steel' };
  });

  // Modals & Transients
  const [isStreaming, setIsStreaming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [fineTuneModalOpen, setFineTuneModalOpen] = useState(false);
  const [hfModalOpen, setHfModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Hugging Face Linked Account
  const [huggingFaceUser, setHuggingFaceUser] = useState<HuggingFaceUser | null>(() => {
    const saved = localStorage.getItem('forge_hf_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Sync Hugging Face status on startup
  useEffect(() => {
    fetch('/api/auth/huggingface/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setHuggingFaceUser(data.user);
          localStorage.setItem('forge_hf_user', JSON.stringify(data.user));
        } else if (!data.authenticated) {
          // If server session expired or cleared
          localStorage.removeItem('forge_hf_user');
          setHuggingFaceUser(null);
        }
      })
      .catch(() => {});
  }, []);

  // Listen for OAuth postMessage callback from popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'HUGGINGFACE_AUTH_SUCCESS') {
        const user = event.data.user;
        setHuggingFaceUser(user);
        localStorage.setItem('forge_hf_user', JSON.stringify(user));
        setToast(`Hugging Face linked as @${user.username}`);
      } else if (event.data?.type === 'HUGGINGFACE_AUTH_ERROR') {
        setToast(`Hugging Face Auth Failed: ${event.data.error || 'Unknown error'}`);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('forge_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('forge_messages', JSON.stringify(threadMessages));
  }, [threadMessages]);

  useEffect(() => {
    localStorage.setItem('forge_custom_models', JSON.stringify(customModels));
  }, [customModels]);

  useEffect(() => {
    localStorage.setItem('forge_params', JSON.stringify(params));
  }, [params]);

  useEffect(() => {
    localStorage.setItem('forge_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('forge_training_runs', JSON.stringify(trainingRuns));
  }, [trainingRuns]);

  useEffect(() => {
    localStorage.setItem('forge_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('forge_mcp_servers', JSON.stringify(mcpServers));
  }, [mcpServers]);

  useEffect(() => {
    localStorage.setItem('forge_custom_endpoint', JSON.stringify(customEndpoint));
  }, [customEndpoint]);

  useEffect(() => {
    localStorage.setItem('forge_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  useEffect(() => {
    localStorage.setItem('forge_theme_settings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Thread actions
  const handleNewThread = () => {
    const id = `t-${Date.now()}`;
    const newThread: Thread = {
      id,
      title: 'New Discussion',
      group: 'Today',
      updated: 'Just now',
      createdAt: Date.now(),
    };
    setThreads([newThread, ...threads]);
    setThreadMessages((prev) => ({ ...prev, [id]: [] }));
    setActiveThreadId(id);
    showToast('New thread initialized');
  };

  const handleDeleteThread = (id: string) => {
    const remaining = threads.filter((t) => t.id !== id);
    setThreads(remaining);
    setThreadMessages((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeThreadId === id) {
      setActiveThreadId(remaining[0]?.id || null);
    }
    showToast('Thread deleted');
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const activeMessages = (activeThreadId && threadMessages[activeThreadId]) || [];

  // Sending chat message
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    systemPromptOverride?: string
  ): Promise<string> => {
    if (!activeThreadId) {
      handleNewThread();
      return '';
    }

    const targetThreadId = activeThreadId;
    const userMsgId = `m-${Date.now()}`;
    const assistantMsgId = `m-${Date.now() + 1}`;

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text,
      files: attachments,
      timestamp: Date.now(),
    };

    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: 'Analyzing under active constraints...',
      streaming: true,
      timestamp: Date.now() + 1,
    };

    // Append to thread
    setThreadMessages((prev) => ({
      ...prev,
      [targetThreadId]: [...(prev[targetThreadId] || []), userMessage, initialAssistantMessage],
    }));

    setIsStreaming(true);

    try {
      const activePrompt = systemPromptOverride || currentModel.systemPrompt || params.systemPrompt;
      const activeNegatives = currentModel.negativePrompt || params.negativePrompt;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...activeMessages, userMessage],
          modelId: currentModel.id,
          params: systemPromptOverride ? { ...params, systemPrompt: systemPromptOverride } : params,
          systemPrompt: activePrompt,
          negativePrompt: activeNegatives,
          exemplars: currentModel.exemplars || [],
          memories: params.enforceLearnedRules ? memories : [],
          skills: skills.filter((s) => s.enabled),
          trainingRuns: trainingRuns.filter((tr) => tr.applied),
          customEndpoint,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text && data.text.trim()
        ? data.text
        : 'The model finished without producing text. Please check prompt constraints or try again.';
      const sourceLabel = data.source === 'gemini' ? `Gemini AI (${data.model || 'Flash'})` : (data.source || 'Local Engine');

      setThreadMessages((prev) => ({
        ...prev,
        [targetThreadId]: (prev[targetThreadId] || []).map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: replyText,
                streaming: false,
                hasThinking: true,
                thinkingOpen: false,
                thinkingText: `Engine: ${sourceLabel} | Active Constraints: Negative rules enforced | Sampling Temperature: ${params.temperature}`,
              }
            : m
        ),
      }));

      // Update thread timestamp
      setThreads((prev) =>
        prev.map((t) =>
          t.id === targetThreadId ? { ...t, updated: 'Just now' } : t
        )
      );

      return replyText;
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallback = `Inference Note: ${err.message || 'Connection interrupted'}. Please retry your message.`;

      setThreadMessages((prev) => ({
        ...prev,
        [targetThreadId]: (prev[targetThreadId] || []).map((m) =>
          m.id === assistantMsgId
            ? { ...m, text: fallback, streaming: false }
            : m
        ),
      }));
      return fallback;
    } finally {
      setIsStreaming(false);
    }
  };

  // Teach correction on the fly
  const handleTeachCorrection = (msgId: string, correctedText: string) => {
    // 1. Add as rule to memories
    const newMemory: LearnedMemory = {
      id: `me-${Date.now()}`,
      text: `User Rule from Feedback: ${correctedText.slice(0, 140)}`,
      source: 'Direct User Feedback',
      scope: currentModel.name,
      pinned: true,
      createdAt: Date.now(),
    };
    setMemories([newMemory, ...memories]);

    // 2. Add as exemplar to current custom model
    if (currentModel.isCustom) {
      setCustomModels((prev) =>
        prev.map((cm) =>
          cm.id === currentModel.id
            ? {
                ...cm,
                exemplars: [
                  ...(cm.exemplars || []),
                  { id: `ex-${Date.now()}`, input: 'Contextual Query', output: correctedText },
                ],
              }
            : cm
        )
      );
    }

    showToast('Correction logged as active memory rule and few-shot exemplar.');
  };

  // Custom Model management
  const handleSaveCustomModel = (model: Model, publishToChat: boolean) => {
    setCustomModels((prev) => {
      const exists = prev.some((m) => m.id === model.id);
      if (exists) {
        return prev.map((m) => (m.id === model.id ? model : m));
      }
      return [model, ...prev];
    });

    if (publishToChat) {
      setCurrentModelId(model.id);
      setCurrentView('chat');
    }
    showToast(`Model ${model.name} saved successfully.`);
  };

  const handleDeleteCustomModel = (id: string) => {
    setCustomModels((prev) => prev.filter((m) => m.id !== id));
    if (currentModelId === id) {
      setCurrentModelId(BASE_MODELS[0].id);
    }
    showToast('Custom model deleted.');
  };

  // Export / Import
  const handleExportData = () => {
    const data = {
      threads,
      threadMessages,
      customModels,
      memories,
      trainingRuns,
      skills,
      mcpServers,
      params,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forge-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workspace backup downloaded.');
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.threads) setThreads(parsed.threads);
      if (parsed.threadMessages) setThreadMessages(parsed.threadMessages);
      if (parsed.customModels) setCustomModels(parsed.customModels);
      if (parsed.memories) setMemories(parsed.memories);
      if (parsed.skills) setSkills(parsed.skills);
      if (parsed.mcpServers) setMcpServers(parsed.mcpServers);
      if (parsed.params) setParams(parsed.params);
      showToast('Workspace backup restored.');
    } catch (err) {
      showToast('Invalid backup file format.');
    }
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setThreads(INITIAL_THREADS);
    setThreadMessages(INITIAL_THREAD_MESSAGES);
    setCustomModels(INITIAL_CUSTOM_MODELS);
    setMemories(INITIAL_MEMORIES);
    setTrainingRuns(INITIAL_TRAINING_RUNS);
    setSkills(INITIAL_SKILLS);
    setMcpServers(INITIAL_MCP_SERVERS);
    setParams(DEFAULT_STEERING_PARAMS);
    setActiveThreadId('t1');
    setCurrentView('chat');
  };

  const handleIntegrateHfModel = (model: Model, selectImmediately: boolean = true) => {
    setCustomModels((prev) => {
      const exists = prev.some(
        (m) => m.id === model.id || (m.hfModelId && m.hfModelId === model.hfModelId)
      );
      const updated = exists
        ? prev.map((m) =>
            m.id === model.id || m.hfModelId === model.hfModelId ? { ...m, ...model } : m
          )
        : [model, ...prev];
      localStorage.setItem('forge_custom_models', JSON.stringify(updated));
      return updated;
    });

    if (selectImmediately) {
      setCurrentModelId(model.id);
      showToast(`Model ${model.name} activated`);
    } else {
      showToast(`Added ${model.name} to model list`);
    }
  };

  const handleRemoveHfModel = (modelId: string) => {
    setCustomModels((prev) => {
      const updated = prev.filter((m) => m.id !== modelId);
      localStorage.setItem('forge_custom_models', JSON.stringify(updated));
      return updated;
    });
    if (currentModelId === modelId) {
      setCurrentModelId(BASE_MODELS[0].id);
    }
    showToast('Model removed from model list');
  };

  return (
    <div
      id="forge-app-root"
      className="fixed inset-0 flex flex-col overflow-hidden select-text text-[#f3f3f3] font-sans"
      style={{
        backgroundColor: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Windows / System Title Bar */}
      <TitleBar
        activeTitle={activeThread?.title || 'Workspace'}
        hasCustomEndpoint={customEndpoint.connected}
        huggingFaceUser={huggingFaceUser}
        onOpenHuggingFaceModal={() => setHfModalOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        onShowToast={showToast}
      />

      {/* Main Window Frame */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          currentView={currentView}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenInstallModal={() => setInstallModalOpen(true)}
          huggingFaceUser={huggingFaceUser}
          onOpenHuggingFaceModal={() => setHfModalOpen(true)}
          onSelectThread={(id) => setActiveThreadId(id)}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          onGoToView={(v) => setCurrentView(v)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Chat View */}
          {currentView === 'chat' && (
            <ChatView
              threadTitle={activeThread?.title || 'New Discussion'}
              onRenameTitle={(title) => {
                if (activeThreadId) handleRenameThread(activeThreadId, title);
              }}
              messages={activeMessages}
              currentModel={currentModel}
              allModels={allModels}
              params={params}
              paramsDrawerOpen={paramsDrawerOpen}
              onToggleParamsDrawer={() => setParamsDrawerOpen(!paramsDrawerOpen)}
              onSelectModel={(m) => {
                setCurrentModelId(m.id);
                showToast(`Switched to engine: ${m.name}`);
              }}
              onOpenModelLabNew={() => {
                setCurrentView('modelLab');
              }}
              onOpenCompare={() => setCompareModalOpen(true)}
              onOpenVoice={() => setVoiceModalOpen(true)}
              onSendMessage={handleSendMessage}
              onTeachCorrection={handleTeachCorrection}
              onShowToast={showToast}
              isStreaming={isStreaming}
              voiceSettings={voiceSettings}
              onOpenHuggingFaceModal={() => setHfModalOpen(true)}
            />
          )}

          {/* Model Lab & Training View */}
          {currentView === 'modelLab' && (
            <ModelLabView
              customModels={customModels}
              baseModels={allModels.filter((m) => !m.isCustom)}
              memories={memories}
              trainingRuns={trainingRuns}
              skills={skills}
              mcpServers={mcpServers}
              onSaveCustomModel={handleSaveCustomModel}
              onDeleteCustomModel={handleDeleteCustomModel}
              onAddMemory={(text) => {
                setMemories([
                  {
                    id: `me-${Date.now()}`,
                    text,
                    source: 'Direct Injection',
                    scope: 'Global',
                    pinned: true,
                    createdAt: Date.now(),
                  },
                  ...memories,
                ]);
              }}
              onTogglePinMemory={(id) => {
                setMemories((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
                );
              }}
              onForgetMemory={(id) => {
                setMemories((prev) => prev.filter((m) => m.id !== id));
                showToast('Rule removed from memory buffer.');
              }}
              onToggleTrainingRun={(id) => {
                setTrainingRuns((prev) =>
                  prev.map((tr) => (tr.id === id ? { ...tr, applied: !tr.applied } : tr))
                );
                showToast('Checkpoint attachment toggled.');
              }}
              onStartFineTune={() => setFineTuneModalOpen(true)}
              onToggleSkill={(id) => {
                setSkills((prev) =>
                  prev.map((sk) => (sk.id === id ? { ...sk, enabled: !sk.enabled } : sk))
                );
              }}
              onAddSkill={(sk) => setSkills((prev) => [sk, ...prev])}
              onToggleMcp={(id) => {
                setMcpServers((prev) =>
                  prev.map((mc) =>
                    mc.id === id
                      ? { ...mc, status: mc.status === 'running' ? 'stopped' : 'running' }
                      : mc
                  )
                );
              }}
              onChatWithModel={(m) => {
                setCurrentModelId(m.id);
                setCurrentView('chat');
              }}
              onShowToast={showToast}
              onOpenHuggingFaceModal={() => setHfModalOpen(true)}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsView
              customEndpoint={customEndpoint}
              onUpdateCustomEndpoint={setCustomEndpoint}
              voiceSettings={voiceSettings}
              onUpdateVoiceSettings={setVoiceSettings}
              themeSettings={themeSettings}
              onUpdateThemeSettings={setThemeSettings}
              huggingFaceUser={huggingFaceUser}
              onOpenHuggingFaceModal={() => setHfModalOpen(true)}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetAllData={handleResetAllData}
              onShowToast={showToast}
            />
          )}

          {/* Image Studio View */}
          {currentView === 'imageStudio' && (
            <ImageGeneratorView
              onShowToast={showToast}
              huggingFaceToken={huggingFaceUser?.token}
            />
          )}

          {/* Steering & Parameters Drawer */}
          <ParametersDrawer
            open={paramsDrawerOpen}
            activeModelName={currentModel.name}
            params={params}
            onChangeParams={setParams}
            onResetParams={() => setParams(DEFAULT_STEERING_PARAMS)}
            onClose={() => setParamsDrawerOpen(false)}
            onShowToast={showToast}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Android and Small Screens) */}
      <MobileBottomNav
        currentView={currentView}
        paramsDrawerOpen={paramsDrawerOpen}
        onGoToView={(view) => setCurrentView(view)}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        onToggleParamsDrawer={() => setParamsDrawerOpen((prev) => !prev)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
      />

      {/* Modals */}
      <InstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        onShowToast={showToast}
      />

      <HuggingFaceModal
        open={hfModalOpen}
        onClose={() => setHfModalOpen(false)}
        user={huggingFaceUser}
        onUserUpdated={setHuggingFaceUser}
        onShowToast={showToast}
        integratedModels={allModels}
        onIntegrateModel={handleIntegrateHfModel}
        onRemoveIntegratedModel={handleRemoveHfModel}
      />

      <CompareModal
        open={compareModalOpen}
        models={allModels}
        currentModelId={currentModel.id}
        onSelectModel={(m) => setCurrentModelId(m.id)}
        onClose={() => setCompareModalOpen(false)}
      />

      <VoiceModal
        open={voiceModalOpen}
        currentModel={currentModel}
        params={params}
        voiceSettings={voiceSettings}
        onUpdateParams={(updated) => setParams((prev) => ({ ...prev, ...updated }))}
        onUpdateVoiceSettings={(updated) => setVoiceSettings((prev) => ({ ...prev, ...updated }))}
        onClose={() => setVoiceModalOpen(false)}
        onSendMessage={(txt, override) => handleSendMessage(txt, [], override)}
      />

      <FineTuneModal
        open={fineTuneModalOpen}
        onClose={() => setFineTuneModalOpen(false)}
        onFinishTraining={(run) => {
          setTrainingRuns([run, ...trainingRuns]);
          showToast(`Applied ${run.name} to active inference pipeline.`);
        }}
        onShowToast={showToast}
      />

      {/* Floating System Toast */}
      {toast && (
        <div
          id="forge-toast"
          className="blueprint fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0c0c0c] border border-[var(--color-accent)]/70 text-[#f3f3f3] text-xs px-4 py-2.5 rounded shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 font-mono tracking-wide"
        >
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
          <span className="font-medium text-[#e8ded3]">{toast}</span>
        </div>
      )}
    </div>
  );
}
