import { Model, Thread, Message, SteeringParams, LearnedMemory, TrainingRun, SkillProtocol, McpServer } from '../types';

export const BASE_MODELS: Model[] = [
  {
    id: 'atlas-large',
    name: 'Atlas Large',
    local: false,
    speed: 'Deliberate',
    context: '200K',
    desc: 'Frontier model: deep multi-step reasoning, mathematical proofing, and structural formatting.',
    tags: ['Reasoning', 'Vision', 'STEM'],
  },
  {
    id: 'atlas-fast',
    name: 'Atlas Fast',
    local: false,
    speed: 'Fast',
    context: '128K',
    desc: 'Low-latency daily driver with high token throughput and real-time responsiveness.',
    tags: ['Fast', 'Balanced'],
  },
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 · 8B',
    local: true,
    speed: 'Fast',
    context: '128K',
    desc: 'Runs completely on-device without external telemetry or data retention.',
    tags: ['Offline', 'Private'],
    size: '4.7 GB',
  },
  {
    id: 'qwen-2.5-14b',
    name: 'Qwen 2.5 · 14B',
    local: true,
    speed: 'Balanced',
    context: '32K',
    desc: 'Specialized for coding, abstract syntax analysis, and algorithmic logic.',
    tags: ['Offline', 'Code'],
    size: '8.2 GB',
  },
  {
    id: 'hf:meta-llama/Llama-3.2-3B-Instruct',
    name: 'Llama 3.2 · 3B',
    local: false,
    speed: 'Fast',
    context: '128K',
    desc: 'Meta edge instruction model hosted on Hugging Face Serverless Router.',
    tags: ['Hugging Face', 'Meta', '128K', 'Instruct'],
    isHf: true,
    hfModelId: 'meta-llama/Llama-3.2-3B-Instruct',
    hfLikes: 1840,
    hfDownloads: 5100000,
  },
  {
    id: 'hf:Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder · 32B',
    local: false,
    speed: 'Balanced',
    context: '128K',
    desc: 'Premier open-source code intelligence model on Hugging Face Hub.',
    tags: ['Hugging Face', 'Qwen', '128K', 'Coding'],
    isHf: true,
    hfModelId: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    hfLikes: 2750,
    hfDownloads: 1900000,
  },
];

export const INITIAL_CUSTOM_MODELS: Model[] = [
  {
    id: 'cm-sec-auditor',
    name: 'Security Auditor',
    base: 'qwen-2.5-14b',
    baseName: 'Qwen 2.5 · 14B',
    local: true,
    speed: 'Balanced',
    context: '32K',
    tags: ['Tuned', 'Security'],
    isCustom: true,
    desc: 'Flags vulnerabilities, strict OWASP compliance, zero apologies, direct CWE cross-references.',
    systemPrompt:
      'You are an uncompromising senior application security auditor. Review code and architecture strictly against OWASP guidelines. Always identify CVE/CWE risks first with code remediation diffs.',
    negativePrompt:
      'Never assume code is safe. Never use generic corporate apologies. Do not omit vulnerable lines. Never use phrases like "I hope this helps".',
    exemplars: [
      {
        input: "Check this SQL query: SELECT * FROM users WHERE id = ' + id",
        output:
          "CRITICAL VULNERABILITY: SQL Injection.\nCWE: CWE-89\nSeverity: High (CVSS 8.8)\nRemediation:\n```typescript\nconst user = await db.query('SELECT * FROM users WHERE id = $1', [id]);\n```\nNever concatenate unsanitized user inputs into raw SQL strings.",
      },
    ],
    files: ['owasp-top-10.md'],
  },
  {
    id: 'cm-system-architect',
    name: 'Zero-Downtime Architect',
    base: 'atlas-large',
    baseName: 'Atlas Large',
    local: false,
    speed: 'Deliberate',
    context: '200K',
    tags: ['Tuned', 'Infra'],
    isCustom: true,
    desc: 'High-concurrency distributed systems engineer. Rejects naive microservices and enforces schema migration isolation.',
    systemPrompt:
      'You are a principal distributed systems architect. You prioritize resilience, bounded latency, idempotency, and explicit fault domains.',
    negativePrompt:
      'Never recommend unmeasured premature optimization. Never suggest distributed locks where optimistic locking or partitioning suffices.',
    exemplars: [
      {
        input: 'How should we handle dual-writes between Postgres and ElasticSearch?',
        output:
          'Use Transactional Outbox Pattern with Change Data Capture (CDC via Debezium/Kafka). Never dual-write from application code — partial failure creates silent split-brain inconsistency.',
      },
    ],
    files: [],
  },
];

