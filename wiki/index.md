# Knowledge Base Index

## getting-started

Pi 入门：安装、首次使用与工作原理。

| Article | Summary | Updated |
|---------|---------|---------|
| [Pi](getting-started/overview.md) | Pi is an extensible AI agent that works from your terminal. | 2026-10-25 |
| [Quickstart](getting-started/quickstart.md) | Pi runs in your terminal and works with files on your machine. | 2026-10-25 |
| [How Pi Works](getting-started/how-pi-works.md) | Pi coordinates model requests, tool execution, context assembly, and session storage. | 2026-10-25 |

## running-pi

运行 Pi：终端交互、模型、会话、安全、隔离、本地模型与各平台配置。

| Article | Summary | Updated |
|---------|---------|---------|
| [Use Pi in the terminal](running-pi/use-pi-in-terminal.md) | Run pi from the folder you want to work in. | 2026-10-25 |
| [Choose a Model](running-pi/choose-a-model.md) | For a built-in provider, start with /login, then choose a model with /model. | 2026-10-25 |
| [Sessions and Context](running-pi/manage-sessions-and-context.md) | Pi saves a conversation as a session. | 2026-10-25 |
| [Run Pi safely](running-pi/run-pi-safely.md) | Treat model-generated commands and code as untrusted. | 2026-10-25 |
| [Run Pi in an isolated environment](running-pi/isolate-pi.md) | Use an isolated environment to limit the files, credentials, processes, and network services that generated c… | 2026-10-25 |
| [Local Models with llama.cpp](running-pi/run-local-models.md) | Pi supports the llama.cpp router server. | 2026-10-25 |
| [Run Pi with NVIDIA RTX and llama.cpp](running-pi/run-local-models-nvidia-rtx.md) | NVIDIA Local AI Inference Recipes provides llama.cpp settings tuned for specific NVIDIA hardware and models. | 2026-10-25 |
| [Configure your terminal](running-pi/configure-terminal.md) | Most modern terminals work with Pi without additional setup. | 2026-10-25 |
| [Configure shell commands](running-pi/configure-shell-commands.md) | Pi starts a separate non-interactive shell process for each Bash command. | 2026-10-25 |
| [Run Pi in tmux](running-pi/run-pi-in-tmux.md) | Pi works inside tmux, but tmux can report Shift+Enter, Ctrl+Enter, and plain Enter as the same key. | 2026-10-25 |
| [Run Pi on Windows](running-pi/run-pi-on-windows.md) | Run Pi either as a native Windows process or inside Windows Subsystem for Linux (WSL). | 2026-10-25 |
| [Run Pi on Android with Termux](running-pi/run-pi-on-android.md) | Pi runs on Android through Termux, a terminal emulator and Linux environment. | 2026-10-25 |

## customizing-pi

自定义 Pi：配置、提示词模板、技能、主题、包与 MCP 服务器。

| Article | Summary | Updated |
|---------|---------|---------|
| [Configuration](customizing-pi/configure-pi.md) | Pi supports user-level and project configuration. | 2026-10-25 |
| [Prompt Templates](customizing-pi/create-prompt-templates.md) | Prompt templates turn Markdown files into reusable / commands. | 2026-10-25 |
| [Skills](customizing-pi/add-skills.md) | Skills give Pi specialized instructions and supporting files for a particular kind of work. | 2026-10-25 |
| [Customize Pi with themes](customizing-pi/create-themes.md) | Themes control the colors Pi uses in interactive mode and HTML exports. | 2026-10-25 |
| [Pi Packages](customizing-pi/use-pi-packages.md) | Pi packages install and distribute extensions, skills, prompt templates, and themes as one unit. | 2026-10-25 |
| [MCP Servers](customizing-pi/connect-mcp-servers.md) | Pi connects to Model Context Protocol servers over stdio or streamable HTTP and makes their tools and resourc… | 2026-10-25 |

## building-on-pi

基于 Pi 构建：扩展、自定义 Provider、虚拟模型、终端 UI、CLI 集成与 SDK。

| Article | Summary | Updated |
|---------|---------|---------|
| [Extensions](building-on-pi/build-extensions.md) | Extensions are TypeScript modules that add executable behavior to Pi. | 2026-10-25 |
| [Custom Providers](building-on-pi/add-custom-providers.md) | A provider extension connects Pi to a model service that needs custom authentication, model discovery, reques… | 2026-10-25 |
| [Virtual Models](building-on-pi/route-with-virtual-models.md) | A virtual model is a selectable model that picks a physical model for each request. | 2026-10-25 |
| [Terminal UI](building-on-pi/build-terminal-ui-components.md) | @earendil-works/pi-tui provides the terminal component system used by Pi. | 2026-10-25 |
| [CLI Integration](building-on-pi/integrate-with-cli.md) | By default, running pi opens the interactive terminal interface. | 2026-10-25 |
| [SDK](building-on-pi/use-the-sdk.md) | @earendil-works/pi-coding-agent embeds Pi in a Node.js or Bun process. | 2026-10-25 |

## reference

参考手册：CLI、设置、环境变量、快捷键、会话格式、JSON/RPC 协议等。

| Article | Summary | Updated |
|---------|---------|---------|
| [Command Line](reference/cli-commands.md) | This page documents Pi's built-in command-line commands and options. | 2026-10-25 |
| [Codemode](reference/codemode.md) | The codemode tool lets the model write a JavaScript script that calls pi's other tools and runs non-LLM model… | 2026-10-25 |
| [Slash commands](reference/slash-commands.md) | Type / in Pi's terminal editor to search the commands available in the current session. | 2026-10-25 |
| [Settings Reference](reference/settings.md) | This reference lists user-configurable settings, their types, defaults, and purposes. | 2026-10-25 |
| [Models Configuration](reference/models-configuration.md) | This reference lists the fields of models.json. | 2026-10-25 |
| [Environment Variables](reference/environment-variables.md) | Pi uses environment variables in three ways: | 2026-10-25 |
| [Keybindings Reference](reference/keybindings.md) | Pi exposes named actions, such as app.session.new, that can be assigned keybindings. | 2026-10-25 |
| [Providers](reference/providers.md) | Most hosted providers support one or both of these authentication methods: | 2026-10-25 |
| [Session File Format](reference/session-file-format.md) | Sessions are stored as JSONL (JSON Lines) files. | 2026-10-25 |
| [Compaction Reference](reference/compaction.md) | This reference describes automatic compaction, branch summarization, persisted entries, and extension hooks. | 2026-10-25 |
| [JSON Event Stream](reference/json-event-stream.md) | JSON mode emits structured progress for one invocation: | 2026-10-25 |
| [RPC Mode](reference/rpc-protocol.md) | RPC mode runs Pi as a long-lived subprocess controlled through JSON records on stdin and stdout. | 2026-10-25 |
| [RPC Commands](reference/rpc-commands.md) | This reference lists commands accepted on stdin in RPC mode. | 2026-10-25 |
| [RPC Extension UI](reference/rpc-extension-ui.md) | Extensions can request user interaction through ctx.ui. | 2026-10-25 |
| [Message Types](reference/message-types.md) | Pi uses AgentMessage values in SDK state, lifecycle events, RPC responses, and persisted session message entr… | 2026-10-25 |
