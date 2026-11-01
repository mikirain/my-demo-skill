# Configuration

> Sources: Pi documentation (pi.dev), 2026-10-25
> Raw: [raw/customizing-pi/configure-pi.md](../../raw/customizing-pi/configure-pi.md)
> Updated: 2026-10-25

## Overview

Pi supports user-level and project configuration. User-level configuration lives in the agent directory, which defaults to `~/.pi/agent`. Project configuration lives in `.pi` under the working directory and loads after [project trust](../running-pi/run-pi-safely.md#understand-project-trust) is granted. The only exception is `sessionDir`, which Pi reads before resolving trust so it can locate sessions.
In interactive mode, use `/settings` to change common preferences. For other options, ask Pi to update the configuration or edit the relevant files directly. Run `/reload` after manually changing settings, keybindings, instructions, or resources.

## Agent directory

The agent directory is shown as `<agent-dir>` below. Set its location with the `PI_CODING_AGENT_DIR` environment variable or the SDK's [`agentDir`](../building-on-pi/use-the-sdk.md) option.

| Path | Responsibility |
|---|---|
| `<agent-dir>/settings.json` | User-level [settings](../reference/settings.md), including preferences, defaults, resource paths, and Pi package declarations. |
| `<agent-dir>/keybindings.json` | Custom terminal UI and application [keybindings](../reference/keybindings.md). |
| `<agent-dir>/mcp.json` | [MCP servers](connect-mcp-servers.md) available in every project. |
| `<agent-dir>/models.json` | [Compatible endpoints, models, and model overrides](../running-pi/choose-a-model.md#configure-a-compatible-endpoint). |
| `<agent-dir>/auth.json` | Saved API keys and OAuth credentials. |
| `<agent-dir>/AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, or `CLAUDE.MD` | User instructions applied across working directories. |
| `<agent-dir>/SYSTEM.md` | Replaces Pi’s default system prompt. |
| `<agent-dir>/APPEND_SYSTEM.md` | Adds instructions to Pi’s system prompt. |
| `<agent-dir>/extensions/` | User [extensions](../building-on-pi/build-extensions.md). |
| `<agent-dir>/skills/` | User [skills](add-skills.md) and supporting files. |
| `<agent-dir>/prompts/` | User [prompt templates](create-prompt-templates.md) exposed as slash commands. |
| `<agent-dir>/themes/` | User [theme](create-themes.md) files. |

## Project `.pi` directory

| Path | Responsibility |
|---|---|
| `.pi/settings.json` | Project-level [settings](../reference/settings.md), resource paths, and Pi package declarations. |
| `.pi/mcp.json` | Project [MCP servers](connect-mcp-servers.md). |
| `.pi/SYSTEM.md` | Replaces the system prompt for the project. |
| `.pi/APPEND_SYSTEM.md` | Adds project-specific instructions to the system prompt. |
| `.pi/extensions/` | Project extensions. |
| `.pi/skills/` | Project skills and supporting files. |
| `.pi/prompts/` | Project prompt templates exposed as slash commands. |
| `.pi/themes/` | Project theme files. |

For `SYSTEM.md` and `APPEND_SYSTEM.md`, the trusted project file takes precedence over the corresponding agent-directory file. Files with the same name are not combined.

## Context files

Context files are separate from project `.pi` configuration. Pi loads them from the agent directory, the working directory, and its parent directories. A context file applies whenever Pi runs in its directory or anywhere below it.

An `AGENTS.override.md` replaces `AGENTS.md` or `CLAUDE.md` only in the same directory. It does not suppress context files from the agent directory or other directories.

Context-file discovery does not require project trust.