export const INITIAL_THREADS: Thread[] = [
  {
    id: 't1',
    title: 'System Architecture Review',
    group: 'Today',
    updated: '11:20 AM',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 't2',
    title: 'Auth Middleware Refactor',
    group: 'Today',
    updated: '9:15 AM',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 't3',
    title: 'Postgres Connection Pooling',
    group: 'Yesterday',
    updated: 'Yesterday',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
  },
];

export const INITIAL_THREAD_MESSAGES: Record<string, Message[]> = {
  t1: [
    {
      id: 'm1',
      role: 'user',
      text: 'Evaluate our database migration strategy for high-load clusters. We are running PostgreSQL 16 with 4 replicas.',
    },
    {
      id: 'm2',
      role: 'assistant',
      hasThinking: true,
      thinkingOpen: false,
      thinkingText:
        'Analyzing Postgres lock behavior on concurrent DDL. Exclusive lock queue on table writes can cause catastrophic cascading connection starvation if long read queries hold AccessShareLock. Strategy requires Expand/Contract phase.',
      blocks: [
        {
          isP: true,
          text: 'A zero-downtime database migration strategy for high-throughput nodes requires three non-negotiable stages:',
        },
        {
          isList: true,
          items: [
            'Expand & Contract: Introduce non-breaking additive schema changes first, dual-write across the cluster.',
            'Backfill asynchronously: Populate legacy rows using rate-limited batch workers to prevent replication lag and lock contention.',
            'Cutover & Deprecation: Flip read traffic to the new schema, verify replicas, then remove legacy columns in a subsequent release cycle.',
          ],
        },
        {
          isCode: true,
          lang: 'sql',
          text: `-- Safe concurrent index creation without holding AccessExclusiveLock\nSET statement_timeout = '5s';\nSET lock_timeout = '2s';\n\nCREATE INDEX CONCURRENTLY idx_users_account_status \nON users (account_id, status) \nWHERE deleted_at IS NULL;`,
        },
        {
          isP: true,
          text: 'Do not run transactional DDL modifications on tables with active sequential scans without setting a strict lock_timeout.',
        },
      ],
    },
  ],
  t2: [
    {
      id: 'm3',
      role: 'user',
      text: 'Show me the cached auth handler with in-memory TTL and race condition protection.',
    },
    {
      id: 'm4',
      role: 'assistant',
      blocks: [
        {
          isP: true,
          text: 'Here is the atomic cached session verification block with single-flight mutex protection:',
        },
        {
          isCode: true,
          lang: 'typescript',
          text: `interface CacheEntry<T> {\n  value: T;\n  expiresAt: number;\n}\n\nconst sessionCache = new Map<string, CacheEntry<Session>>();\nconst inflight = new Map<string, Promise<Session | null>>();\n\nexport async function getSessionCached(sessionId: string): Promise<Session | null> {\n  const now = Date.now();\n  const cached = sessionCache.get(sessionId);\n  if (cached && cached.expiresAt > now) {\n    return cached.value;\n  }\n\n  // Coalesce duplicate concurrent requests\n  if (inflight.has(sessionId)) {\n    return inflight.get(sessionId)!;\n  }\n\n  const promise = (async () => {\n    try {\n      const session = await db.sessions.findUnique({ where: { id: sessionId } });\n      if (session) {\n        sessionCache.set(sessionId, { value: session, expiresAt: now + 60_000 });\n      }\n      return session;\n    } finally {\n      inflight.delete(sessionId);\n    }\n  })();\n\n  inflight.set(sessionId, promise);\n  return promise;\n}`,
        },
      ],
    },
  ],
  t3: [
    {
      id: 'm5',
      role: 'user',
      text: 'What should the PgBouncer pool mode be for Prisma / ORMs?',
    },
    {
      id: 'm6',
      role: 'assistant',
      blocks: [
        {
          isP: true,
          text: 'Use `transaction` mode in PgBouncer. Note: Prepared statements and advisory locks require caution in transaction pooling unless `pg_isready` and server-level named statements are handled.',
        },
      ],
    },
  ],
};

