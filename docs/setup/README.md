---
layout: doc-layout.njk
title: 'Endgame - Documentation - Getting Started'
titleMenu: 'Getting Started'
description: 'How to set up Endgame with various IDEs including Cursor, Claude Code, Windsurf, and VS Code.'
keywords: 'endgame guides, ide integration, vscode, cursor, windsurf, ai development, workflow guides'
active: 'docs'
permalink: '/docs/setup/'
docPath: '/setup/'
order: 1
---

Endgame prioritizes its [Model Context Protocol Server (MCP)](https://modelcontextprotocol.io/introduction) for a streamlined experience, over traditional cloud tools like CLIs, SDKs, or dashboards.

The MCP is a code library that encapsulates logic and API calls into a suite of AI-optimized tools, enabling autonomous operations on your behalf.

The MCP integrates seamlessly with these tools: Cursor, Claude Code, Windsurf, and VS Code. There isn't a way to use Endgame outside of these tools. Choose your preferred tool to proceed.

## API Key Setup

An API Key is required for the MCP to authenticate and manage actions on your Endgame account, such as deploying applications.

To obtain an API Key:

1. Sign up for an account on the [Endgame Dashboard](https://dashboard.endgame.dev).
2. Upon account creation, an API Key is automatically generated. Access it via:
   - The dashboard's initial setup guide, which provides tool-specific configuration guides with your API Key pre-embedded. Copy the configuration to set up your tool.
   - The [Settings](https://dashboard.endgame.dev/settings) tab in the Dashboard, where your API Key is displayed.

**Security Note:** Your API Key is linked to your personal account. Treat it like a password—do not share or expose it publicly. It enables your AI tools to act on your behalf, automating tasks within your Endgame account.

This section contains detailed guides for using our platform.

## Tool Setup

First, check that you have **Node.js 22.x** or later in your environment to install and use the Endgame MCP.

Next, we've published guides on getting started with specific tools Choose a guide from the list below to get started:

- [Cursor Guide](./cursor.md) - Set up and use our platform with Cursor AI IDE
- [Claude Code](./claude-code.md) - Set up and use our platform with Claude Code
- [VS Code Guide](./vscode.md) - Set up and use our platform with Visual Studio Code
- [Windsurf Guide](./windsurf.md) - Set up and use our platform with Windsurf IDE

## Application Setup

You can use Endgame to deploy new or existing codebases, even codebases that are already being deployed with other tools. Endgame is not invasive and you can use both side-by-side.

Endgame expects a traditional back-end server architecture (e.g., an Express.js back-end). Currently, Endgame only supports applications that use Node.js version 22. The cloud runtime is Node.js 22 only at ths time.

After the MCP is installed, navigate to the working directory of your application's root folder, and ask the AI in your preferred tool to deploy it using Endgame.

The Endgame MCP will handle the deployment process automatically. To learn more about what happens next and how to best work with Endgame, check out the [Workflow](guides/workflow) guide.
