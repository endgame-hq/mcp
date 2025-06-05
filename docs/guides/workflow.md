---
layout: doc-layout.njk
title: "Endgame - Documentation - Development Workflow"
titleMenu: "Workflow"
description: "A guide on the ideal development workflow when using Endgame with Cursor, Windsurf, VSCode & more."
keywords: "endgame workflow, development workflow, deployment, branches, previews, environments, stages, git, git integration"
active: "docs"
permalink: "/docs/guides/workflow/"
docPath: "/guides/workflow"
order: 1
---

# Endgame MCP Development Workflow

This guide explains the development workflow when using the Endgame MCP (Model Context Protocol) server with AI-powered developer tools like Cursor, Claude Code, Windsurf, and VS Code.

## Overview

The Endgame MCP server provides AI assistants with tools to deploy and manage applications on the Endgame cloud platform. The workflow follows a structured process: setup, review, deploy, and interact.

## Prerequisites

- **Node.js 22.x** - Required runtime for the Endgame platform
- **Git repository** - Your application source code should be in a Git repository
- **API Key** - Obtain from the [Endgame Dashboard](https://endgame.dev)
- **MCP-enabled IDE** - Cursor, Windsurf, VS Code with MCP extension, or compatible AI assistant

## Environment Setup

### 1. Install the MCP Server

Install the Endgame MCP server globally:

```bash
npm install -g endgame-mcp
```

### 2. Configure Your IDE

Add the MCP server to your IDE's configuration. For Cursor, add to your MCP settings:

```json
{
  "mcpServers": {
    "endgame": {
      "command": "endgame-mcp",
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Set Environment Variables

Ensure your `API_KEY` environment variable is set:

```bash
export API_KEY="your-endgame-api-key"
```

## Core Workflow

### Step 1: Setup Your Application

Initialize your application for Endgame deployment:

**What it does:**
- Creates a `.endgame` configuration file in your project root
- Sets up app name and organization settings
- Validates app name format (lowercase, alphanumeric, dashes, 3-20 chars)

**AI Assistant Command:**
"Set up this application for Endgame deployment with the app name 'my-web-app'"

### Step 2: Review Your Application

Before deployment, review your application configuration:

**What it does:**
- Analyzes your project structure and dependencies
- Provides deployment guidance and recommendations
- Validates compatibility with Endgame platform requirements
- Suggests optimal build configurations

**AI Assistant Command:**
"Review this application for Endgame deployment"

### Step 3: Deploy Your Application

Deploy your application to the Endgame cloud platform:

**What it does:**
- Zips your application source code
- Uploads to secure cloud storage
- Executes build commands in the cloud environment
- Deploys to Node.js 22.x runtime on port 8080
- Provides deployment URL and status

**AI Assistant Command:**
"Deploy this application to Endgame with build command 'npm install && npm run build'"

### Step 4: Interact with Deployed Application

Test and interact with your deployed application:

**What it does:**
- Makes HTTP requests to your deployed application
- Returns response data and application logs
- Supports different HTTP methods, headers, and request bodies
- Enables testing of API endpoints and functionality

**AI Assistant Command:**
"Test the deployed application by calling the /api/health endpoint"

## Application Requirements

### Runtime Requirements
- **Node.js 22.x** - Only supported runtime
- **Port 8080** - Application must listen on this port
- **Web Server** - Must be a server application (static sites not supported)

### Project Structure
```
your-app/
├── .endgame              # Auto-generated configuration
├── package.json          # Node.js dependencies
├── index.js             # Default entrypoint (configurable)
├── src/                 # Application source code
└── README.md
```

### Build Configuration
- **Build Command**: Typically `npm install && npm run build`
- **Build Artifact Path**: Directory containing built application (e.g., `dist`, `build`)
- **Entrypoint File**: Main application file (defaults to `index.js`)

## Branch-Based Deployments

The Endgame platform supports branch-based deployments:

- **Main Branch**: Production environment
- **Feature Branches**: Isolated preview environments
- **Branch URLs**: Each branch gets a unique URL for testing

## Available MCP Tools

The Endgame MCP server provides these tools to AI assistants:

1. **setup-app** - Initialize application configuration
2. **review-app** - Analyze and validate application
3. **deploy-app** - Deploy application to cloud platform
4. **interact-with-app** - Test deployed application endpoints
5. **list-apps** - View all deployed applications
6. **delete-app** - Remove applications and all associated data

## Configuration File

The `.endgame` file stores your application configuration:

```json
{
  "org": "personal",
  "app": "my-web-app",
  "settings": {}
}
```

**Note**: This file is automatically managed by the MCP tools and should not be edited manually.

## Security and Authentication

- **API Key Authentication**: All operations require a valid API key
- **Organization Isolation**: Applications are isolated by organization
- **Secure Uploads**: Source code uploaded via presigned S3 URLs
- **Environment Variables**: Secure injection of environment variables

## Troubleshooting

### Common Issues

**"No .endgame file found"**
- Run setup tool first: Ask AI assistant to "Set up this app for Endgame"

**"API_KEY environment variable is not set"**
- Configure API key in your IDE's MCP server settings
- Obtain API key from Endgame Dashboard

**"App name must be lowercase..."**
- App names must be 3-20 characters, lowercase alphanumeric and dashes only

**"Apps without a back-end server are not supported"**
- Endgame requires web server applications listening on port 8080
- Static site generators need a server component

## Best Practices

1. **Always Review First**: Run review tool before deployment
2. **Use Descriptive App Names**: Choose clear, meaningful app names
3. **Include Build Commands**: Specify complete build commands with dependencies
4. **Test Deployments**: Use interact tool to verify deployments
5. **Clean Branch Management**: Delete unused branches and deployments
6. **Secure API Keys**: Keep API keys secure and don't commit to source control

## Next Steps

- Explore the [Cursor Guide](./cursor.md) for Cursor-specific setup
- Check the [VS Code Guide](./vscode.md) for VS Code configuration
- Review the [Windsurf Guide](./windsurf.md) for Windsurf integration 