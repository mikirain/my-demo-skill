import fs from "node:fs/promises";
import path from "node:path";
import { WORKSPACE } from "./config.js";

export type ArtifactKind = "markdown" | "json" | "csv" | "code" | "text";

export interface Artifact {
  path: string;
  name: string;
  dir: string;
  kind: ArtifactKind;
  size: number;
  modifiedAt: number;
  origin: "tool" | "scan";
}

const KIND_BY_EXT = new Map<string, ArtifactKind>([
  [".md", "markdown"],
  [".json", "json"],
  [".csv", "csv"],
  [".jsonl", "json"],
  [".txt", "text"],
  [".log", "text"],
  [".yaml", "text"],
  [".yml", "text"],
  [".py", "code"],
  [".ts", "code"],
  [".js", "code"],
  [".mjs", "code"],
  [".html", "code"],
  [".css", "code"],
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".angular",
  ".data",
  "dist",
  ".venv",
  "venv",
  "__pycache__",
  "coverage",
  ".sass-cache",
  ".agents",
]);

const MAX_ARTIFACT_BYTES = 2_000_000;
const MAX_ARTIFACTS = 30;

export function kindForPath(filePath: string): ArtifactKind | null {
  return KIND_BY_EXT.get(path.extname(filePath).toLowerCase()) ?? null;
}

export function isSafeWorkspacePath(relativePath: string): boolean {
  if (!relativePath || path.isAbsolute(relativePath)) return false;
  const resolved = path.resolve(WORKSPACE, relativePath);
  return resolved === WORKSPACE || resolved.startsWith(WORKSPACE + path.sep);
}

export function toRelative(absolutePath: string): string {
  return path.relative(WORKSPACE, absolutePath).split(path.sep).join("/");
}

async function describe(absolutePath: string, origin: Artifact["origin"]): Promise<Artifact | null> {
  const kind = kindForPath(absolutePath);
  if (!kind) return null;
  const stat = await fs.stat(absolutePath).catch(() => null);
  if (!stat?.isFile() || stat.size > MAX_ARTIFACT_BYTES) return null;
  const relative = toRelative(absolutePath);
  if (relative.startsWith("..")) return null;
  return {
    path: relative,
    name: path.basename(absolutePath),
    dir: path.dirname(relative) === "." ? "" : path.dirname(relative),
    kind,
    size: stat.size,
    modifiedAt: stat.mtimeMs,
    origin,
  };
}

/** Turns a tool argument path (absolute or workspace-relative) into an artifact. */
export async function artifactFromToolPath(input: unknown): Promise<Artifact | null> {
  if (typeof input !== "string" || !input.trim()) return null;
  const absolute = path.isAbsolute(input) ? input : path.resolve(WORKSPACE, input);
  if (!absolute.startsWith(WORKSPACE + path.sep)) return null;
  return describe(absolute, "tool");
}

/**
 * Finds files the run touched: creation often happens through `bash` (python scripts),
 * so the write/edit hook alone is not enough. Bounded depth keeps node_modules out.
 */
export async function scanArtifactsSince(since: number, depthLimit = 5): Promise<Artifact[]> {
  const found: Artifact[] = [];
  const skipDirs = SKIP_DIRS;

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > depthLimit) return;
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => null);
    if (!entries) return;
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
        await walk(absolute, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!kindForPath(entry.name)) continue;
      const artifact = await describe(absolute, "scan");
      if (artifact && artifact.modifiedAt >= since) found.push(artifact);
    }
  }

  await walk(WORKSPACE, 0);
  return found;
}

export function mergeArtifacts(...groups: Artifact[][]): Artifact[] {
  const byPath = new Map<string, Artifact>();
  for (const group of groups) {
    for (const artifact of group) {
      const existing = byPath.get(artifact.path);
      if (!existing) {
        byPath.set(artifact.path, artifact);
        continue;
      }
      byPath.set(artifact.path, {
        ...existing,
        ...artifact,
        origin: existing.origin === "tool" || artifact.origin === "tool" ? "tool" : "scan",
        modifiedAt: Math.max(existing.modifiedAt, artifact.modifiedAt),
      });
    }
  }
  return [...byPath.values()]
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, MAX_ARTIFACTS);
}

export async function readArtifact(relativePath: string): Promise<{
  path: string;
  kind: ArtifactKind | "binary";
  size: number;
  content: string;
  truncated: boolean;
}> {
  if (!isSafeWorkspacePath(relativePath)) {
    throw Object.assign(new Error("path outside workspace"), { status: 400 });
  }
  const absolute = path.resolve(WORKSPACE, relativePath);
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat?.isFile()) {
    throw Object.assign(new Error("file not found"), { status: 404 });
  }
  const kind = kindForPath(absolute);
  if (!kind) {
    return { path: relativePath, kind: "binary", size: stat.size, content: "", truncated: false };
  }
  const buffer = await fs.readFile(absolute);
  const text = buffer.subarray(0, Math.min(buffer.length, 400_000)).toString("utf8");
  return {
    path: relativePath,
    kind,
    size: stat.size,
    content: text,
    truncated: buffer.length > 400_000,
  };
}
