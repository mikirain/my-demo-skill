# BidScope · 海外投标竞品标书分析工作台

Angular 22 产品演示，内置 **AI 助手**：前端聊天、后端基于 pi SDK（`@earendil-works/pi-coding-agent`）每轮新建会话并加载 skill（默认 `retro` 中标复盘），执行过程既流式回传页面，也直接打印在启动后端的终端里，技能产出的文件在页面里变成可点开的卡片。

```
浏览器（Angular 22 · hash 路由 · 信号 + OnPush）
   │  POST /api/runs {prompt, skill}
   ├──────────────────────────────► Express（server/）
   │                                   createAgentSession()      ← pi SDK，每轮一个会话
   │                                   /skill:retro <prompt>     ← 技能注入（.agents/skills）
   ▼                                   AgentSession ── 文本/思考/工具/产物 ──► 终端
SSE /api/runs/:id/events ──────────────┘                                  └──► 页面逐条渲染
```

## 启动

```bash
npm install

# 全栈：构建 Angular → 后端同源托管（推荐，一个终端里能同时看到页面与执行过程）
npm start                 # http://localhost:8787

# 只起后端（dist 已存在时最快）
npm run server

# 热更新开发：后端 8787 + ng serve 4200（/api 走 proxy.conf.json 代理）
npm run dev
```

| 命令 | 作用 |
| --- | --- |
| `npm start` | `ng build` 后启动后端，`http://localhost:8787` |
| `npm run server` | 只启动后端（pi SDK + 托管已有 dist） |
| `npm run dev` | 后端 + `ng serve` 并行，前端改代码热更新 |
| `npm run web` | 只启动 `ng serve`（4200，`/api` 代理到 8787） |
| `npm run build` | `ng build` → `dist/mydemo/browser` |
| `npm run typecheck` | 前端 + 后端（`server/tsconfig.json`）类型检查 |
| `npm test` | `ng test`（vitest + jsdom） |

双击 `start-console.cmd`（已 `chcp 65001`）可开一个独立的 UTF-8 后端窗口，页面用 `http://localhost:8787/#/assistant`，中文不会乱码。

VS Code：`F5` 里提供三个配置——「AI 助手（后端托管）」「全栈（build + 后端）」「前端 dev（ng serve）」，前者会先起后端任务（输出就在集成终端）再打开 `#/assistant`。

要求：Node ≥ 22、Python 3.10+（retro skill 的脚本）、pi 已登录可用模型（复用 `~/.pi/agent` 的配置与凭据）。

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8787` | 后端端口 |
| `PI_WORKSPACE` | `mydemo/..` | agent 工作目录；需包含 `.agents/skills/<name>/SKILL.md` |
| `PI_DEFAULT_SKILL` | `retro` | 默认选中技能 |
| `SIT_LOG` | 开 | `quiet` 关闭后端终端输出 |

## AI 助手（`#/assistant`）

- **每轮一个新会话**：`POST /api/runs` → `createAgentSession()`，会话 JSONL 落在 `.data/sessions/`，不污染全局 pi 会话目录。
- **技能可选**：chips 来自工作区的 `.agents/skills`，选中即以 `/skill:<name> <prompt>` 注入（强制加载技能全文）；「无技能」则直接对话。
- **消息富内容**：Markdown（标题、列表、表格、代码块、引用、链接）、思考过程可折叠、工具调用卡片（参数 / 结果预览 / 状态 / 耗时）、产物卡片可点开查看文件内容。
- **右栏运行详情**：状态、用时、token、成本、工具次数、事件数、pi session、模型、技能、工具集、产物；下方运行历史可点开回看并完整重放。
- **终端同步**：同一份事件流也打印到启动后端的终端（问题 → 每一步执行 → 答案原文 → 用量汇总），`SIT_LOG=quiet` 可关闭。

## 后端（`server/`）

```
server/
├── package.json        {"type":"module"}，让 tsx 以 ESM 运行
├── tsconfig.json       后端独立类型检查（npm run typecheck 的第二段）
└── src
    ├── index.ts        Express 路由 + SSE + 托管 dist/mydemo/browser
    ├── runner.ts       RunManager：建会话、注入技能、事件归一化、落盘
    ├── terminal.ts     终端输出：问题、执行步骤、结果原文
    ├── skills.ts       DefaultResourceLoader 封装（技能发现）
    ├── artifacts.ts    产物识别（write/edit 钩子 + 运行后文件扫描）
    └── config.ts       路径、端口、工作区、dist 位置
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查（工作区） |
| GET | `/api/config` | 工作区、技能列表、默认技能、模型 |
| GET | `/api/runs` | 运行历史摘要 |
| POST | `/api/runs` | 新建会话并启动：`{ prompt, skill }` |
| GET | `/api/runs/:id` | 运行记录（含事件，可重放） |
| GET | `/api/runs/:id/events?after=N` | SSE 事件流（`event: done` 结束） |
| POST | `/api/runs/:id/abort` | 中止当前运行 |
| GET | `/api/artifacts?path=<相对路径>` | 读取产物内容（限定工作区内） |

- 运行记录：`.data/runs/<id>.json` + `index.json`，最多保留 40 条。
- `dist/mydemo/browser` 存在时后端同源托管；不存在则只提供 `/api` 并在启动日志里提示先构建。

## 产品页面

`#/dashboard`、`#/projects`、`#/projects/:id/{overview,documents,document-view,parameters,comparison,insights,reviews,reports}`、`#/library`、`#/retro`、`#/experience`、`#/match`、`#/admin`、`#/assistant`。

除 AI 助手外均为演示数据（`src/app/core/mock/*`），侧栏标注「演示数据 · 非真实企业信息」。

## 换成别的技能

把技能目录放进 `<工作区>/.agents/skills/<name>/SKILL.md`，重启后端即可在技能 chips 里选到，无需改代码；默认选中用 `PI_DEFAULT_SKILL`。

## SDK 连通性自检

`scripts/smoke.ts`（源自原 `sit2` 版本，已并入）验证本机能建 pi 会话、发现工作区技能，并可选择性地跑一次真实请求：

```bash
npm run smoke        # 只建会话 + 发现技能
npm run smoke -- --ask   # 再发一次真实 prompt
```

## 已知边界

- 只有本机演示，没有账号体系；运行记录与产物都落在本机 `.data/` 与工作区。
- 产物预览上限 400 KB 文本，二进制文件不预览。
- 模型来自 `pi` 已配置的凭据（`~/.pi/agent/settings.json` / `models.json`），页面内不提供切换。
