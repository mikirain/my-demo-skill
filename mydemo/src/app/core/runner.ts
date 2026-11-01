/**
 * pi 技能运行器数据层：HTTP 契约 + 事件 → 视图状态归约。
 * 纯 TS（无 Angular 依赖），供 features/assistant 使用。
 */

/* ---------------------------------------------------------------- 契约类型 */

export type RunStatus = 'running' | 'succeeded' | 'failed' | 'aborted';
export type ViewStatus = RunStatus | 'idle';
export type ArtifactKind = 'markdown' | 'json' | 'csv' | 'code' | 'text';

export interface RunModel {
  provider: string;
  id: string;
  name: string;
}

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface Artifact {
  path: string;
  name: string;
  dir: string;
  kind: ArtifactKind;
  size: number;
  modifiedAt: number;
  origin: 'tool' | 'scan';
}

export interface RunEvent {
  seq: number;
  ts: number;
  type: string;
  data?: Record<string, unknown>;
}

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
  source?: string;
}

export interface AppConfig {
  workspace: string;
  defaultSkill: string | null;
  skills: SkillInfo[];
  diagnostics: unknown[];
  model: RunModel | null;
  sdk: { package: string };
}

export interface RunSummary {
  id: string;
  prompt: string;
  skill: string | null;
  status: RunStatus;
  createdAt: number;
  endedAt?: number;
  durationMs?: number;
  sessionId?: string;
  model?: RunModel;
  artifactCount: number;
  error?: string;
}

export interface RunRecord {
  id: string;
  prompt: string;
  skill: string | null;
  status: RunStatus;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  sessionId?: string;
  sessionFile?: string;
  cwd: string;
  model?: RunModel;
  usage?: Usage;
  artifacts: Artifact[];
  events: RunEvent[];
  error?: string;
}

export interface ArtifactContent {
  path: string;
  kind: ArtifactKind | 'binary';
  size: number;
  content: string;
  truncated: boolean;
}

/* ---------------------------------------------------------------- 视图类型 */

export interface ToolView {
  id: string;
  name: string;
  label: string;
  title: string;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  preview: string;
  durationMs: number | null;
}

/** 一个助手回合内的有序片段：思考 / 工具 / 正文按到达顺序排列。 */
export interface Segment {
  key: string;
  kind: 'text' | 'thinking' | 'tool';
  text: string;
  tool: ToolView | null;
}

/**
 * 消息块用扁平结构（而非判别联合），模板里可直接按 kind 分支访问字段，
 * 不依赖模板类型收窄。
 */
export interface ChatBlock {
  kind: 'user' | 'assistant' | 'notice';
  key: string;
  /** user：提问正文；notice：细节说明 */
  text: string;
  /** user：使用的技能 */
  skill: string | null;
  /** notice：标题与色调 */
  title: string;
  tone: 'info' | 'error' | 'success';
  /** assistant：有序片段 */
  segments: Segment[];
  streaming: boolean;
  usage: Usage | null;
}

export interface SessionMeta {
  sessionId: string | null;
  sessionFile: string | null;
  cwd: string | null;
  model: RunModel | null;
  tools: string[];
}

export interface RunView {
  id: string | null;
  prompt: string;
  skill: string | null;
  status: ViewStatus;
  blocks: ChatBlock[];
  artifacts: Artifact[];
  session: SessionMeta | null;
  usage: Usage | null;
  durationMs: number | null;
  error: string | null;
  createdAt: number | null;
  skillLoaded: string | null;
  eventCount: number;
  lastSeq: number;
}

/* ---------------------------------------------------------------- HTTP */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const body = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const detail = body && typeof body['error'] === 'string' ? body['error'] : '';
    throw new Error(detail || `请求失败（HTTP ${response.status}）`);
  }
  return payload as T;
}

export function fetchConfig(): Promise<AppConfig> {
  return request<AppConfig>('/api/config');
}

export async function fetchRuns(): Promise<RunSummary[]> {
  const data = await request<{ runs: RunSummary[] }>('/api/runs');
  return data.runs ?? [];
}

export async function fetchRun(id: string): Promise<RunRecord> {
  const data = await request<{ run: RunRecord }>(`/api/runs/${encodeURIComponent(id)}`);
  return data.run;
}

export async function createRun(prompt: string, skill: string | null): Promise<RunRecord> {
  const data = await request<{ run: RunRecord }>('/api/runs', {
    method: 'POST',
    body: JSON.stringify({ prompt, skill }),
  });
  return data.run;
}

