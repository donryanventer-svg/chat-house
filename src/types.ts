export interface Model {
  id: string;
  name: string;
  local: boolean;
  speed: string;
  context: string;
  desc: string;
  tags: string[];
  size?: string;
  isCustom?: boolean;
  isHf?: boolean;
  hfModelId?: string;
  hfLikes?: number;
  hfDownloads?: number;
  hfPipelineTag?: string;
  base?: string;
  baseName?: string;
  systemPrompt?: string;
  negativePrompt?: string;
  exemplars?: Exemplar[];
  files?: string[];
}

export interface Exemplar {
  id?: string;
  input: string;
  output: string;
}

export interface Thread {
  id: string;
  title: string;
  group: string;
  updated: string;
  createdAt: number;
}

export interface MessageBlock {
  isP?: boolean;
  isList?: boolean;
  isCode?: boolean;
  lang?: string;
  text?: string;
  items?: string[];
  showCaret?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  blocks?: MessageBlock[];
  streaming?: boolean;
  hasThinking?: boolean;
  thinkingText?: string;
  thinkingOpen?: boolean;
  files?: Attachment[];
  timestamp?: number;
}

export interface SteeringParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  repeatPenalty: number;
  freqPenalty: number;
  seed: number;
  format: 'text' | 'markdown' | 'json';
  streaming: boolean;
  reasoningEffort: 'off' | 'low' | 'med' | 'high';
  systemPrompt: string;
  negativePrompt: string;
  enforceLearnedRules: boolean;
}

export interface LearnedMemory {
  id: string;
  text: string;
  source: string;
  scope: string;
  pinned: boolean;
  createdAt?: number;
}

export interface TrainingRun {
  id: string;
  name: string;
  from: string;
  status: 'ready' | 'running' | 'completed' | 'failed';
  applied: boolean;
  date: string;
  epochs?: number;
  finalLoss?: number;
}

export interface SkillProtocol {
  id: string;
  name: string;
  desc: string;
  steps: string[];
  enabled: boolean;
}

export interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'running' | 'stopped';
  tools: string[];
}

export interface CustomEndpointConfig {
  url: string;
  apiKey: string;
  connected: boolean;
  modelName?: string;
}

export interface VoiceSettings {
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  autoReadAloud: boolean;
  halseyProfile?: string;
  personalityPreset?: string;
}

export type HalseyVoiceProfileId =
  | 'halsey-badlands'
  | 'halsey-ballad'
  | 'halsey-manic'
  | 'halsey-sultry'
  | 'custom';

export interface HalseyVoiceProfile {
  id: HalseyVoiceProfileId;
  name: string;
  subtitle: string;
  rate: number;
  pitch: number;
  description: string;
  sampleQuote: string;
}

export type PersonalityPresetId =
  | 'none'
  | 'halsey'
  | 'unhinged'
  | 'naughty'
  | 'unhinged-halsey'
  | 'naughty-halsey';

export interface PersonalityPreset {
  id: PersonalityPresetId;
  label: string;
  badge: string;
  tagline: string;
  description: string;
  systemPrompt: string;
}

export interface ThemeSettings {
  accent: 'steel' | 'pale-steel' | 'deep-steel' | 'amber' | 'cyan';
  ground: 'steel' | 'graphite' | 'ink';
}

export interface HuggingFaceUser {
  id: string;
  username: string;
  fullname?: string;
  email?: string;
  avatarUrl?: string;
  isPro?: boolean;
  orgs?: Array<{ name: string; fullname?: string; avatarUrl?: string }>;
  tokenScope?: string;
  modelsCount?: number;
  datasetsCount?: number;
  spacesCount?: number;
  linkedAt?: number;
  connectionType?: 'oauth' | 'token';
}

export interface HuggingFaceRepo {
  id: string;
  name: string;
  private: boolean;
  likes?: number;
  downloads?: number;
  lastModified?: string;
  pipelineTag?: string;
  type: 'model' | 'dataset' | 'space';
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  warmth: number; // -100 to 100
  vignette: number; // 0 to 100
  grain: number; // 0 to 100
  blur: number; // 0 to 20
  sepia: number; // 0 to 100
  invert: boolean;
  hueRotate: number; // 0 to 360
  filterPreset: 'none' | 'noir' | 'vintage' | 'cyberpunk' | 'warm-gold' | 'cool-matrix' | 'faded-dream' | 'high-contrast';
  flipH: boolean;
  flipV: boolean;
  rotation: number; // 0, 90, 180, 270
  watermarkText: string;
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'center';
  watermarkOpacity: number; // 0 to 1
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  fullPrompt?: string;
  negativePrompt?: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '4:1' | '1:4';
  imageSize: '512px' | '1K' | '2K' | '4K';
  seed: number;
  guidanceScale: number;
  steps: number;
  engine: 'gemini' | 'huggingface' | 'procedural';
  modelName: string;
  imageUrl: string;
  source: 'gemini' | 'huggingface' | 'procedural' | 'gemini-modified' | 'procedural-remix';
  createdAt: number;
  stylePreset?: string;
  modifiers?: string[];
  lighting?: string;
  camera?: string;
  colorPalette?: string;
  parentImageId?: string;
  parentImageUrl?: string;
  instruction?: string;
  adjustments?: ImageAdjustments;
  notice?: string;
}

export type AppView = 'chat' | 'modelLab' | 'imageStudio' | 'settings';

