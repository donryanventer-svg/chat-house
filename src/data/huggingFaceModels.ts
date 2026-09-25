import { Model } from '../types';

export interface HuggingFaceHubModel {
  hfId: string;
  name: string;
  author: string;
  category: 'general' | 'code' | 'reasoning' | 'fast';
  context: string;
  speed: 'Fast' | 'Balanced' | 'Deliberate';
  downloads: string;
  likes: number;
  desc: string;
  tags: string[];
  badge?: string;
}

export const CURATED_HF_MODELS: HuggingFaceHubModel[] = [
  {
    hfId: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 · 70B',
    author: 'Meta',
    category: 'general',
    context: '128K',
    speed: 'Deliberate',
    downloads: '2.4M',
    likes: 3120,
    desc: 'Flagship open weights model delivering frontier-class reasoning, competitive with closed LLMs across STEM and coding.',
    tags: ['Meta', 'Frontier', '128K', 'Instruct'],
    badge: 'Flagship',
  },
  {
    hfId: 'meta-llama/Llama-3.2-3B-Instruct',
    name: 'Llama 3.2 · 3B',
    author: 'Meta',
    category: 'fast',
    context: '128K',
    speed: 'Fast',
    downloads: '5.1M',
    likes: 1840,
    desc: 'Compact multilingual model optimized for low-latency reasoning, summarization, and interactive chat.',
    tags: ['Meta', 'Ultra-Fast', '128K', 'Edge'],
    badge: 'Popular',
  },
  {
    hfId: 'meta-llama/Llama-3.2-1B-Instruct',
    name: 'Llama 3.2 · 1B',
    author: 'Meta',
    category: 'fast',
    context: '128K',
    speed: 'Fast',
    downloads: '3.8M',
    likes: 920,
    desc: 'Lightweight on-device powerhouse for rapid turn-taking, prompt parsing, and embedded inference.',
    tags: ['Meta', 'Mobile', '128K', 'Fast'],
    badge: 'Lightweight',
  },
  {
    hfId: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder · 32B',
    author: 'Qwen',
    category: 'code',
    context: '128K',
    speed: 'Balanced',
    downloads: '1.9M',
    likes: 2750,
    desc: 'Top-ranking open-source coding model supporting 90+ programming languages, repo-level architecture, and bug fixes.',
    tags: ['Qwen', 'Coding', '128K', 'Python/TS'],
    badge: 'Top Coder',
  },
  {
    hfId: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen 2.5 · 72B',
    author: 'Qwen',
    category: 'general',
    context: '128K',
    speed: 'Deliberate',
    downloads: '1.6M',
    likes: 2410,
    desc: 'Comprehensive multi-lingual knowledge and mathematical proof engine with vast domain depth.',
    tags: ['Qwen', 'Frontier', '128K', 'Reasoning'],
    badge: 'Frontier',
  },
  {
    hfId: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
    name: 'DeepSeek R1 Distill · 14B',
    author: 'DeepSeek',
    category: 'reasoning',
    context: '64K',
    speed: 'Balanced',
    downloads: '2.8M',
    likes: 4200,
    desc: 'Distilled reasoning model exhibiting rigorous chain-of-thought, self-verification, and mathematical deduction.',
    tags: ['DeepSeek', 'Reasoning', 'Math', 'CoT'],
    badge: 'Trending',
  },
  {
    hfId: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    name: 'DeepSeek R1 Distill · 8B',
    author: 'DeepSeek',
    category: 'reasoning',
    context: '128K',
    speed: 'Fast',
    downloads: '3.1M',
    likes: 3600,
    desc: 'Fast reasoning-focused distillation combining Llama architecture with DeepSeek R1 thought chains.',
    tags: ['DeepSeek', 'Reasoning', '128K', 'Fast'],
    badge: 'CoT Fast',
  },
  {
    hfId: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B · v0.3',
    author: 'Mistral AI',
    category: 'general',
    context: '32K',
    speed: 'Fast',
    downloads: '4.2M',
    likes: 3100,
    desc: 'Versatile, high-efficiency European open weights model featuring native function-calling and concise syntax.',
    tags: ['Mistral', 'Versatile', '32K', 'Tools'],
    badge: 'Standard',
  },
  {
    hfId: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    name: 'Mixtral 8x7B · MoE',
    author: 'Mistral AI',
    category: 'general',
    context: '32K',
    speed: 'Balanced',
    downloads: '1.8M',
    likes: 2950,
    desc: 'High-speed Sparse Mixture-of-Experts routing queries through 8 specialized sub-networks per token.',
    tags: ['Mistral', 'MoE', '32K', 'Sparse'],
    badge: 'MoE',
  },
  {
    hfId: 'google/gemma-2-9b-it',
    name: 'Gemma 2 · 9B',
    author: 'Google',
    category: 'general',
    context: '8K',
    speed: 'Fast',
    downloads: '1.7M',
    likes: 1980,
    desc: 'Google open weights model built on Gemini research, tuned for safety, factual grounding, and instruction adherence.',
    tags: ['Google', 'Gemma', 'Safety', 'Fast'],
    badge: 'Google Open',
  },
  {
    hfId: 'microsoft/Phi-3.5-mini-instruct',
    name: 'Phi 3.5 Mini · 3.8B',
    author: 'Microsoft',
    category: 'fast',
    context: '128K',
    speed: 'Fast',
    downloads: '1.5M',
    likes: 1450,
    desc: 'Compact model trained on high-quality synthetic textbooks, achieving high benchmark scores for its parameter footprint.',
    tags: ['Microsoft', 'Small', '128K', 'STEM'],
    badge: 'Compact',
  },
  {
    hfId: 'NousResearch/Hermes-3-Llama-3.1-8B',
    name: 'Hermes 3 · 8B',
    author: 'Nous Research',
    category: 'general',
    context: '128K',
    speed: 'Fast',
    downloads: '950K',
    likes: 1820,
    desc: 'Generalist agentic model with advanced roleplay, JSON structured outputs, and open reasoning capabilities.',
    tags: ['Nous', 'Agentic', '128K', 'JSON'],
    badge: 'Agentic',
  },
];

/**
 * Converts a HuggingFaceHubModel or custom HF model into the standard app Model format
 */
export function convertHfToAppModel(hf: {
  hfId: string;
  name?: string;
  desc?: string;
  context?: string;
  speed?: 'Fast' | 'Balanced' | 'Deliberate';
  tags?: string[];
  downloads?: string | number;
  likes?: number;
}): Model {
  const author = hf.hfId.split('/')[0] || 'HuggingFace';
  const repoName = hf.hfId.split('/')[1] || hf.hfId;
  const cleanName = hf.name || repoName.replace(/[-_]/g, ' ');

  return {
    id: `hf:${hf.hfId}`,
    name: cleanName,
    local: false,
    speed: hf.speed || 'Balanced',
    context: hf.context || '32K',
    desc: hf.desc || `Hugging Face model repository ${hf.hfId} via Serverless Inference API.`,
    tags: hf.tags && hf.tags.length > 0 ? hf.tags : ['Hugging Face', author, 'Hub'],
    isHf: true,
    hfModelId: hf.hfId,
    hfLikes: typeof hf.likes === 'number' ? hf.likes : undefined,
    hfDownloads: typeof hf.downloads === 'number' ? hf.downloads : undefined,
  };
}
