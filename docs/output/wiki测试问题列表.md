# Wiki 知识库测试问题列表

> 用于测试 `wiki/` 知识库（由 `docs/pi-docs` 转换而来，遵循 karpathy-llm-wiki 结构）。
> 共 20 个问题，覆盖 5 大维度、20 个不同主题；每题附「出处」（对应 wiki 文章）与「参考答案」，便于验证检索与回答质量。
>
> 链接相对本文件（`docs/output/`），指向 `wiki/` 下对应文章。

## 维度总览

| # | 维度 | 出处文章 |
|---|------|----------|
| 1 | 安装与版本要求 | [Quickstart](../../wiki/getting-started/quickstart.md) |
| 2 | 工作原理 / Agent loop | [How Pi Works](../../wiki/getting-started/how-pi-works.md) |
| 3 | 终端交互 | [Use Pi in the terminal](../../wiki/running-pi/use-pi-in-terminal.md) |
| 4 | 模型选择与连接 | [Choose a Model](../../wiki/running-pi/choose-a-model.md) |
| 5 | 会话管理与分支 | [Sessions and Context](../../wiki/running-pi/manage-sessions-and-context.md) |
| 6 | 安全与项目信任 | [Run Pi safely](../../wiki/running-pi/run-pi-safely.md) |
| 7 | 配置与 agent 目录 | [Configuration](../../wiki/customizing-pi/configure-pi.md) |
| 8 | 提示词模板 | [Prompt Templates](../../wiki/customizing-pi/create-prompt-templates.md) |
| 9 | 技能 Skills | [Skills](../../wiki/customizing-pi/add-skills.md) |
| 10 | MCP 服务器 | [MCP Servers](../../wiki/customizing-pi/connect-mcp-servers.md) |
| 11 | 扩展 Extensions | [Extensions](../../wiki/building-on-pi/build-extensions.md) |
| 12 | 虚拟模型路由 | [Virtual Models](../../wiki/building-on-pi/route-with-virtual-models.md) |
| 13 | CLI 集成模式 | [CLI Integration](../../wiki/building-on-pi/integrate-with-cli.md) |
| 14 | SDK | [SDK](../../wiki/building-on-pi/use-the-sdk.md) |
| 15 | CLI 命令参考 | [Command Line](../../wiki/reference/cli-commands.md) |
| 16 | Codemode 脚本 | [Codemode](../../wiki/reference/codemode.md) |
| 17 | 设置 Settings | [Settings Reference](../../wiki/reference/settings.md) |
| 18 | 环境变量 | [Environment Variables](../../wiki/reference/environment-variables.md) |
| 19 | 会话文件格式 | [Session File Format](../../wiki/reference/session-file-format.md) |
| 20 | JSON 事件流 | [JSON Event Stream](../../wiki/reference/json-event-stream.md) |

---

## 问题与参考答案

### 1. 安装与版本要求

- **问题**：Pi 有哪几种安装方式？通过 npm 安装时对 Node.js 的最低版本要求是什么？
- **参考答案**：三种安装方式：官方安装脚本（`install.sh` / `install.ps1`）、npm（`npm install -g --ignore-scripts @earendil-works/pi-coding-agent`）、Nix（`nix profile add github:earendil-works/pi/stable`）。npm 安装要求 Node.js 22.19 或更新版本。

### 2. 工作原理 / Agent loop

- **问题**：在 Pi 的 agent loop 中，一次 turn 包含哪些步骤？steering 消息与 follow-up 消息分别在何时进入？
- **参考答案**：一个 turn = 一次模型请求 + 执行该 assistant 响应中的工具调用并记录结果；若工具结果或排队消息需要，则再开始下一 turn。steering 消息在当前 assistant turn（及其工具调用）之后进入；follow-up 消息在 agent 完成所有待处理工作之后进入。

### 3. 终端交互

- **问题**：在终端里如何把文件加入提示？如何运行 shell 命令并决定是否把输出交给模型？
- **参考答案**：输入 `@` 可搜索并附加文件/图片（`Tab` 补全路径）。用 `!命令` 运行命令并把输出加入会话；用 `!!命令` 运行命令但不把输出发送给模型。

