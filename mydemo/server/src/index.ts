import fs from "node:fs";
import path from "node:path";
import express from "express";
import {
  createAgentSession,
  SessionManager,
  type AgentSession,
} from "@earendil-works/pi-coding-agent";
import { DEFAULT_SKILL, PORT, WEB_DIST, WORKSPACE } from "./config.js";
import { discoverSkills } from "./skills.js";
import { RunManager, type RunModel, type RunRecord } from "./runner.js";
import { readArtifact } from "./artifacts.js";

const app = express();
const manager = new RunManager();

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, workspace: WORKSPACE });
});

let modelProbe: Promise<RunModel | null> | null = null;

/** Resolves the model the SDK would pick, without keeping a session open. */
function probeModel(): Promise<RunModel | null> {
  modelProbe ??= (async () => {
    let session: AgentSession | undefined;
    try {
      const created = await createAgentSession({
        cwd: WORKSPACE,
        sessionManager: SessionManager.inMemory(WORKSPACE),
        noTools: "all",
      });
      session = created.session;
      const model = session.model;
      return model
        ? { provider: model.provider, id: model.id, name: model.name ?? model.id }
        : null;
    } catch {
      return null;
    } finally {
      try {
        session?.dispose();
      } catch {
        /* ignore */
      }
    }
  })();
  return modelProbe;
}

app.get("/api/config", async (_req, res, next) => {
  try {
    const { skills, diagnostics } = await discoverSkills();
    const hasDefault = skills.some((skill) => skill.name === DEFAULT_SKILL);
    res.json({
      workspace: WORKSPACE,
      defaultSkill: hasDefault ? DEFAULT_SKILL : (skills[0]?.name ?? null),
      skills,
      diagnostics,
      model: await probeModel(),
      sdk: { package: "@earendil-works/pi-coding-agent" },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/runs", (_req, res) => {
  res.json({ runs: manager.list() });
});

app.post("/api/runs", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    res.status(400).json({ error: "prompt 不能为空" });
    return;
  }
  if (prompt.length > 20_000) {
    res.status(413).json({ error: "prompt 过长（上限 20000 字符）" });
    return;
  }
  const rawSkill = req.body?.skill;
  const skill = rawSkill === null ? null : String(rawSkill ?? DEFAULT_SKILL).trim() || null;
  const record: RunRecord = manager.create({ prompt, skill });
  res.status(201).json({ run: serializeRecord(record) });
});

app.get("/api/runs/:id", async (req, res, next) => {
  try {
    const record = await manager.record(req.params.id);
    if (!record) {
      res.status(404).json({ error: "run not found" });
      return;
    }
    res.json({ run: serializeRecord(record) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/runs/:id/abort", async (req, res) => {
  const ok = await manager.abort(req.params.id);
  res.json({ aborted: ok });
});

/** Server-sent events: replays the run log from `after`, then streams live. */
app.get("/api/runs/:id/events", async (req, res, next) => {
  try {
    const id = req.params.id;
    const after = Number.parseInt(String(req.query.after ?? "0"), 10) || 0;
    const live = manager.getLive(id);
    const record = live ? null : await manager.record(id);
    if (!live && !record) {
      res.status(404).json({ error: "run not found" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    const send = (event: unknown) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const replayEvents = live ? live.events : record!.events;
    for (const event of replayEvents) {
      if (event.seq > after) send(event);
    }

    if (!live) {
      res.write("event: done\ndata: {}\n\n");
      res.end();
      return;
    }

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(ping);
      unsubscribe();
      res.end();
    };

    const unsubscribe = manager.subscribe(id, (event) => {
      send(event);
      if (event.type === "run_end") {
        res.write("event: done\ndata: {}\n\n");
        cleanup();
      }
    });

    const ping = setInterval(() => {
      if (!closed) res.write(": keep-alive\n\n");
    }, 15_000);

    if (live.status !== "running") {
      res.write("event: done\ndata: {}\n\n");
      cleanup();
      return;
    }

    req.on("close", () => {
      if (closed) return;
      closed = true;
      clearInterval(ping);
      unsubscribe();
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/artifacts", async (req, res, next) => {
  try {
    const relative = String(req.query.path ?? "");
    if (!relative) {
      res.status(400).json({ error: "path 不能为空" });
      return;
    }
    res.json(await readArtifact(relative));
  } catch (error) {
    next(error);
  }
});

if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(WEB_DIST, "index.html"));
  });
}

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof error?.status === "number" ? error.status : 500;
  console.error("[bidscope]", error);
  res.status(status).json({ error: error?.message ?? "internal error" });
});

function serializeRecord(record: RunRecord) {
  return {
    id: record.id,
    prompt: record.prompt,
    skill: record.skill,
    status: record.status,
    createdAt: record.createdAt,
    startedAt: record.startedAt ?? null,
    endedAt: record.endedAt ?? null,
    durationMs: record.durationMs ?? null,
    sessionId: record.sessionId ?? null,
    sessionFile: record.sessionFile ?? null,
    cwd: record.cwd,
    model: record.model ?? null,
    usage: record.usage ?? null,
    artifacts: record.artifacts,
    events: record.events,
    error: record.error ?? null,
    live: manager.getLive(record.id) !== undefined,
  };
}

await manager.init();
app.listen(PORT, () => {
  console.log(`[bidscope] AI 助手后端 listening on http://localhost:${PORT}`);
  console.log(`[bidscope] workspace: ${WORKSPACE}`);
  console.log(`[bidscope] 这个终端会实时打印每轮的问题、执行步骤与结果`);
  if (!fs.existsSync(WEB_DIST)) {
    console.log(`[bidscope] 前端尚未构建（${WEB_DIST}），先执行 npm run build 或改用 npm run dev`);
  }
});
