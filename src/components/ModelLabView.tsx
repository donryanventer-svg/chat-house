import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Pin,
  PinOff,
  Sparkles,
  Bot,
  Layers,
  BrainCircuit,
  Wrench,
  UploadCloud,
  CheckCircle2,
  Terminal,
  Send,
  Sliders,
  Check,
} from 'lucide-react';
import { Model, LearnedMemory, TrainingRun, SkillProtocol, McpServer, Exemplar } from '../types';

interface ModelLabViewProps {
  customModels: Model[];
  baseModels: Model[];
  memories: LearnedMemory[];
  trainingRuns: TrainingRun[];
  skills: SkillProtocol[];
  mcpServers: McpServer[];
  onSaveCustomModel: (model: Model, publishToChat: boolean) => void;
  onDeleteCustomModel: (id: string) => void;
  onAddMemory: (text: string) => void;
  onTogglePinMemory: (id: string) => void;
  onForgetMemory: (id: string) => void;
  onToggleTrainingRun: (id: string) => void;
  onStartFineTune: () => void;
  onToggleSkill: (id: string) => void;
  onAddSkill: (skill: SkillProtocol) => void;
  onToggleMcp: (id: string) => void;
  onChatWithModel: (model: Model) => void;
  onShowToast: (msg: string) => void;
  onOpenHuggingFaceModal?: () => void;
}

