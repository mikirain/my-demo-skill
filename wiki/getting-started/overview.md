# Pi

> Sources: Pi documentation (pi.dev), 2026-10-25
> Raw: [raw/getting-started/overview.md](../../raw/getting-started/overview.md)
> Updated: 2026-10-25

## Overview

Pi is an extensible AI agent that works from your terminal. Give it a goal and a working folder, and it can inspect files, run commands, edit content, and work through multi-step tasks.
Use Pi for software development, research notes, writing projects, data files, or hobby work. You can use Pi as is, prompt it to adapt itself to your workflow, or build other applications powered by Pi using the SDK.

## Start using Pi

New to Pi? Follow the [Quickstart](quickstart.md) to install Pi, connect a model, and complete your first task.

If Pi is already installed, choose what you want to do:

- [Use Pi interactively](../running-pi/use-pi-in-terminal.md) to add files, run commands, direct ongoing work, and export results.
- [Choose a model](../running-pi/choose-a-model.md) or connect a subscription, API key, local model, or compatible endpoint.
- [Continue or branch a session](../running-pi/manage-sessions-and-context.md) to resume work or explore another approach without losing history.
- [Configure Pi](../customizing-pi/configure-pi.md) for your preferences, working folders, instructions, and reusable resources.
- [Understand how Pi works](how-pi-works.md), including tools, context, sessions, and the agent loop.

## Customize Pi

Pi can reuse prompts, load specialized instructions, add executable integrations, change its terminal interface, connect model services, and distribute these resources as packages.
Use the [Quickstart customization chooser](quickstart.md#choose-how-to-customize-pi) to select the smallest mechanism that meets your need.

## Automate or embed Pi

- Use [print mode](../reference/cli-commands.md#invocation-and-output) for one-off and scripted tasks.
- Use [JSON event stream mode](../reference/json-event-stream.md) to consume structured events from one run.
- Use [RPC mode](../reference/rpc-protocol.md) to control a separate Pi process.
- Use the [TypeScript SDK](../building-on-pi/use-the-sdk.md) to run Pi inside an application.

## Find reference and setup information

Use the reference pages to look up [CLI options](../reference/cli-commands.md), [settings](../reference/settings.md), [providers](../reference/providers.md), [keybindings](../reference/keybindings.md), and [environment variables](../reference/environment-variables.md).

For platform-specific help, see [Terminal Setup](../running-pi/configure-terminal.md), [Windows](../running-pi/run-pi-on-windows.md), [tmux](../running-pi/run-pi-in-tmux.md), [Termux on Android](../running-pi/run-pi-on-android.md), or [Containerization](../running-pi/isolate-pi.md).

## Work safely

Pi's tools and extensions run with the permissions of the Pi process. Project trust controls which project resources Pi loads, but it does not sandbox tool calls. Review [Security](../running-pi/run-pi-safely.md) before using untrusted files, repositories, extensions, or unattended automation.