export async function abortRun(id: string): Promise<boolean> {
  const data = await request<{ aborted: boolean }>(`/api/runs/${encodeURIComponent(id)}/abort`, {
    method: 'POST',
  });
  return data.aborted === true;
}

export function fetchArtifact(path: string): Promise<ArtifactContent> {
  return request<ArtifactContent>(`/api/artifacts?path=${encodeURIComponent(path)}`);
}

export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return '无法连接后端（/api 未响应），请确认 server 已启动';
  }
  if (error instanceof Error) {
    return error.message || '请求失败';
  }
  if (typeof error === 'string' && error) return error;
  return '请求失败';
}

/** 把 markdown 里的文件链接规整成工作区相对路径。 */
export function normalizeArtifactPath(href: string, workspace: string): string {
  let value = href.trim();
  if (value.startsWith('file://')) value = decodeURIComponent(value.slice(7));
  value = value.replace(/\\/g, '/');
  const base = workspace.replace(/\\/g, '/').replace(/\/+$/, '');
  if (base && value.toLowerCase().startsWith(base.toLowerCase())) value = value.slice(base.length);
  return value.replace(/^\/+/, '');
}

/* ---------------------------------------------------------------- 小工具 */

let seed = 0;

function nextKey(prefix: string): string {
  seed += 1;
  return `${prefix}-${seed}`;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArtifact(value: unknown): Artifact | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const path = str(raw['path']);
  if (!path) return null;
  return {
    path,
    name: str(raw['name'], path.split('/').pop() ?? path),
    dir: str(raw['dir']),
    kind: asArtifactKind(raw['kind']),
    size: num(raw['size']),
    modifiedAt: num(raw['modifiedAt']),
    origin: raw['origin'] === 'scan' ? 'scan' : 'tool',
  };
}

function asArtifactKind(value: unknown): ArtifactKind {
  return value === 'markdown' || value === 'json' || value === 'csv' || value === 'code' || value === 'text'
    ? value
    : 'text';
}

function asModel(value: unknown): RunModel | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const id = str(raw['id']);
  if (!id) return null;
  return { provider: str(raw['provider']), id, name: str(raw['name'], id) };
}

/** pi 的 cost 可能是数字，也可能是 { total } 对象；历史记录里两种都出现过。 */
export function normalizeUsage(value: unknown): Usage | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const cost = raw['cost'];
  const costValue =
    typeof cost === 'number' ? cost : typeof cost === 'object' && cost ? num((cost as Record<string, unknown>)['total']) : 0;
  return {
    input: num(raw['input']),
    output: num(raw['output']),
    cacheRead: num(raw['cacheRead']),
    totalTokens: num(raw['totalTokens']),
    cost: costValue,
  };
}

function addUsage(total: Usage | null, next: Usage | null): Usage | null {
  if (!next) return total;
  if (!total) return next;
  return {
    input: total.input + next.input,
    output: total.output + next.output,
    cacheRead: total.cacheRead + next.cacheRead,
    totalTokens: total.totalTokens + next.totalTokens,
    cost: total.cost + next.cost,
  };
}

function mergeArtifact(list: Artifact[], artifact: Artifact): Artifact[] {
  const index = list.findIndex((item) => item.path === artifact.path);
  if (index === -1) return [...list, artifact];
  const next = list.slice();
  next[index] = { ...list[index], ...artifact };
  return next;
}

export function formatBytes(bytes: number | null | undefined): string {
  const value = typeof bytes === 'number' && Number.isFinite(bytes) ? bytes : 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes} 分 ${seconds} 秒`;
}

export function formatTokens(usage: Usage | null | undefined): string {
  if (!usage || !usage.totalTokens) return '—';
  return usage.totalTokens.toLocaleString('en-US');
}

export function formatCost(usage: Usage | null | undefined): string {
  if (!usage || !usage.totalTokens) return '—';
  return `$${usage.cost.toFixed(4)}`;
}

export function shortPrompt(prompt: string, limit = 42): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit)}…` : clean;
}

/* ---------------------------------------------------------------- 视图构造 */

function userBlock(text: string, skill: string | null): ChatBlock {
  return {
    kind: 'user',
    key: nextKey('user'),
    text,
    skill,
    title: '',
    tone: 'info',
    segments: [],
    streaming: false,
    usage: null,
  };
}

function assistantBlock(): ChatBlock {
  return {
    kind: 'assistant',
    key: nextKey('assistant'),
    text: '',
    skill: null,
    title: '',
    tone: 'info',
    segments: [],
    streaming: true,
    usage: null,
  };
}