export const ModelLabView: React.FC<ModelLabViewProps> = ({
  customModels,
  baseModels,
  memories,
  trainingRuns,
  skills,
  mcpServers,
  onSaveCustomModel,
  onDeleteCustomModel,
  onAddMemory,
  onTogglePinMemory,
  onForgetMemory,
  onToggleTrainingRun,
  onStartFineTune,
  onToggleSkill,
  onAddSkill,
  onToggleMcp,
  onChatWithModel,
  onShowToast,
  onOpenHuggingFaceModal,
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'memory' | 'skills' | 'mcp'>('models');
  const [mode, setMode] = useState<'list' | 'builder'>('list');

  // Builder state
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderBase, setBuilderBase] = useState('qwen-2.5-14b');
  const [builderSystemPrompt, setBuilderSystemPrompt] = useState('');
  const [builderNegativePrompt, setBuilderNegativePrompt] = useState('');
  const [builderExemplars, setBuilderExemplars] = useState<Exemplar[]>([]);
  const [draftInput, setDraftInput] = useState('');
  const [draftOutput, setDraftOutput] = useState('');

  // Sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [sandboxHistory, setSandboxHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  // Memory draft
  const [memoryDraft, setMemoryDraft] = useState('');

  // New skill modal
  const [newSkillOpen, setNewSkillOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillSteps, setNewSkillSteps] = useState('');

  const docUploadRef = useRef<HTMLInputElement>(null);

  const startNewModel = () => {
    setEditingModelId(null);
    setBuilderName('');
    setBuilderDesc('');
    setBuilderBase('qwen-2.5-14b');
    setBuilderSystemPrompt(
      'You are a specialized technical assistant. Deliver direct, code-first answers.'
    );
    setBuilderNegativePrompt('Never apologize. Never omit code details. Avoid corporate padding.');
    setBuilderExemplars([]);
    setSandboxHistory([]);
    setMode('builder');
  };

  const startEditModel = (model: Model) => {
    setEditingModelId(model.id);
    setBuilderName(model.name);
    setBuilderDesc(model.desc);
    setBuilderBase(model.base || 'qwen-2.5-14b');
    setBuilderSystemPrompt(model.systemPrompt || '');
    setBuilderNegativePrompt(model.negativePrompt || '');
    setBuilderExemplars(model.exemplars || []);
    setSandboxHistory([]);
    setMode('builder');
  };

  const addExemplar = () => {
    if (!draftInput.trim() || !draftOutput.trim()) {
      onShowToast('Please provide both the input prompt and expected output exemplar.');
      return;
    }
    setBuilderExemplars((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}`,
        input: draftInput.trim(),
        output: draftOutput.trim(),
      },
    ]);
    setDraftInput('');
    setDraftOutput('');
    onShowToast('Training exemplar added to model definition.');
  };

  const removeExemplar = (idx: number) => {
    setBuilderExemplars((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveModel = (publish: boolean) => {
    if (!builderName.trim()) {
      onShowToast('Model name is required.');
      return;
    }

    const baseObj = baseModels.find((m) => m.id === builderBase);
    const modelToSave: Model = {
      id: editingModelId || `cm-${Date.now()}`,
      name: builderName.trim(),
      desc: builderDesc.trim() || 'Custom tuned model',
      base: builderBase,
      baseName: baseObj ? baseObj.name : 'Custom Engine',
      local: builderBase.includes('llama') || builderBase.includes('qwen'),
      speed: 'Balanced',
      context: '32K',
      tags: ['Tuned', 'Custom'],
      isCustom: true,
      systemPrompt: builderSystemPrompt.trim(),
      negativePrompt: builderNegativePrompt.trim(),
      exemplars: builderExemplars,
      files: [],
    };

    onSaveCustomModel(modelToSave, publish);
    setMode('list');
  };

  const handleSandboxSend = () => {
    if (!sandboxPrompt.trim()) return;

    const query = sandboxPrompt.trim();
    setSandboxHistory((prev) => [...prev, { role: 'user', text: query }]);
    setSandboxPrompt('');

    // Simulate instant model response adhering to negative constraints & exemplars
    setTimeout(() => {
      let reply = `[${builderName || 'Tuned Engine'}] Verified query against active constraints.\n\nNegative Filter: "${builderNegativePrompt || 'None'}" - passed.\nExemplars matched: ${builderExemplars.length} patterns.\n\nExecution specification completed with zero disclaimers.`;
      setSandboxHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 450);
  };

  const handleAddMemory = () => {
    if (!memoryDraft.trim()) return;
    onAddMemory(memoryDraft.trim());
    setMemoryDraft('');
    onShowToast('Rule committed to active model memory.');
  };

  const handleCreateSkill = () => {
    if (!newSkillName.trim()) return;
    const steps = newSkillSteps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddSkill({
      id: `sk-${Date.now()}`,
      name: newSkillName.trim(),
      desc: newSkillDesc.trim(),
      steps: steps.length > 0 ? steps : ['Step 1: Execute analysis', 'Step 2: Validate output'],
      enabled: true,
    });

    setNewSkillOpen(false);
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillSteps('');
    onShowToast('New procedure skill registered.');
  };

  return (
    <div id="model-lab-view" className="flex-1 flex flex-col h-full min-h-0 relative bg-[#080808]">
      {/* Header */}
      <div
        className="flex-none px-4 md:px-8 pt-4 md:pt-6 border-b"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-divider)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#f3f3f3] flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[var(--color-accent)] flex-none" />
              <span>Model Lab & Fine-Tuning</span>
            </h2>
            <p className="text-xs text-[#888888] mt-1 font-sans">
              Teach base models custom procedures, input/output exemplars, and strict negative constraints.
            </p>
          </div>

          {mode === 'list' && activeTab === 'models' && (
            <button
              type="button"
              id="btn-teach-new-model-header"
              onClick={startNewModel}
              className="blueprint h-9 px-4 flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer shadow-sm uppercase font-mono tracking-wider w-full sm:w-auto"
            >
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />
              <Plus className="w-4 h-4" />
              <span>Build & Teach Model</span>
            </button>
          )}
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex gap-1.5 md:gap-2 -mb-px overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: 'models', label: 'Custom Models', icon: Bot },
            { id: 'memory', label: 'Memory & Training', icon: BrainCircuit },
            { id: 'skills', label: 'Skills', icon: Layers },
            { id: 'mcp', label: 'MCP Tools', icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMode('list');
                }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer font-mono whitespace-nowrap ${
                  isActive
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-transparent text-[#888888] hover:text-[#f3f3f3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-none" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
        {/* ══ 1. CUSTOM MODELS TAB ══ */}
        {activeTab === 'models' && (
          <div>
            {mode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
                {customModels.map((m) => (
                  <div
                    key={m.id}
                    className="blueprint bg-[#0a0a0a] border border-[#1c1c1c] rounded p-4 flex flex-col justify-between space-y-4 hover:border-[#2a2a2a] transition-colors"
                  >
                    <i className="corner tl" />
                    <i className="corner tr" />
                    <i className="corner bl" />
                    <i className="corner br" />

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 flex items-center justify-center text-[var(--color-accent)]">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#f3f3f3]">{m.name}</div>
                            <div className="text-[11px] text-[#888888] font-mono">
                              Base: {m.baseName} · {(m.exemplars || []).length} exemplars
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomModel(m.id)}
                          title="Delete Model"
                          className="p-1 text-[#666666] hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-[#a3a3a3] mt-3 line-clamp-2 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#1a1a1a]">
                      <button
                        type="button"
                        onClick={() => onChatWithModel(m)}
                        className="blueprint flex-1 h-8 flex items-center justify-center gap-1.5 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer uppercase font-mono tracking-wider"
                      >
                        <i className="corner tl" />
                        <i className="corner tr" />
                        <i className="corner bl" />
                        <i className="corner br" />
                        <span>Chat With Model</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditModel(m)}
                        className="h-8 px-3 flex items-center justify-center bg-[#141414] hover:bg-[#1f1f1f] text-[#d0d0d0] text-xs rounded transition-colors cursor-pointer border border-[#242424]"
                      >
                        <span>Edit / Teach</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Teach New Model Card */}
                <button
                  type="button"
                  onClick={startNewModel}
                  className="blueprint min-h-[160px] border border-dashed border-[#222222] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/5 rounded p-6 flex flex-col items-center justify-center gap-2 text-[#737373] hover:text-[var(--color-accent)] transition-all cursor-pointer group bg-[#0a0a0a]"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <i className="corner bl" />
                  <i className="corner br" />
                  <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#222222] group-hover:border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#e0e0e0]">Teach a New Model</span>
                  <span className="text-[11px] text-[#737373]">
                    Few-shot exemplars, directives, constraints
                  </span>
                </button>
              </div>
            ) : (
              /* ══ BUILDER / TEACHING MODE ══ */
              <div className="max-w-6xl space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="p-2 bg-[#121212] hover:bg-[#1c1c1c] text-[#a3a3a3] hover:text-[#f3f3f3] rounded border border-[#222222] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-serif text-lg text-[#f3f3f3]">
                    {editingModelId ? `Teaching: ${builderName}` : 'Build & Teach New Model'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Model Configuration & Exemplars */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Model Foundation */}
                    <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3.5">
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <div className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
                        1. Foundation Configuration
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[#a3a3a3] font-medium mb-1">Model Name</label>
                          <input
                            type="text"
                            value={builderName}
                            onChange={(e) => setBuilderName(e.target.value)}
                            placeholder="e.g. Senior Security Auditor"
                            className="w-full bg-[#121212] border border-[#242424] rounded px-3 py-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#a3a3a3] font-medium mb-1">
                            Role Description
                          </label>
                          <input
                            type="text"
                            value={builderDesc}
                            onChange={(e) => setBuilderDesc(e.target.value)}
                            placeholder="e.g. Flags vulnerabilities, OWASP compliance, zero apologies"
                            className="w-full bg-[#121212] border border-[#242424] rounded px-3 py-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[#a3a3a3] font-medium">
                              Base Engine
                            </label>
                            {onOpenHuggingFaceModal && (
                              <button
                                type="button"
                                onClick={onOpenHuggingFaceModal}
                                className="text-[10px] text-[#ff9d00] hover:underline flex items-center gap-1 cursor-pointer font-mono"
                              >
                                <span>🤗 Import from HF</span>
                              </button>
                            )}
                          </div>
                          <select
                            value={builderBase}
                            onChange={(e) => setBuilderBase(e.target.value)}
                            className="w-full bg-[#121212] border border-[#242424] rounded px-3 py-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                          >
                            {baseModels.map((bm) => (
                              <option key={bm.id} value={bm.id}>
                                {bm.isHf || bm.id.startsWith('hf:')
                                  ? `🤗 ${bm.name} (Hugging Face)`
                                  : `${bm.name} (${bm.local ? 'Local On-Device' : 'Cloud Frontier'})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Directives & Negative Constraints */}
                    <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3.5">
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <div className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
                        2. Role Directives & Strict Constraints
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[#a3a3a3] font-medium mb-1">
                            System Prompt / Core Directives
                          </label>
                          <textarea
                            value={builderSystemPrompt}
                            onChange={(e) => setBuilderSystemPrompt(e.target.value)}
                            placeholder="Instruct the model exactly how to behave, how to format answers, and what perspective to adopt."
                            rows={3}
                            className="w-full bg-[#121212] border border-[#242424] rounded p-2.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none resize-none leading-relaxed font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[var(--color-accent)] font-medium mb-1">
                            Strict Negative Constraints (Forbidden Behavior)
                          </label>
                          <textarea
                            value={builderNegativePrompt}
                            onChange={(e) => setBuilderNegativePrompt(e.target.value)}
                            placeholder="e.g. Never use apologetic language. Never output untested assumptions. Do not summarize without raw data."
                            rows={3}
                            className="w-full bg-[#121212] border border-[var(--color-accent)]/40 rounded p-2.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none resize-none leading-relaxed font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Few-Shot Exemplars */}
                    <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3.5">
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
                          3. Teach By Example (Few-Shot Exemplars)
                        </div>
                        <span className="text-[11px] font-mono text-[#888888]">
                          {builderExemplars.length} taught
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] leading-relaxed">
                        Teaching models through input-output pairs is the most reliable way to enforce exact formatting, domain standards, and technical precision.
                      </p>

                      {/* Exemplar Input Form */}
                      <div className="bg-[#121212] border border-[#222222] rounded p-3.5 space-y-2.5 text-xs">
                        <div>
                          <label className="block text-[#888888] text-[11px] mb-1 font-medium font-mono">
                            User Prompt / Input Example
                          </label>
                          <input
                            type="text"
                            value={draftInput}
                            onChange={(e) => setDraftInput(e.target.value)}
                            placeholder="e.g. Check this SQL query: SELECT * FROM users..."
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[#888888] text-[11px] mb-1 font-medium font-mono">
                            Expected Model Output
                          </label>
                          <textarea
                            value={draftOutput}
                            onChange={(e) => setDraftOutput(e.target.value)}
                            placeholder="The exact formatting, diff, and answers the model must produce..."
                            rows={3}
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded p-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none resize-none leading-relaxed font-mono text-[11px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addExemplar}
                          className="h-7 px-3 bg-[#1c1c1c] hover:bg-[#262626] text-[var(--color-accent)] font-medium text-xs rounded transition-colors cursor-pointer flex items-center gap-1.5 border border-[#333333]"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Exemplar Pair</span>
                        </button>
                      </div>

                      {/* Existing Exemplars */}
                      <div className="space-y-2">
                        {builderExemplars.map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#121212] border border-[#222222] rounded text-xs space-y-1.5 relative group"
                          >
                            <button
                              type="button"
                              onClick={() => removeExemplar(idx)}
                              className="absolute top-2.5 right-2.5 text-[#666666] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-[var(--color-accent)] font-semibold pr-6">
                              Prompt: {ex.input}
                            </div>
                            <div className="text-[#d0d0d0] whitespace-pre-wrap font-mono text-[11px] bg-[#0a0a0a] p-2 rounded border border-[#1e1e1e]">
                              {ex.output}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reference Knowledge */}
                    <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3">
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <div className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
                        4. Grounding & Reference Documents
                      </div>
                      <div
                        onClick={() => docUploadRef.current?.click()}
                        className="border border-dashed border-[#262626] hover:border-[var(--color-accent)]/60 rounded p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-[#737373] hover:text-[var(--color-accent)] bg-[#0d0d0d]"
                      >
                        <UploadCloud className="w-5 h-5" />
                        <span className="text-xs font-medium text-[#e0e0e0]">
                          Upload Markdown, Schema, or PDF reference files
                        </span>
                        <span className="text-[10px] text-[#737373]">
                          Injected as permanent context for this model
                        </span>
                      </div>
                      <input type="file" ref={docUploadRef} multiple className="hidden" />
                    </div>
                  </div>

                  {/* Right Column: Live Model Test & Tuning Sandbox */}
                  <div className="lg:col-span-5 sticky top-4 space-y-4">
                    <div className="blueprint bg-[#0a0a0a] border border-[#222222] shadow-2xl rounded flex flex-col h-[580px]">
                      <i className="corner tl" />
                      <i className="corner tr" />
                      <i className="corner bl" />
                      <i className="corner br" />

                      {/* Sandbox Header */}
                      <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0e0e0e]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                          <span className="font-semibold text-xs text-[#f3f3f3]">
                            Live Model Test Sandbox
                          </span>
                        </div>
                        <span className="text-[10px] text-[#888888] font-mono uppercase">Real-time</span>
                      </div>

                      {/* Sandbox Messages */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-[#080808]">
                        {sandboxHistory.length === 0 && (
                          <div className="py-20 text-center text-[#666666] space-y-1">
                            <Bot className="w-6 h-6 mx-auto text-[#444444] mb-1" />
                            <div>Test your model against constraints.</div>
                            <div className="text-[11px] text-[#555555]">
                              Send a query below to verify few-shot outputs.
                            </div>
                          </div>
                        )}

                        {sandboxHistory.map((m, idx) => (
                          <div
                            key={idx}
                            className={`flex ${
                              m.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[90%] p-2.5 rounded text-xs leading-relaxed whitespace-pre-wrap ${
                                m.role === 'user'
                                  ? 'bg-[var(--color-accent)]/15 text-[#f5ede4] border border-[var(--color-accent)]/35'
                                  : 'bg-[#121212] text-[#f3f3f3] border border-[#242424]'
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Sandbox Input */}
                      <div className="p-3 border-t border-[#1a1a1a] flex items-center gap-2 bg-[#0e0e0e]">
                        <input
                          type="text"
                          value={sandboxPrompt}
                          onChange={(e) => setSandboxPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSandboxSend();
                          }}
                          placeholder="Send test query to model..."
                          className="flex-1 bg-[#141414] border border-[#262626] rounded px-3 py-1.5 text-xs text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSandboxSend}
                          className="h-7 w-7 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] rounded flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Publish & Save Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveModel(false)}
                        className="flex-1 h-9 bg-[#141414] hover:bg-[#1f1f1f] text-[#d0d0d0] text-xs font-semibold rounded transition-colors cursor-pointer border border-[#242424]"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveModel(true)}
                        className="blueprint flex-1 h-9 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] text-xs font-semibold rounded transition-colors cursor-pointer shadow-md uppercase font-mono tracking-wider"
                      >
                        <i className="corner tl" />
                        <i className="corner tr" />
                        <i className="corner bl" />
                        <i className="corner br" />
                        Publish & Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ 2. DIRECT MEMORY & TRAINING TAB ══ */}
        {activeTab === 'memory' && (
          <div className="max-w-4xl space-y-6">
            {/* Direct Memory Input */}
            <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3">
              <i className="corner tl" />
              <i className="corner tr" />
              <div>
                <h4 className="font-serif text-base text-[#f3f3f3]">
                  Direct Memory & Rule Injection
                </h4>
                <p className="text-xs text-[#888888] mt-0.5 font-sans">
                  All active and pinned items are automatically injected into system prompts across all active threads.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memoryDraft}
                  onChange={(e) => setMemoryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMemory();
                  }}
                  placeholder="Teach a new explicit behavioral rule, fact, or restriction..."
                  className="flex-1 bg-[#121212] border border-[#242424] rounded px-3 py-2 text-xs text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddMemory}
                  className="blueprint px-4 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded transition-colors cursor-pointer whitespace-nowrap uppercase font-mono tracking-wider"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <i className="corner bl" />
                  <i className="corner br" />
                  Teach Rule
                </button>
              </div>
            </div>

            {/* Memories List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#a3a3a3]">
                  Learned Rules & Memory Buffer ({memories.length})
                </h4>
              </div>

              <div className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded divide-y divide-[#181818] overflow-hidden">
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                {memories.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-start gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => onTogglePinMemory(m.id)}
                      title={m.pinned ? 'Unpin rule' : 'Pin rule'}
                      className={`p-1.5 rounded transition-colors flex-none cursor-pointer ${
                        m.pinned ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/15' : 'text-[#666666] hover:text-[#f3f3f3]'
                      }`}
                    >
                      {m.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[#f3f3f3] leading-relaxed font-medium">{m.text}</div>
                      <div className="flex items-center gap-3 text-[10px] text-[#737373] font-mono">
                        <span>Source: {m.source}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-[#141414] rounded text-[#a3a3a3] border border-[#222222]">
                          {m.scope}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onForgetMemory(m.id)}
                      title="Forget rule"
                      className="p-1 text-[#666666] hover:text-red-400 transition-colors flex-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fine-Tuned Checkpoints (LoRA runs) */}
            <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#a3a3a3]">
                    Fine-Tuned Checkpoints (Adapters & LoRA)
                  </h4>
                  <p className="text-[11px] text-[#737373] mt-0.5 font-sans">
                    Trained model weight deltas generated from verified technical responses.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-run-finetune-cycle"
                  onClick={onStartFineTune}
                  className="blueprint h-8 px-3.5 flex items-center gap-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-[var(--color-accent)] text-xs font-semibold rounded transition-colors cursor-pointer border border-[#262626]"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <i className="corner bl" />
                  <i className="corner br" />
                  <Play className="w-3 h-3" />
                  <span>Run Fine-Tuning Cycle</span>
                </button>
              </div>

              <div className="space-y-2">
                {trainingRuns.map((tr) => (
                  <div
                    key={tr.id}
                    className="blueprint p-3.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded flex items-center justify-between gap-4"
                  >
                    <i className="corner tl" />
                    <i className="corner tr" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#f3f3f3]">{tr.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            tr.applied
                              ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/35'
                              : 'bg-[#141414] text-[#888888] border border-[#222222]'
                          }`}
                        >
                          {tr.applied ? 'Active in Weights' : 'Ready to Apply'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#888888] mt-0.5 font-mono">
                        Dataset: {tr.from} · {tr.date} {tr.finalLoss && `· Loss: ${tr.finalLoss}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleTrainingRun(tr.id)}
                      className={`h-7 px-3 text-xs font-medium rounded transition-colors cursor-pointer font-mono ${
                        tr.applied
                          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40'
                          : 'bg-[#141414] hover:bg-[#1f1f1f] text-[#d0d0d0] border border-[#242424]'
                      }`}
                    >
                      {tr.applied ? 'Active' : 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 3. PROCEDURES & SKILLS TAB ══ */}
        {activeTab === 'skills' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base text-[#f3f3f3]">
                  Execution Skills & Protocols
                </h4>
                <p className="text-xs text-[#888888] mt-0.5 font-sans">
                  Structured repeatable procedures executed by active models during analysis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewSkillOpen(true)}
                className="blueprint h-8 px-3.5 flex items-center gap-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-[var(--color-accent)] text-xs font-semibold rounded transition-colors cursor-pointer border border-[#262626]"
              >
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill Protocol</span>
              </button>
            </div>

            {/* Modal to add skill */}
            {newSkillOpen && (
              <div className="blueprint bg-[#0d0d0d] border border-[var(--color-accent)]/50 p-4 rounded space-y-3">
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                <div className="font-semibold text-xs text-[var(--color-accent)] uppercase tracking-wider font-mono">
                  Create Custom Skill Protocol
                </div>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill Name (e.g. Distributed Lock Auditor)"
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newSkillDesc}
                    onChange={(e) => setNewSkillDesc(e.target.value)}
                    placeholder="Short Description of what this procedure checks"
                    className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-1.5 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <textarea
                    value={newSkillSteps}
                    onChange={(e) => setNewSkillSteps(e.target.value)}
                    placeholder="Execution Steps (one step per line)..."
                    rows={3}
                    className="w-full bg-[#141414] border border-[#282828] rounded p-2 text-[#f3f3f3] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSkillOpen(false)}
                    className="px-3 py-1 text-xs text-[#888888] hover:text-[#f3f3f3] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSkill}
                    className="px-3.5 py-1 bg-[var(--color-accent)] hover:bg-[#d8b995] text-[#080808] font-semibold text-xs rounded uppercase font-mono tracking-wider cursor-pointer"
                  >
                    Register Protocol
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {skills.map((sk) => (
                <div
                  key={sk.id}
                  className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 space-y-3"
                >
                  <i className="corner tl" />
                  <i className="corner tr" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#f3f3f3]">{sk.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            sk.enabled
                              ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/35'
                              : 'bg-[#141414] text-[#666666] border border-[#222222]'
                          }`}
                        >
                          {sk.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-[#888888] mt-1 leading-relaxed">{sk.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSkill(sk.id)}
                      className={`h-7 px-3 text-xs font-medium rounded transition-colors cursor-pointer font-mono ${
                        sk.enabled
                          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40'
                          : 'bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] border border-[#222222]'
                      }`}
                    >
                      {sk.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Step pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sk.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121212] border border-[#222222] text-xs text-[#d0d0d0]"
                      >
                        <span className="text-[var(--color-accent)] font-mono font-semibold">{sIdx + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ 4. MCP & TOOLS TAB ══ */}
        {activeTab === 'mcp' && (
          <div className="max-w-4xl space-y-4">
            <div>
              <h4 className="font-serif text-base text-[#f3f3f3]">
                Model Context Protocol (MCP) Connectors
              </h4>
              <p className="text-xs text-[#888888] mt-0.5 font-sans">
                Grant models tool access to local filesystems, relational schemas, git repositories, and runtime inspection.
              </p>
            </div>

            <div className="space-y-3">
              {mcpServers.map((mc) => {
                const isRunning = mc.status === 'running';
                return (
                  <div
                    key={mc.id}
                    className="blueprint bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 flex items-center justify-between gap-4"
                  >
                    <i className="corner tl" />
                    <i className="corner tr" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-[#f3f3f3]">
                          {mc.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isRunning
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#141414] text-[#737373] border border-[#222222]'
                          }`}
                        >
                          {isRunning ? 'Running' : 'Stopped'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[#737373]">{mc.url}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mc.tools.map((t, tIdx) => (
                          <span
                            key={`${mc.id}-${t}-${tIdx}`}
                            className="px-1.5 py-0.5 bg-[#121212] rounded text-[10px] text-[#a3a3a3] font-mono border border-[#222222]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleMcp(mc.id)}
                      className={`h-8 px-3 text-xs font-semibold rounded transition-colors cursor-pointer font-mono ${
                        isRunning
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/35'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/35'
                      }`}
                    >
                      {isRunning ? 'Stop Server' : 'Start Server'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
