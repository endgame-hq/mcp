---
layout: doc-layout.njk
title: 'Endgame - Documentation - Windsurf IDE Integration Guide'
titleMenu: 'Windsurf'
description: 'Learn how to set up and use Endgame with Windsurf IDE. Complete guide for configuring the MCP server and developing with AI assistance.'
keywords: 'endgame windsurf, windsurf ide, windsurf integration, ai coding, mcp server, windsurf setup'
active: 'docs'
permalink: '/docs/guides/windsurf/'
docPath: '/guides/windsurf'
order: 4
---

Windsurf is an AI-native IDE that radically reimagines how developers build software. It supports MCP servers, and by adding Endgame, you'll enable Windsurf to seamlessly deploy any code that it writes.

## Install Windsurf

If you don't already have Windsurf installed, download it from the [official Windsurf website](https://codeium.com/windsurf) and follow their installation guide.

## Add Endgame MCP Server

To add the Endgame MCP server to Windsurf, you'll need to create or edit the MCP configuration file:

1. Navigate to your home directory
2. Open or create the file `~/.codeium/windsurf/mcp_config.json`
3. Add the following configuration:

```json
{
  "mcpServers": {
    "endgame": {
      "command": "npx",
      "args": ["endgame-mcp@latest"],
      "env": {
        "API_KEY": "your_endgame_api_key"
      }
    }
  }
}
```

Replace `your_endgame_api_key` with your actual Endgame API key, which you can obtain from Endgame's [dashboard](https://dashboard.endgame.dev).

## Verify Installation

To confirm the MCP server has been correctly installed, restart Windsurf and check that the Endgame tools are available in your AI conversations.

Once configured, you can use the Endgame tools directly within Windsurf conversations to manage your applications and deployments seamlessly.