export function noticeBlock(tone: ChatBlock['tone'], title: string, detail?: string): ChatBlock {
  return {
    kind: 'notice',
    key: nextKey('notice'),
    text: detail ?? '',
    skill: null,
    title,
    tone,
    segments: [],
    streaming: false,
    usage: null,
  };
}

export function emptyView(): RunView {
  return {
    id: null,
    prompt: '',
    skill: null,
    status: 'idle',
    blocks: [],
    artifacts: [],
    session: null,
    usage: null,
    durationMs: null,
    error: null,
    createdAt: null,
    skillLoaded: null,
    eventCount: 0,
    lastSeq: 0,
  };
}

export function startView(prompt: string, skill: string | null, id: string | null): RunView {
  return {
    ...emptyView(),
    id,
    prompt,
    skill,
    status: 'running',
    createdAt: Date.now(),
    blocks: [userBlock(prompt, skill)],
  };
}

export function lastSeqOf(record: RunRecord): number {
  let last = 0;
  for (const event of record.events ?? []) {
    if (typeof event.seq === 'number' && event.seq > last) last = event.seq;
  }
  return last;
}

function lastAssistantIndex(blocks: ChatBlock[]): number {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    if (blocks[index]?.kind === 'assistant') return index;
  }
  return -1;
}

function updateLastAssistant(view: RunView, update: (block: ChatBlock) => ChatBlock): RunView {
  const blocks = view.blocks.slice();
  let index = lastAssistantIndex(blocks);
  if (index === -1) {
    blocks.push(assistantBlock());
    index = blocks.length - 1;
  }
  blocks[index] = update(blocks[index] as ChatBlock);
  return { ...view, blocks };
}

function appendSegment(view: RunView, kind: 'text' | 'thinking', text: string): RunView {
  return updateLastAssistant(view, (block) => {
    const segments = block.segments.slice();
    const last = segments.length > 0 ? segments[segments.length - 1] : null;
    if (last && last.kind === kind) {
      segments[segments.length - 1] = { ...last, text: last.text + text };
    } else {
      segments.push({ key: nextKey(kind), kind, text, tool: null });
    }
    return { ...block, segments };
  });
}

function pushTool(view: RunView, tool: ToolView): RunView {
  return updateLastAssistant(view, (block) => ({
    ...block,
    segments: [...block.segments, { key: nextKey('tool'), kind: 'tool', text: '', tool }],
  }));
}

function patchTool(view: RunView, id: string, patch: Partial<ToolView>): RunView {
  const blocks = view.blocks.slice();
  for (let blockIndex = blocks.length - 1; blockIndex >= 0; blockIndex -= 1) {
    const block = blocks[blockIndex];
    if (!block || block.kind !== 'assistant') continue;
    for (let segIndex = block.segments.length - 1; segIndex >= 0; segIndex -= 1) {
      const segment = block.segments[segIndex];
      if (!segment || !segment.tool || segment.tool.id !== id) continue;
      const segments = block.segments.slice();
      segments[segIndex] = { ...segment, tool: { ...segment.tool, ...patch } };
      blocks[blockIndex] = { ...block, segments };
      return { ...view, blocks };
    }
  }
  return view;
}

/* ---------------------------------------------------------------- 事件归约 */