### 4. 模型选择与连接

- **问题**：Pi 支持哪些模型连接方式？当多种凭证来源同时存在时，优先级是什么？
- **参考答案**：支持：内置 provider 订阅或 API key（`/login`）、本地 GGUF 模型（llama.cpp 路由）、OpenAI/Anthropic/Google 兼容端点（`models.json`）、自定义协议（provider 扩展）。凭证优先级：`--api-key` → `auth.json` → `models.json` 的 `apiKey` → provider 环境变量或云凭证。

### 5. 会话管理与分支

- **问题**：`/tree`、`/fork`、`/clone` 三者有什么区别？退出后如何继续最近一次会话？
- **参考答案**：`/tree` 在当前会话文件内移动（另开分支）；`/fork` 从更早的 user 消息创建新会话；`/clone` 把活动分支复制为新会话。退出 Pi 后在相同目录运行 `pi --continue` 继续最近会话，`/resume` 打开会话选择器。

### 6. 安全与项目信任

- **问题**：project trust（项目信任）的作用是什么？它是否沙箱化工具调用？
- **参考答案**：project trust 控制是否加载工作目录提供的设置与资源（如 `.pi/settings.json`、`.pi/mcp.json`、扩展/技能等），防止文件夹静默加载可执行扩展。它不限制工具调用能访问或影响的内容——工具仍以 Pi 进程的操作系统权限运行，并非沙箱。

### 7. 配置与 agent 目录

- **问题**：用户级配置默认放在哪个目录？该目录中 `settings.json`、`mcp.json`、`auth.json`、`SYSTEM.md` 分别起什么作用？
- **参考答案**：agent 目录默认 `~/.pi/agent`（可用 `PI_CODING_AGENT_DIR` 覆盖）。`settings.json`=用户级设置；`mcp.json`=所有项目可用的 MCP 服务器；`auth.json`=保存的 API key/OAuth 凭证；`SYSTEM.md`=替换默认系统提示词（`APPEND_SYSTEM.md` 追加）。

### 8. 提示词模板

- **问题**：一个 prompt template 如何变成一个 `/` 命令？模板支持哪些参数替换语法？
- **参考答案**：把 Markdown 文件放到 prompts 目录（如 `~/.pi/agent/prompts/review.md`），文件名即命令名 `/review`；frontmatter 的 `description` 用于命令补全。支持 `$1`/`$2`、`$@`/`$ARGUMENTS`、`${1:-默认}`、`${@:-默认}`、`${@:N}`、`${@:N:L}` 等替换，参数遵循 shell 式引号。

### 9. 技能 Skills

- **问题**：一个 skill 的目录结构是什么？SKILL.md 中哪些字段控制路由与调用方式？
- **参考答案**：一个目录包含 `SKILL.md`（可选 `scripts/`、`references/`、`assets/`）。`SKILL.md` 以 frontmatter 开头：`name` 是命令/显示名，`description` 决定模型何时加载；`disable-model-invocation: true` 时只能通过 `/skill:name` 显式调用。启动时只把 name+description 加入系统提示，完整指令按需加载。

### 10. MCP 服务器

- **问题**：如何添加一个本地 stdio MCP 服务器和一个远程 HTTP 服务器？MCP 工具如何命名？
- **参考答案**：stdio：`pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .`；HTTP：`pi mcp add docs --url https://.../mcp --bearer-token-env-var DOCS_TOKEN`。工具命名为 `mcp__<server>__<tool>`。用户级写入 `~/.pi/agent/mcp.json`，项目级写入 `.pi/mcp.json`（需项目信任）。

### 11. 扩展 Extensions

- **问题**：一个扩展的基本形态是什么？注册工具和注册命令分别用什么 API？
- **参考答案**：导出默认工厂函数，接收 `ExtensionAPI`（`export default function (pi: ExtensionAPI) {...}`）。用 `pi.registerTool()` 添加模型可调用工具，`pi.registerCommand()` 添加 `/` 命令，`pi.registerProvider()` 添加 provider，`pi.registerVirtualModel()` 注册虚拟模型。开发时 `pi --extension ./hello.ts` 直接加载（jiti，无需编译）。

