import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  createAgentSession,
  SessionManager,
  type AgentSession,
  type AgentSessionEvent,
} from "@earendil-works/pi-coding-agent";
import { MAX_RUN_HISTORY, RUNS_DIR, SESSIONS_DIR, WORKSPACE } from "./config.js";
import { createResourceLoader } from "./skills.js";
import { logRunEvent, logRunStart } from "./terminal.js";
import {
  artifactFromToolPath,
  mergeArtifacts,
  scanArtifactsSince,
  type Artifact,
} from "./artifacts.js";

export type RunStatus = "running" | "succeeded" | "failed" | "aborted";

export interface RunEvent {
  seq: number;
  ts: number;
  type: string;
  data?: Record<string, unknown>;
}

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  totalTokens: number;
  cost: number;
}

export interface RunModel {
  provider: string;
  id: string;
  name: string;
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

interface LiveRun extends RunRecord {
  listeners: Set<(event: RunEvent) => void>;
  abortRequested: boolean;
  toolArgs: Map<string, { name: string; args: Record<string, unknown> }>;
  sentArtifacts: Set<string>;
  usageAcc: Usage;
  session?: AgentSession;
}

const TOOL_LABELS: Record<string, string> = {
  read: "读取文件",
  write: "写入文件",
  edit: "编辑文件",
  bash: "执行命令",
  ls: "列出目录",
  grep: "搜索内容",
  find: "查找文件",
};

function emptyUsage(): Usage {
  return { input: 0, output: 0, cacheRead: 0, totalTokens: 0, cost: 0 };
}

function addUsage(total: Usage, usage: any): Usage {
  if (!usage) return total;
  const cost =
    typeof usage.cost === "number" ? usage.cost : (usage.cost?.total ?? 0);
  return {
    input: total.input + (usage.input ?? 0),
    output: total.output + (usage.output ?? 0),
    cacheRead: total.cacheRead + (usage.cacheRead ?? 0),
    totalTokens: total.totalTokens + (usage.totalTokens ?? 0),
    cost: total.cost + cost,
  };
}

function messageText(message: any): string {
  const content = message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block: any) => block?.type === "text" && typeof block.text === "string")
    .map((block: any) => block.text)
    .join("\n");
}

function resultText(result: any): string {
  if (!result) return "";
  if (typeof result === "string") return result;
  const content = result.content;
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (typeof block === "string") return block;
        if (block?.type === "text") return block.text ?? "";
        if (block?.type === "image") return "[image]";
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof result.output === "string") return result.output;
  try {
    return JSON.stringify(result);
  } catch {
    return "";
  }
}

function toolTitle(name: string, args: any): string {
  const value =
    args?.path ?? args?.file_path ?? args?.command ?? args?.pattern ?? args?.query ?? args?.url ?? "";
  const text = typeof value === "string" ? value : "";
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

function describeTool(name: string, args: any): string {
  const target = toolTitle(name, args);
  return target || (TOOL_LABELS[name] ?? name);
}

function trimArgs(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    if (typeof value === "string" && value.length > 4000) out[key] = `${value.slice(0, 4000)}…`;
    else out[key] = value;
  }
  return out;
}

function compactEvents(events: RunEvent[]): RunEvent[] {
  const out: RunEvent[] = [];
  for (const event of events) {
    const previous = out[out.length - 1];
    if (event.type === "text" && previous?.type === "text") {
      out[out.length - 1] = {
        ...event,
        data: { text: `${previous.data?.text ?? ""}${event.data?.text ?? ""}` },
      };
      continue;
    }
    if (event.type === "thinking" && previous?.type === "thinking") {
      out[out.length - 1] = {
        ...event,
        data: { text: `${previous.data?.text ?? ""}${event.data?.text ?? ""}` },
      };
      continue;
    }
    out.push(event);
  }
  return out;
}

function toSummary(record: RunRecord): RunSummary {
  return {
    id: record.id,
    prompt: record.prompt,
    skill: record.skill,
    status: record.status,
    createdAt: record.createdAt,
    endedAt: record.endedAt,
    durationMs: record.durationMs,
    sessionId: record.sessionId,
    model: record.model,
    artifactCount: record.artifacts.length,
    error: record.error,
  };
}