export function applyEvent(view: RunView, event: RunEvent): RunView {
  const data = record(event.data);
  let next: RunView = {
    ...view,
    eventCount: view.eventCount + 1,
    lastSeq: Math.max(view.lastSeq, typeof event.seq === 'number' ? event.seq : 0),
  };

  switch (event.type) {
    case 'session_created': {
      const tools = Array.isArray(data['tools'])
        ? data['tools'].filter((item): item is string => typeof item === 'string')
        : [];
      next = {
        ...next,
        session: {
          sessionId: str(data['sessionId']) || null,
          sessionFile: str(data['sessionFile']) || null,
          cwd: str(data['cwd']) || null,
          model: asModel(data['model']),
          tools,
        },
      };
      break;
    }
    case 'skill_loaded': {
      next = { ...next, skillLoaded: str(data['skill']) || null };
      break;
    }
    case 'assistant_start': {
      const blocks = next.blocks.slice();
      const index = lastAssistantIndex(blocks);
      const current = index >= 0 ? blocks[index] : null;
      if (!current || !current.streaming || current.segments.length > 0) {
        blocks.push(assistantBlock());
        next = { ...next, blocks };
      }
      break;
    }
    case 'text': {
      const text = str(data['text']);
      if (text) next = appendSegment(next, 'text', text);
      break;
    }
    case 'thinking': {
      const text = str(data['text']);
      if (text) next = appendSegment(next, 'thinking', text);
      break;
    }
    case 'tool_call': {
      const id = str(data['id']);
      next = pushTool(next, {
        id,
        name: str(data['name'], 'tool'),
        label: str(data['label']) || str(data['name'], 'tool'),
        title: str(data['title']),
        args: record(data['args']),
        status: 'running',
        preview: '',
        durationMs: null,
      });
      break;
    }
    case 'tool_result': {
      const id = str(data['id']);
      if (!id) break;
      next = patchTool(next, id, {
        status: data['isError'] === true ? 'error' : 'done',
        preview: str(data['preview']),
        durationMs: typeof data['durationMs'] === 'number' ? data['durationMs'] : null,
      });
      break;
    }
    case 'assistant_end': {
      const usage = normalizeUsage(data['usage']);
      const fallback = str(data['text']);
      next = updateLastAssistant(next, (block) => ({
        ...block,
        streaming: false,
        usage: usage ?? block.usage,
      }));
      const hasText = next.blocks.some(
        (block) => block.kind === 'assistant' && block.segments.some((segment) => segment.kind === 'text'),
      );
      if (fallback && !hasText) next = appendSegment(next, 'text', fallback);
      next = { ...next, usage: addUsage(next.usage, usage) };
      break;
    }
    case 'artifact': {
      const artifact = asArtifact(data['artifact']);
      if (artifact) next = { ...next, artifacts: mergeArtifact(next.artifacts, artifact) };
      break;
    }
    case 'error': {
      const message = str(data['message'], '未知错误');
      next = {
        ...next,
        status: 'failed',
        error: message,
        blocks: [...next.blocks.map((block) => ({ ...block, streaming: false })), noticeBlock('error', '运行失败', message)],
      };
      break;
    }
    case 'retry': {
      if (data['phase'] === 'start') {
        const attempt = num(data['attempt']);
        const max = num(data['maxAttempts']);
        next = {
          ...next,
          blocks: [
            ...next.blocks,
            noticeBlock(
              'info',
              max > 0 ? `自动重试 ${attempt}/${max}` : '自动重试',
              typeof data['errorMessage'] === 'string' ? data['errorMessage'] : undefined,
            ),
          ],
        };
      }
      break;
    }
    case 'run_end': {
      const raw = Array.isArray(data['artifacts']) ? data['artifacts'] : [];
      let artifacts = next.artifacts;
      for (const item of raw) {
        const artifact = asArtifact(item);
        if (artifact) artifacts = mergeArtifact(artifacts, artifact);
      }
      const status = data['status'];
      next = {
        ...next,
        status:
          status === 'running' || status === 'succeeded' || status === 'failed' || status === 'aborted'
            ? status
            : 'succeeded',
        usage: normalizeUsage(data['usage']) ?? next.usage,
        durationMs: typeof data['durationMs'] === 'number' ? data['durationMs'] : next.durationMs,
        error: typeof data['error'] === 'string' && data['error'] ? data['error'] : next.error,
        artifacts,
        blocks: next.blocks.map((block) => (block.kind === 'assistant' ? { ...block, streaming: false } : block)),
      };
      break;
    }
    default:
      break;
  }
  return next;
}

export function viewFromRecord(record: RunRecord): RunView {
  let view: RunView = startView(record.prompt, record.skill, record.id);
  view = {
    ...view,
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : Date.now(),
    error: typeof record.error === 'string' && record.error ? record.error : null,
    artifacts: Array.isArray(record.artifacts)
      ? record.artifacts.map(asArtifact).filter((item): item is Artifact => item !== null)
      : [],
    session: {
      sessionId: record.sessionId ?? null,
      sessionFile: record.sessionFile ?? null,
      cwd: record.cwd ?? null,
      model: record.model ?? null,
      tools: [],
    },
  };
  for (const event of record.events ?? []) {
    if (event.type === 'prompt_sent') continue;
    view = applyEvent(view, event);
  }
  // 记录里的用量是权威值：事件流的累加可能只覆盖最后一轮
  view = {
    ...view,
    usage: normalizeUsage(record.usage) ?? view.usage,
    durationMs: typeof record.durationMs === 'number' ? record.durationMs : view.durationMs,
    lastSeq: lastSeqOf(record),
  };
  if (record.status !== 'running') {
    view = { ...view, status: record.status };
    const hasNotice = view.blocks.some((block) => block.kind === 'notice');
    if (view.error && !hasNotice) {
      view = { ...view, blocks: [...view.blocks, noticeBlock('error', '运行失败', view.error)] };
    }
  }
  return view;
}