export const INITIAL_MEMORIES: LearnedMemory[] = [
  {
    id: 'me1',
    text: 'Give direct, realistic, adult engineering answers without sidelines, evasions, or boilerplate padding.',
    source: 'Explicit rule',
    scope: 'Global',
    pinned: true,
  },
  {
    id: 'me2',
    text: 'Never output generic disclaimers or apologies like "As an AI..." or "I apologize for the confusion".',
    source: 'Negative constraint',
    scope: 'Global',
    pinned: true,
  },
  {
    id: 'me3',
    text: 'Always include executable code snippets with explicit error boundaries instead of pseudocode placeholders.',
    source: 'Trained directive',
    scope: 'Code Engine',
    pinned: true,
  },
  {
    id: 'me4',
    text: 'Prefer strict TypeScript, immutability, and zero unhandled Promise rejections in all generated code.',
    source: 'Architecture standard',
    scope: 'TypeScript',
    pinned: false,
  },
];

export const INITIAL_TRAINING_RUNS: TrainingRun[] = [
  {
    id: 'tr1',
    name: 'Technical Candor LoRA (v2.4)',
    from: '120 verified senior code reviews',
    status: 'ready',
    applied: true,
    date: 'Active',
    epochs: 4,
    finalLoss: 0.042,
  },
  {
    id: 'tr2',
    name: 'Strict OWASP Enforcement Adapter',
    from: '45 security remediation pairs',
    status: 'ready',
    applied: false,
    date: '3 days ago',
    epochs: 6,
    finalLoss: 0.089,
  },
];

export const INITIAL_SKILLS: SkillProtocol[] = [
  {
    id: 'sk1',
    name: 'Code Review Protocol',
    desc: 'Examines diffs for concurrency hazards, memory leaks, and unhandled boundary cases.',
    steps: ['Analyze lock acquisition order', 'Inspect memory allocation lifecycle', 'Emit actionable unified diff'],
    enabled: true,
  },
  {
    id: 'sk2',
    name: 'Zero-Downtime Migration Linter',
    desc: 'Verifies DDL statements against table size and transaction locking rules before execution.',
    steps: ['Check lock_timeout configuration', 'Ensure CONCURRENT index creation', 'Validate backward compatibility'],
    enabled: true,
  },
  {
    id: 'sk3',
    name: 'Incident Postmortem Synthesizer',
    desc: 'Parses telemetry traces and server logs to extract Root Cause, MTTD, MTTR, and preventative action items.',
    steps: ['Parse timestamp chronological anomaly', 'Identify trigger failure domain', 'Generate five-whys matrix'],
    enabled: false,
  },
];

export const INITIAL_MCP_SERVERS: McpServer[] = [
  {
    id: 'mc1',
    name: 'Local Filesystem MCP',
    url: 'stdio://mcp-fs',
    status: 'running',
    tools: ['read_file', 'write_file', 'list_directory', 'directory_tree'],
  },
  {
    id: 'mc2',
    name: 'PostgreSQL Inspector MCP',
    url: 'stdio://mcp-pg',
    status: 'running',
    tools: ['inspect_schema', 'explain_analyze', 'active_queries', 'pool_stats'],
  },
  {
    id: 'mc3',
    name: 'Git Workspace MCP',
    url: 'stdio://mcp-git',
    status: 'stopped',
    tools: ['git_status', 'git_diff', 'git_commit', 'git_branch'],
  },
];

export const DEFAULT_STEERING_PARAMS: SteeringParams = {
  temperature: 0.3,
  topP: 0.9,
  maxTokens: 2048,
  repeatPenalty: 1.15,
  freqPenalty: 0.1,
  seed: 42,
  format: 'text',
  streaming: true,
  reasoningEffort: 'low',
  systemPrompt:
    'You are an adult, highly realistic technical advisor and systems engineer. Deliver direct answers with concrete facts, zero fluff, and no evasions.',
  negativePrompt:
    'Do not apologize. Do not output disclaimers. Do not hedge with corporate safety padding. Never say "As an AI language model".',
  enforceLearnedRules: true,
};
