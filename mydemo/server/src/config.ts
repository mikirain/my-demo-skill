import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** mydemo root (contains package.json, server/, src/, dist/). */
export const APP_ROOT = path.resolve(here, "../..");

/** Workspace the agent runs in; must contain `.agents/skills/<name>/SKILL.md`. */
export const WORKSPACE = path.resolve(process.env.PI_WORKSPACE ?? path.join(APP_ROOT, ".."));

export const PORT = Number(process.env.PORT ?? 8787);

export const DATA_DIR = path.join(APP_ROOT, ".data");
export const RUNS_DIR = path.join(DATA_DIR, "runs");
export const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

/** Angular production build this backend serves at `/`. */
export const WEB_DIST = path.join(APP_ROOT, "dist", "mydemo", "browser");

export const DEFAULT_SKILL = process.env.PI_DEFAULT_SKILL ?? "retro";

/** Max number of persisted runs kept in `.data/runs`. */
export const MAX_RUN_HISTORY = 40;
