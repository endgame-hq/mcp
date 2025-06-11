---
layout: doc-layout.njk
title: 'Endgame - Documentation - VS Code Integration Guide'
titleMenu: 'VS Code'
description: 'Learn how to set up and use Endgame with Visual Studio Code. Complete guide for configuring the extension and developing with AI assistance.'
keywords: 'endgame vscode, visual studio code, vscode extension, ai coding, mcp server, development setup'
active: 'docs'
permalink: '/docs/guides/vscode/'
docPath: '/guides/vscode'
order: 5
---

Visual Studio Code is a versatile code editor that can be enhanced with AI capabilities through MCP servers. By adding Endgame, you'll enable VS Code to seamlessly deploy any code that it writes.

## Install VS Code

If you don't already have VS Code installed, download it from the [official VS Code website](https://code.visualstudio.com/) and follow their installation guide.

## Add Endgame MCP Server

To add the Endgame MCP server to VS Code, you'll need to modify your VS Code settings:

1. Open VS Code
2. Go to **File** > **Preferences** > **Settings** (or press `Ctrl/Cmd + ,`)
3. Click the **Open Settings (JSON)** button in the top right corner
4. Add the following configuration to your `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "endgame": {
        "command": "npx",
        "args": ["endgame-mcp@latest"],
        "env": {
          "API_KEY": "your_endgame_api_key"
        }
      }
    }
  }
}
```

Replace `your_endgame_api_key` with your actual Endgame API key, which you can obtain from Endgame's [dashboard](https://dashboard.endgame.dev).

## Verify Installation

To confirm the MCP server has been correctly installed, restart VS Code and check that the Endgame tools are available through your AI extensions or MCP-compatible tools.

Once configured, you can use the Endgame tools directly within VS Code to manage your applications and deployments seamlessly.
