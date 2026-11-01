import type { RunEvent } from "./runner.js";

/**
 * Mirrors the run transcript that the web client renders onto the server terminal:
 * assistant markdown, thinking size, tool calls and their results, artifacts, usage.
 * Set `SIT_LOG=quiet` to silence it.
 */
export interface RunHead {
  id: string;
  skill: string | null;
  prompt: string;
}

const LEVEL = String(process.env.SIT_LOG ?? "").toLowerCase();
const enabled = !["0", "off", "quiet", "false"].includes(LEVEL);
const color =
  Boolean(process.stdout.isTTY) && !process.env.NO_COLOR && process.env.TERM !== "dumb";

function paint(code: string, text: string): string {
  return color ? `\u001b[${code}m${text}\u001b[0m` : text;
}

const dim = (text: string) => paint("2", text);
const bold = (text: string) => paint("1", text);
const cyan = (text: string) => paint("36", text);
const green = (text: string) => paint("32", text);
const red = (text: string) => paint("31", text);
const yellow = (text: string) => paint("33", text);

interface RunState {
  textOpen: boolean;
  thinking: number;
  tools: Map<string, { name: string; title: string }>;
  skills: Set<string>;
}

const states = new Map<string, RunState>();

function tag(id: string): string {
  return dim(`[${id.slice(0, 8)}]`);
}

function write(line: string): void {
  process.stdout.write(`${line}\n`);
}

function oneLine(value: string, limit = 160): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/** The question itself, kept multi-line so a long task stays readable in one block. */
function questionBlock(id: string, prompt: string, maxLines = 8, maxChars = 1600): string[] {
  const text = prompt.replace(/\r\n/g, "\n").trim();
  const clipped = text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  const lines = clipped.split("\n").map((line) => line.trim()).filter(Boolean);
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) shown.push(`…（共 ${lines.length} 行）`);
  return shown.map(
    (line, index) => `${tag(id)} ${index === 0 ? dim("prompt") : "      "} ${oneLine(line, 300)}`,
  );
}

function stateFor(id: string): RunState {
  let state = states.get(id);
  if (!state) {
    state = { textOpen: false, thinking: 0, tools: new Map(), skills: new Set() };
    states.set(id, state);
  }
  return state;
}

function closeText(state: RunState): void {
  if (state.textOpen) {
    process.stdout.write("\n");
    state.textOpen = false;
  }
}

export function logRunStart(run: RunHead): void {
  if (!enabled) return;
  states.set(run.id, { textOpen: false, thinking: 0, tools: new Map(), skills: new Set() });
  write("");
  write(`${tag(run.id)} ${bold("run")} ${dim("skill=")}${run.skill ?? "无"}`);
  for (const line of questionBlock(run.id, run.prompt)) write(line);
}

export function logRunEvent(run: RunHead, event: RunEvent): void {
  if (!enabled) return;
  const state = stateFor(run.id);
  const data = event.data ?? {};

  switch (event.type) {
    case "session_created": {
      const model = data.model as { provider?: string; id?: string } | null;
      write(
        `${tag(run.id)} ${dim("session")} ${String(data.sessionId ?? "—")} ${dim("model")} ${
          model ? `${model.provider}/${model.id}` : "—"
        }`,
      );
      const tools = Array.isArray(data.tools) ? (data.tools as string[]).join(", ") : "";
      if (tools) write(`${tag(run.id)} ${dim("tools")} ${tools}`);
      if (data.sessionFile) write(`${tag(run.id)} ${dim("file")} ${String(data.sessionFile)}`);
      break;
    }
    case "skill_loaded": {
      const name = String(data.skill ?? "");
      if (!name || state.skills.has(name)) break;
      state.skills.add(name);
      write(`${tag(run.id)} ${dim("skill loaded")} ${name}`);
      break;
    }
    case "thinking": {
      state.thinking += String(data.text ?? "").length;
      break;
    }
    case "text": {
      const text = String(data.text ?? "");
      if (!text) break;
      if (!state.textOpen) {
        closeText(state);
        write(`${tag(run.id)} ${cyan("assistant")}`);
        state.textOpen = true;
      }
      process.stdout.write(text);
      break;
    }
    case "assistant_end": {
      closeText(state);
      if (state.thinking > 0) {
        write(`${tag(run.id)} ${dim(`thinking ${state.thinking} 字`)}`);
        state.thinking = 0;
      }
      break;
    }
    case "tool_call": {
      closeText(state);
      state.tools.set(String(data.id ?? ""), {
        name: String(data.name ?? "tool"),
        title: String(data.title ?? ""),
      });
      write(`${tag(run.id)} ${cyan("->")} ${String(data.name ?? "")} ${dim(oneLine(String(data.title ?? "")))}`);
      break;
    }
    case "tool_result": {
      const tool = state.tools.get(String(data.id ?? ""));
      const duration =
        typeof data.durationMs === "number" ? `${Math.round(data.durationMs)} ms` : "";
      const name = tool?.name ?? String(data.name ?? "");
      const status = data.isError ? red("failed") : green("ok");
      write(`${tag(run.id)}    ${status} ${dim(`${name} ${duration}`.trim())}`);
      const preview = oneLine(String(data.preview ?? ""), 160);
      if (preview) write(`${tag(run.id)}      ${dim(preview)}`);
      break;
    }
    case "artifact": {
      const artifact = data.artifact as { path?: string } | undefined;
      if (artifact?.path) write(`${tag(run.id)} ${yellow("+")} ${artifact.path}`);
      break;
    }
    case "error": {
      closeText(state);
      write(`${tag(run.id)} ${red("error")} ${String(data.message ?? "")}`);
      break;
    }
    case "retry": {
      if (data.phase === "start") {
        write(`${tag(run.id)} ${yellow("retry")} ${String(data.attempt ?? "")}/${String(data.maxAttempts ?? "")}`);
      }
      break;
    }
    case "run_end": {
      closeText(state);
      const status = String(data.status ?? "");
      const usage = data.usage as { totalTokens?: number; cost?: number } | null;
      const artifacts = Array.isArray(data.artifacts) ? data.artifacts.length : 0;
      const parts = [
        `${Math.round(Number(data.durationMs ?? 0) / 100) / 10} s`,
        usage?.totalTokens ? `${Number(usage.totalTokens).toLocaleString("en-US")} tok` : "0 tok",
        usage?.cost ? `$${Number(usage.cost).toFixed(4)}` : "$0.0000",
        `${artifacts} 文件`,
      ];
      const label =
        status === "succeeded" ? green("done") : status === "failed" ? red("failed") : yellow("aborted");
      write(`${tag(run.id)} ${label} ${dim(parts.join(" · "))}`);
      if (data.error) write(`${tag(run.id)} ${red("error")} ${String(data.error)}`);
      states.delete(run.id);
      break;
    }
    default:
      break;
  }
}
