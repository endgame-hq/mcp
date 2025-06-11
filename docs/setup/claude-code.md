---
layout: doc-layout.njk
title: 'Endgame - Documentation - Claude Code Setup Guide'
titleMenu: 'Claude Code'
description: 'Learn how to set up and use Endgame with Claude Code AI. Complete guide for configuring the MCP server and developing with AI assistance.'
keywords: 'endgame, claude code, claude code ai, claude code integration, claude code mcp, ai coding, mcp server, claude code setup'
active: 'docs'
permalink: '/docs/guides/claude-code/'
docPath: '/guides/claude-code'
order: 3
---

Claude Code is a spectacular AI-enhanced CLI for writing and working with code. It supports MCP servers, and by adding Endgame, you'll enable Claude Code to seamlessly deploy any code that it writes.

## Install Claude Code

If you don't already have Claude Code installed, follow its [official documentation](https://docs.anthropic.com/en/docs/claude-code/getting-started) to get started.

## Add Endgame MCP Server

There are two ways to add the Endgame MCP server to Claude Code:

### Using the CLI (Recommended)

Run this command in your terminal. Be sure to use the `--scope user` flag to install it globally, otherwise it will only be available in the current project:

```bash
claude mcp add endgame \
  --scope user \
  -e API_KEY=your_endgame_api_key \
  -- npx endgame-mcp@latest
```

Replace `your_endgame_api_key` with your actual Endgame API key, which you can obtain from Endgame's [dashboard](https://dashboard.endgame.dev).

### Manual Configuration

Alternatively, you can manually add this configuration to your `.claude.json` file. To make it available globally, add it to the `"mcpServers"` object at the root level of the JSON (rather than within a specific project):

```json
"mcpServers": {
  "endgame": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "endgame-mcp@latest"
    ],
    "env": {
      "API_KEY": "your_endgame_api_key"
    }
  }
}
```

Replace `your_endgame_api_key` with your actual Endgame API key, which you can get from [Endgame's dashboard](https://dashboard.endgame.dev).

## Verify Installation

To confirm the MCP server has been correctly installed, you can list the installed MCPs with these commands:

```bash
claude
# After it starts up, run:
/mcp
```

Once configured, you can use the Endgame tools directly within Claude Code conversations to manage your applications and deployments seamlessly.
