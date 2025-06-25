---
layout: doc-layout.njk
title: 'Endgame - Documentation - Tool Reference'
titleMenu: 'Tool Reference'
description: 'The Endgame MCP provides several tools for managing application deployments. Each tool is designed to work seamlessly with AI agents to automate the deployment workflow.'
active: 'docs'
permalink: '/docs/guides/tool-reference/'
docPath: '/guides/tool-reference'
order: 2
---

## review

Reviews your app and provides specific instructions and examples for building and deploying apps that will successfully deploy to the Endgame platform based on the context you provide.

### Usage Guidelines

- ALWAYS call the "review" tool before calling the "deploy" tool to ensure deployment is successful
- ALWAYS include any and all frameworks, languages, and package managers used in the app
- GENERALLY call the "review" tool before starting development to get to know how to build and deploy your app to ensure the work is compliant with the Endgame platform
- If no .endgame file exists in the appSourcePath, an error will be thrown asking you to call this tool again with an "appName" parameter

### Parameters

| Parameter        | Type               | Required | Description                                                                                                                                                      |
| ---------------- | ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appSourcePath`  | `string`           | Yes      | Absolute path to the root of the app source code directory                                                                                                       |
| `appName`        | `string`           | No       | App name. Only required if the review tool throws an error saying it is needed. Lowercase, alphanumeric characters and dashes only. Between 3-20 characters |
| `runtime`        | `string`           | No       | Runtime (e.g., nodejs22.x)                                                                                                                                       |
| `language`       | `string`           | No       | Programming language (e.g., javascript, typescript)                                                                                                              |
| `packageManager` | `string`           | No       | Package manager (e.g., npm, yarn, pnpm)                                                                                                                          |
| `frameworks`     | `array of strings` | No       | Frameworks used in the app (e.g., express, bun, nextjs, remix, sveltekit, react)                                                                                |

## deploy

Deploys an application to the Endgame platform which will host it on a cloud server, and optionally tests it in the cloud.

### Parameters

| Parameter               | Type     | Required | Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | -------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appSourcePath`         | `string` | Yes      | -          | Absolute path to the root of the app source code directory                                                                                                                                                                                                                                                                                                                                                                                                          |
| `gitBranch`             | `string` | No       | `main`     | Git branch name                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `buildCommand`          | `string` | No       | -          | Optional shell commands, combined into a single string, to install dependencies and build the project. This will be executed in the cloud. ALWAYS include the install command for the package manager used in the app (e.g. "npm install" or "pnpm install"), if needed. ALWAYS include the build command for the app (e.g. "npm run build" or "pnpm run build"), if needed. ALWAYS combine commands to be run in a single string, e.g. "npm install && npm run build" |
| `buildArtifactPath`     | `string` | No       | `.`        | The path to the build artifact (relative to the root of the source code directory). Examples: 'dist' or 'build'. Only the files in this directory will be deployed. Skip this parameter to use entire source code directory as build artifact                                                                                                                                                                                                                      |
| `entrypointFile`        | `string` | No       | `index.js` | Path to the entrypoint file for the application (relative to the root of the build artifact directory), e.g. 'index.js' or 'main.js'. Only files from build artifact directory can be entrypoint                                                                                                                                                                                                                                                                 |
| `deploymentDescription` | `string` | Yes      | -          | A description of the app use-case, followed by the changes made in this deployment. Ensure a minimum of 240 characters. Example: "This is a full-stack codebase for a SaaS solution that hosts bots for the Slack messaging platform. This deployment includes changes to the home page and a new feature that allows users to select from a variety of templates to create a new Slack bot from. The templates area available via API within new API routes." |
| `testing`               | `object` | No       | -          | Optional but recommended: enables Endgame to automatically test the app post-deployment. Currently supports testing a single path via either "server" or "webapp" mode. "server" type inspects HTTP requests to test API endpoints. "Webapp" type loads the frontend and inspects it alongside the HTTP request                                                                                                                                                    |
## validate

Validates deployment test results by polling for completion.

### Parameters

| Parameter       | Type     | Required | Description                                                                                              |
| --------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `deploymentId`  | `string` | Yes      | The deployment ID                                                                                        |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of the app source code directory for resolving organization context |

## list-apps

List all deployed apps within an organization.

### Parameters

| Parameter       | Type     | Required | Description                                                                                                                                   |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of an app's source code directory. If this isn't submitted, it will default to listing app's from the user's personal organization |

## delete-app

Deletes an app and all its related data (branches, versions, deployments, analytics). This is a comprehensive cleanup operation that removes all traces of an app.

### Parameters

| Parameter       | Type     | Required | Description                                                                                              |
| --------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `appName`       | `string` | Yes      | The name of the app to delete                                                                            |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of an app's source code directory for resolving organization context |

## authenticate

Authenticate with Endgame to obtain and save an API key. This opens the dashboard in your browser for OAuth authentication and automatically saves the API key to the global config file for future use.

### Parameters

This tool takes no parameters.