### 12. 虚拟模型路由

- **问题**：虚拟模型是什么？`route(request, ctx)` 需要返回什么？
- **参考答案**：虚拟模型是可选择的模型，针对每个请求挑选一个物理模型（按任务/成本/会话状态路由）。`route()` 返回 `{ model, thinkingLevel }`（可带 `state`），把"选择的虚拟模型+级别"映射为"派发的物理模型+级别"。route 抛错或返回无凭证模型时，请求以错误响应结束。

### 13. CLI 集成模式

- **问题**：Pi 有哪四种运行模式？各自适合什么场景？
- **参考答案**：Interactive（终端 UI，人直接使用）、Print（stdout 输出最终文本，一次性/脚本场景）、JSON（stdout 输出 JSONL 事件，一次性结构化进度）、RPC（stdin/stdout JSONL 命令与事件，长驻双向控制）。四者使用同一套 agent/session/工具机制。

### 14. SDK

- **问题**：如何用 SDK 创建会话、发送提示并流式获取文本？如何避免写入会话文件？
- **参考答案**：`const { session } = await createAgentSession()`；`session.prompt("...")` 在运行结束后 resolve；先 `session.subscribe(...)` 监听 `message_update` 的 `text_delta` 事件流式输出；最后 `session.dispose()`。传入 `sessionManager: SessionManager.inMemory()` 可避免持久化会话文件。

### 15. CLI 命令参考

- **问题**：`pi` 的顶层命令有哪些？默认启用的工具是什么？
- **参考答案**：顶层命令包括 `install`/`remove`/`uninstall`/`update`/`list`/`config`/`auth check|print-api-key|print-bearer-token`/`mcp add|remove|list|login|logout`。默认启用的工具是 `read`、`bash`、`edit`、`write`（可用 `defaultTools` 修改）。

### 16. Codemode 脚本

- **问题**：codemode 脚本在什么沙箱里运行？如何调用工具、分类模型和图像模型？
- **参考答案**：在 QuickJS 沙箱中作为 async 函数体运行（无 Node API、文件系统、网络、定时器），只能通过 `tools` 和 `models` 访问外界。用 `tools.<name>(args)` 调用工具，`models.classify(model,{state,questions})` 运行分类模型，`models.generateImages(model,{input})` 生成图像；只有脚本输出（`text()`/`image()`/`return`）进入模型上下文。

### 17. 设置 Settings

- **问题**：自动压缩由哪些设置控制？它们的默认值分别是什么？
- **参考答案**：`compaction.enabled`（默认 `true` 开启）、`compaction.reserveTokens`（默认 `16384`，空闲 token 低于此值触发）、`compaction.keepRecentTokens`（默认 `20000`，近期保留不摘要）、`compaction.modelOverrides`（按 `provider/modelId` 覆盖）。`/compact` 可手动触发。

### 18. 环境变量

- **问题**：Pi 会设置哪两个进程标记？`bash`/`powershell` 工具会注入哪些会话相关变量？
- **参考答案**：进程标记：`AI_AGENT=pi`、`PI_CODING_AGENT=true`。shell 工具注入：`PI_SESSION_ID`、`PI_SESSION_FILE`（持久化会话的 JSONL 路径，临时会话不设置）、`PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL`。

### 19. 会话文件格式

- **问题**：会话如何持久化？条目如何形成树结构？
- **参考答案**：以 JSONL（每行一个 JSON 对象，含 `type` 字段）存储，路径 `~/.pi/agent/sessions/--<path>--/<timestamp>_<session-id>.jsonl`。除 `SessionHeader` 外，每条目通过 `id`/`parentId` 形成树，支持原地分支；当前版本 v3，旧会话加载时自动迁移。

### 20. JSON 事件流

- **问题**：JSON 模式输出什么？`agent_end` 与 `agent_settled` 有何区别？
- **参考答案**：`pi --mode json` 先输出一个 session header，再输出 agent/session 事件的 JSONL（每条以 LF 结尾）。`agent_end` 结束一次低级 agent run（之后仍可能有重试/恢复/排队工作）；`agent_settled` 表示本次运行不再自动继续（`aborted` 字段表示是否因中止而结束）。