/**
 * Owns one pi `AgentSession` per chat turn: a turn is created against a fresh session,
 * the selected skill is expanded into the prompt, and every pi event is normalized into
 * an ordered event log the web client can replay.
 */
export class RunManager {
  private live = new Map<string, LiveRun>();
  private summaries: RunSummary[] = [];
  private ready: Promise<void> | null = null;

  init(): Promise<void> {
    this.ready ??= this.loadIndex();
    return this.ready;
  }

  private async loadIndex(): Promise<void> {
    await fs.mkdir(RUNS_DIR, { recursive: true });
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
    const raw = await fs.readFile(path.join(RUNS_DIR, "index.json"), "utf8").catch(() => null);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.summaries = parsed;
        return;
      } catch {
        /* fall through to rebuild */
      }
    }
    await this.rebuildIndex();
  }

  private async rebuildIndex(): Promise<void> {
    const files = await fs.readdir(RUNS_DIR).catch(() => [] as string[]);
    const summaries: RunSummary[] = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file === "index.json") continue;
      const raw = await fs.readFile(path.join(RUNS_DIR, file), "utf8").catch(() => null);
      if (!raw) continue;
      try {
        const record = JSON.parse(raw) as RunRecord;
        if (record?.id) summaries.push(toSummary(record));
      } catch {
        /* ignore corrupt records */
      }
    }
    this.summaries = summaries.sort((a, b) => b.createdAt - a.createdAt);
    await this.writeIndex();
  }

  private async writeIndex(): Promise<void> {
    await fs.mkdir(RUNS_DIR, { recursive: true });
    await fs.writeFile(
      path.join(RUNS_DIR, "index.json"),
      JSON.stringify(this.summaries.slice(0, MAX_RUN_HISTORY), null, 2),
      "utf8",
    );
  }

  list(): RunSummary[] {
    const live = [...this.live.values()].map((run) => toSummary(run));
    const liveIds = new Set(live.map((run) => run.id));
    return [...live, ...this.summaries.filter((item) => !liveIds.has(item.id))].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  getLive(id: string): LiveRun | undefined {
    return this.live.get(id);
  }

  private emit(run: LiveRun, type: string, data?: Record<string, unknown>): void {
    const event: RunEvent = { seq: run.events.length + 1, ts: Date.now(), type, data };
    run.events.push(event);
    logRunEvent(run, event);
    for (const listener of run.listeners) {
      try {
        listener(event);
      } catch {
        /* a broken SSE client must not stop the run */
      }
    }
  }

  subscribe(id: string, listener: (event: RunEvent) => void): () => void {
    const run = this.live.get(id);
    if (!run) return () => {};
    run.listeners.add(listener);
    return () => run.listeners.delete(listener);
  }

  async record(id: string): Promise<RunRecord | null> {
    const live = this.live.get(id);
    if (live) return this.toRecord(live);
    const raw = await fs
      .readFile(path.join(RUNS_DIR, `${id}.json`), "utf8")
      .catch(() => null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RunRecord;
    } catch {
      return null;
    }
  }

  private toRecord(run: LiveRun): RunRecord {
    return {
      id: run.id,
      prompt: run.prompt,
      skill: run.skill,
      status: run.status,
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      durationMs: run.endedAt && run.startedAt ? run.endedAt - run.startedAt : undefined,
      sessionId: run.sessionId,
      sessionFile: run.sessionFile,
      cwd: run.cwd,
      model: run.model,
      usage: run.usage,
      artifacts: run.artifacts,
      events: run.events,
      error: run.error,
    };
  }

  create(input: { prompt: string; skill?: string | null }): RunRecord {
    const run: LiveRun = {
      id: randomUUID(),
      prompt: input.prompt,
      skill: input.skill ?? null,
      status: "running",
      createdAt: Date.now(),
      cwd: WORKSPACE,
      artifacts: [],
      events: [],
      listeners: new Set(),
      abortRequested: false,
      toolArgs: new Map(),
      sentArtifacts: new Set(),
      usageAcc: emptyUsage(),
    };
    this.live.set(run.id, run);
    logRunStart(run);
    void this.execute(run);
    return this.toRecord(run);
  }

  async abort(id: string): Promise<boolean> {
    const run = this.live.get(id);
    if (!run?.session) return false;
    run.abortRequested = true;
    try {
      await run.session.abort();
      return true;
    } catch {
      return false;
    }
  }

  private async execute(run: LiveRun): Promise<void> {
    run.startedAt = Date.now();
    const since = run.startedAt;
    let unsubscribe: (() => void) | undefined;

    try {
      const loader = createResourceLoader();
      await loader.reload();
      const discovered = loader.getSkills().skills;
      const available = discovered.map((skill) => skill.name);
      if (run.skill && !available.includes(run.skill)) {
        throw new Error(
          `工作区未发现技能 "${run.skill}"（可用：${available.join("、") || "无"}）`,
        );
      }
      const selected = run.skill ? discovered.find((skill) => skill.name === run.skill) : undefined;

      await fs.mkdir(SESSIONS_DIR, { recursive: true });
      const sessionManager = SessionManager.create(WORKSPACE, SESSIONS_DIR);
      const { session, modelFallbackMessage } = await createAgentSession({
        cwd: WORKSPACE,
        resourceLoader: loader,
        sessionManager,
        tools: ["read", "bash", "edit", "write"],
      });
      run.session = session;
      run.sessionId = session.sessionId;
      run.sessionFile = sessionManager.getSessionFile();
      if (session.model) {
        run.model = {
          provider: session.model.provider,
          id: session.model.id,
          name: session.model.name ?? session.model.id,
        };
      }

      this.emit(run, "session_created", {
        sessionId: run.sessionId,
        sessionFile: run.sessionFile,
        cwd: WORKSPACE,
        skill: run.skill,
        skills: available,
        model: run.model ?? null,
        modelFallbackMessage: modelFallbackMessage ?? null,
        tools: session.getActiveToolNames(),
      });

      unsubscribe = session.subscribe((event) => this.handleAgentEvent(run, event));

      if (selected) {
        this.emit(run, "skill_loaded", {
          skill: selected.name,
          path: selected.filePath,
          description: selected.description,
          forced: true,
        });
      }

      const promptText = run.skill ? `/skill:${run.skill} ${run.prompt}` : run.prompt;
      this.emit(run, "prompt_sent", {
        text: run.prompt,
        skillCommand: run.skill ? `/skill:${run.skill}` : null,
      });
      await session.prompt(promptText);
      await session.waitForIdle().catch(() => {});
      run.status = run.abortRequested ? "aborted" : "succeeded";
    } catch (error) {
      run.status = run.abortRequested ? "aborted" : "failed";
      run.error = error instanceof Error ? error.message : String(error);
      this.emit(run, "error", { message: run.error });
    } finally {
      unsubscribe?.();
      run.session = undefined;
      const scanned = await scanArtifactsSince(since).catch(() => [] as Artifact[]);
      run.artifacts = mergeArtifacts(run.artifacts, scanned);
      for (const artifact of run.artifacts) {
        if (run.sentArtifacts.has(artifact.path)) continue;
        run.sentArtifacts.add(artifact.path);
        this.emit(run, "artifact", { artifact });
      }
      run.usage = run.usageAcc;
      run.endedAt = Date.now();
      run.status = run.status === "running" ? "succeeded" : run.status;
      this.emit(run, "run_end", {
        status: run.status,
        durationMs: run.endedAt - (run.startedAt ?? run.createdAt),
        usage: run.usage,
        artifacts: run.artifacts,
        sessionId: run.sessionId,
        error: run.error ?? null,
      });
      await this.persist(run);
      run.listeners.clear();
    }
  }

  private handleAgentEvent(run: LiveRun, event: AgentSessionEvent): void {
    switch (event.type) {
      case "agent_start":
        this.emit(run, "agent_start");
        break;
      case "turn_start":
        this.emit(run, "turn_start");
        break;
      case "message_start": {
        const message = event.message as any;
        if (message?.role === "assistant") {
          this.emit(run, "assistant_start", { messageId: message.id ?? null });
        }
        break;
      }
      case "message_update": {
        const delta = event.assistantMessageEvent;
        if (delta.type === "text_delta") this.emit(run, "text", { text: delta.delta });
        else if (delta.type === "thinking_delta") this.emit(run, "thinking", { text: delta.delta });
        break;
      }
      case "message_end": {
        const message = event.message as any;
        if (message?.role === "assistant") {
          const raw = message.usage;
          const usage: Usage | null = raw
            ? {
                input: raw.input ?? 0,
                output: raw.output ?? 0,
                cacheRead: raw.cacheRead ?? 0,
                totalTokens: raw.totalTokens ?? 0,
                cost: raw.cost?.total ?? 0,
              }
            : null;
          if (usage) run.usageAcc = addUsage(run.usageAcc, usage);
          this.emit(run, "assistant_end", {
            text: messageText(message),
            usage,
            stopReason: message.stopReason ?? null,
          });
        }
        break;
      }
      case "tool_execution_start": {
        const args = trimArgs(event.args);
        run.toolArgs.set(event.toolCallId, { name: event.toolName, args });
        this.emit(run, "tool_call", {
          id: event.toolCallId,
          name: event.toolName,
          label: TOOL_LABELS[event.toolName] ?? event.toolName,
          title: describeTool(event.toolName, event.args),
          args,
          parentToolCallId: (event as any).parentToolCallId ?? null,
        });
        const readPath = typeof (event.args as any)?.path === "string" ? (event.args as any).path : "";
        if (event.toolName === "read" && /skill\.md$/i.test(readPath)) {
          const segments = readPath.split(/[\\/]/);
          const skillName = segments[segments.length - 2] ?? "skill";
          this.emit(run, "skill_loaded", { skill: skillName, path: readPath });
        }
        break;
      }
      case "tool_execution_end": {
        const known = run.toolArgs.get(event.toolCallId);
        const preview = resultText(event.result).slice(0, 4000);
        this.emit(run, "tool_result", {
          id: event.toolCallId,
          name: event.toolName,
          isError: event.isError,
          durationMs: event.durationMs ?? null,
          preview,
        });
        if ((event.toolName === "write" || event.toolName === "edit") && known) {
          void artifactFromToolPath(known.args.path ?? known.args.file_path).then((artifact) => {
            if (!artifact || run.sentArtifacts.has(artifact.path)) return;
            run.artifacts = mergeArtifacts(run.artifacts, [artifact]);
            run.sentArtifacts.add(artifact.path);
            this.emit(run, "artifact", { artifact });
          });
        }
        break;
      }
      case "turn_end":
        this.emit(run, "turn_end");
        break;
      case "agent_end":
        this.emit(run, "agent_end", { willRetry: (event as any).willRetry ?? false });
        break;
      case "agent_settled":
        this.emit(run, "agent_settled", { aborted: (event as any).aborted ?? false });
        break;
      case "auto_retry_start":
        this.emit(run, "retry", {
          phase: "start",
          attempt: (event as any).attempt,
          maxAttempts: (event as any).maxAttempts,
          errorMessage: (event as any).errorMessage,
        });
        break;
      case "auto_retry_end":
        this.emit(run, "retry", { phase: "end", success: (event as any).success });
        break;
      default:
        break;
    }
  }

  private async persist(run: LiveRun): Promise<void> {
    const record = this.toRecord(run);
    record.events = compactEvents(record.events);
    await fs.mkdir(RUNS_DIR, { recursive: true });
    await fs.writeFile(
      path.join(RUNS_DIR, `${run.id}.json`),
      JSON.stringify(record, null, 2),
      "utf8",
    );
    const summary = toSummary(record);
    this.summaries = [summary, ...this.summaries.filter((item) => item.id !== summary.id)].slice(
      0,
      MAX_RUN_HISTORY,
    );
    await this.writeIndex();
    this.live.delete(run.id);

    const files = (await fs.readdir(RUNS_DIR).catch(() => [] as string[])).filter(
      (file) => file.endsWith(".json") && file !== "index.json",
    );
    const keep = new Set(this.summaries.map((item) => `${item.id}.json`));
    const stale = files.filter((file) => !keep.has(file));
    if (stale.length > 0) {
      await Promise.all(
        stale.map((file) => fs.rm(path.join(RUNS_DIR, file), { force: true }).catch(() => {})),
      );
    }
  }
}
