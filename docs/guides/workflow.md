---
layout: doc-layout.njk
title: 'Endgame - Documentation - Development Workflow'
titleMenu: 'Workflow'
description: 'A guide on the ideal development workflow when using Endgame with Cursor, Windsurf, VSCode & more.'
keywords: 'endgame workflow, development workflow, deployment, branches, previews, environments, stages, git, git integration'
active: 'docs'
permalink: '/docs/guides/workflow/'
docPath: '/guides/workflow'
order: 1
---

## Philosophy

Endgame is designed to be used first and foremost by AI Agents, with little to no human intervention required. The entire workflow described here will all be handled by AI in your developer tool, and thus is the magic of Endgame. However, with AI there are still hiccups and it's important to know what's happening behind the scenes, so you can nudge things in the right direction if there are issues.

## Deployment

When you are ready to deploy, you can simply ask AI to deploy via Endgame, and it will do so.

Endgame is designed to perform rapid deployments (~10s) so deploying every change is easy and quick. It features a full cloud build system and we work hard to make everything deploy as quickly as possible.

As a result, many instruct AI at the beginning of a session to always deploy to Endgame after every change. Many even skip installing dependencies locally and setting up a local environment overall. A big value of always deploying is you get to see how things operate in a real production environment, with no surprises.

This workflow is designed to make all of this possible, fast and safe.

### Setup

If you've never used Endgame with an app before, don't worry, Endgame will set itself up the first time you ask your AI to deploy to Endgame. It does this by calling the `setup` tool.

This will create a `.endgame` file within the root of your application.

```
your-app/
├── .endgame              # Auto-generated configuration
├── package.json          # Node.js dependencies
├── index.js             # Default entrypoint (configurable)
├── src/                 # Application source code
└── README.md
```

In it is your Endgame organization name and a name AI created for your application. The application name is used to uniquely identify your application and ensure deployments are created for the same application.

This `.endgame` file is not meant to be edited manually. Simply guide your AI to edit it if necessary.

### Review

Most deployment challenges can be avoided by simply reviewing the application beforehand and ensuring it meets the criteria needed to run successfully on the host.

Endgame reviews your application automatically for this reason before every deployment. It knows to call the `review` tool which relies on AI to answer a questionnaire about the application. The `review` tool responds with requirements and best practices for the technologies and use-cases in your application.

For example, if it is a Hono.js application, specific guidance for Hono will be given back to the AI. Or if it's a TypeScript application, specific guidance on the right build command will be given back. This guidance is then used by the AI in your developer tool to adjust your application to ensure deployment is successful. A classic example is ensuring the server exposes port 8080.

The `review` process is designed to only take a few seconds. It greatly increases deployment success.

### Deploy

After `review` the AI will call `deploy` tool from Endgame. This will perform the following steps:

- Zips your application source code
- Uploads to secure cloud storage
- Executes build commands in Endgame's cloud environment
- Deploys to Node.js 22.x runtime on port 8080
- Provides deployment URL, status and any logs from the deployment that might be helpful to be aware of

A few key inputs that are given to the `deploy` tool and are automatically filled in via your AI are:

#### Build Configuration

- **Build Command**: Typically `npm install && npm run build`
- **Build Artifact Path**: Directory containing built application (e.g., `dist`, `build`)
- **Entrypoint File**: Main application file (defaults to `index.js`)

If anything goes wrong during the build process, logs are automatically returned from the `deploy` tool for AI to review and correct any issues. Logs are perfectly prepared and handed to AI on a silver platter whenever they are involved from Endgame. AI will receive the exact deployment logs, config settings, inputs, etc., everything it needs to solve the issue itself.

### Interact

Of course, just because a build or deploy succeeded does not mean the application is running successfully. This is why Endgame has an `interact` tool, which is called after every deployment to test the application and ensure it's running successfully. This does basic tests at this time, but they cover a ton of common issues with apps running in the cloud.

Further, the `interact` tool returns a ton of useful information so that AI can automatically debug anything that has gone wrong, such as the HTML response, screenshots and server-side logs from the request.

Between the information returned from the `deploy` command and the `interact` command your AI will be awesomely equipped to automatically resolve any issues with your live application.

### Branching

Every application with Endgame can have infinite branches. Currently, branches are automatically used if you are on a different git branch than `master` or `main`. Endgame will automatically detect this and deploy a separate instance of the application, as evidenced by a new subdomain.

You can also instruct Endgame to use a different deployment branch to explore an idea. But as a best practice we recommend creating a traditional git branch first, and letting Endgame safely deploy to that.

Branches can be used to create traditional environments, stages, previews, testing branches, etc.
