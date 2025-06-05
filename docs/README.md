---
layout: doc-layout.njk
title: "Endgame - Documentation"
titleMenu: "Overview"
description: "Guides and reference materials to help you set up Endgame and its MCP to deploy endlessly with AI in tools like Cursor, Claude Code, Windsurf, and VS Code."
keywords: "endgame documentation, getting started, mcp, ai agents, serverless, cursor, windsurf, claude code"
active: "docs"
permalink: "/docs/"
docPath: "/"
order: 1
---

**Endgame** is a purpose-built cloud platform designed exclusively for AI Agents. Unlike traditional cloud services built for human workflows, Endgame is architected to operate at the speed and scale AI demands. Its mission is simple: enable AI to deliver software 100x faster—at the pace AI can think, iterate, and build.

Endgame uses a powerful MCP to integrate directly into AI-augmented development tools like Cursor, Windsurf, VS Code, and Claude Code, and give AI Agents everything they need to autonomously create, deploy, test, and refine software at unprecedented speed.

**To get started, pick the tool you wish to set up Endgame with:**

* [Cursor](guides/cursor/)
* [Claude Code](guides/claude-code)
* [VSCode](guides/vscode/)
* [Windsurf](guides/windsurf/)

## Key Features

### Model Context Protocol (MCP) Core

At the foundation of Endgame is a powerful implementation of the [Model Context Protocol](https://modelcontextprotocol.io/introduction). It continuously evaluates code, manages deployments, runs tests, and handles debugging—acting as an operational partner for your AI Agent.

### Rapid Deployments

Deployments average around 10 seconds, empowering AI Agents to ship and test new versions without delay.

### Cloud Builds

All code is uploaded and built directly in the cloud. This eliminates the need for local environments and the complexity that surrounds that, allowing AI Agents to work in clean, reproducible conditions from anywhere, which mirrors the production environment.

### Infinite Branching

Endgame supports deploying an unlimited number of branches simultaneously, enabling isolated experiments and liberating background Agents to work on parts of an app without disrupting the main development flow.

### Full-Stack Deployment

Whether front-end, back-end, or both—if it runs a standard Node.js web server, Endgame can deploy it. The platform is optimized for full-stack autonomy.

### Autonomous Code Review

Every deployment includes an automated code review step. Endgame collaborates with your AI Agent to catch issues early and improve outcomes.

#### Automated Testing & Debugging

Each deployment is tested automatically. Failures are returned with structured diagnostics—logs, errors, stack traces, and insights—so the AI Agent can immediately analyze and improve the next iteration.

## Use Cases

Endgame is optimized for fast, autonomous deployment across a range of modern web workloads. Typical use cases include:

* **Back-end services** built with Node.js or TypeScript, using frameworks like Express, Hono, NestJS, Fastify, and others.
* **Front-end applications** using JavaScript or TypeScript with frameworks such as React, Next.js, Svelte, and Eleventy.
* **Webhooks** for services like Stripe, Zapier, and other third-party APIs.
* **Integrations** and utility services that require rapid deployment and iteration.

**To get started, pick the tool you wish to set up Endgame with:**

* [Cursor](guides/cursor/)
* [Claude Code]()
* [VSCode](guides/vscode/)
* [Windsurf](guides/windsurf/)