---
layout: doc-layout.njk
title: "Endgame - Documentation - Cursor AI IDE Integration Guide"
titleMenu: "Cursor"
description: "Learn how to set up and use Endgame with Cursor AI IDE. Complete guide for configuring the MCP server and developing with AI assistance."
keywords: "endgame cursor, cursor ai ide, cursor integration, ai coding, mcp server, cursor setup"
active: "docs"
permalink: "/docs/guides/cursor/"
docPath: "/guides/cursor"
order: 2
---

Cursor is a world-class AI-powered code editor built for programming with AI. It supports MCP servers, and by adding Endgame, you'll enable Cursor to seamlessly deploy any code that it writes.

## Install Cursor

If you don't already have Cursor installed, download it from the [official Cursor website](https://cursor.sh/) and follow their installation guide.

## Add Endgame MCP Server

To add the Endgame MCP server to Cursor, follow these steps:

1. Open Cursor
2. Go to **Cursor Settings** 
3. Navigate to **MCP** section
4. Click **Add new MCP Server**
5. Enter the following configuration:

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

To confirm the MCP server has been correctly installed, you can check the MCP status within Cursor or look for the Endgame tools in the Cursor interface.

Once configured, you can use the Endgame tools directly within Cursor conversations to manage your applications and deployments seamlessly. 