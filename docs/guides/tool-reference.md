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

## setup-app

Sets up the app directory for deployment to the Endgame platform by ensuring a dotfile exists with essential details.

### Parameters

| Parameter       | Type     | Required | Description                                                                                                                                                  |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of the app source code directory                                                                                                   |
| `appName`       | `string` | Yes      | App name. Lowercase, alphanumeric characters and dashes only. Between 3-20 characters. Come up with an app name that fits the product and meets the criteria |

## review-app

Reviews your app and provides specific instructions, guidance and examples for building and deploying apps for the Endgame platform based on the details you provide.

### Parameters

| Parameter        | Type               | Required | Description                                                                      |
| ---------------- | ------------------ | -------- | -------------------------------------------------------------------------------- |
| `appSourcePath`  | `string`           | Yes      | Absolute path to the root of the app source code directory                       |
| `runtime`        | `string`           | No       | Runtime (e.g., nodejs22.x)                                                       |
| `language`       | `string`           | No       | Programming language (e.g., javascript, typescript)                              |
| `packageManager` | `string`           | No       | Package manager (e.g., npm, yarn, pnpm)                                          |
| `frameworks`     | `array of strings` | No       | Frameworks used in the app (e.g., express, bun, nextjs, remix, sveltekit, react) |

## deploy-app

Deploys an application to the Endgame platform which will host it on a cloud server.

### Parameters

| Parameter               | Type     | Required | Default    | Description                                                                                                                      |
| ----------------------- | -------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `appSourcePath`         | `string` | Yes      | -          | Absolute path to the root of the app source code directory                                                                       |
| `gitBranch`             | `string` | No       | -          | Git branch name (default: main)                                                                                                  |
| `buildCommand`          | `string` | No       | -          | Shell commands to install dependencies and build the project. Always include install command and combine commands with &&        |
| `buildArtifactPath`     | `string` | No       | `.`        | Path to the build artifact (relative to source root). Examples: 'dist' or 'build'. Only files in this directory will be deployed |
| `entrypointFile`        | `string` | No       | `index.js` | Path to the entrypoint file (relative to build artifact directory), e.g. 'index.js' or 'main.js'                                 |
| `deploymentDescription` | `string` | Yes      | -          | Description of the app use-case and changes made in this deployment. Minimum 240 characters required                             |

## interact-with-app

Call an App and respective Branch's endpoint and stream logs. Returns a stringified JSON object: `{ branchUrl, response, logs }`.

### Parameters

| Parameter        | Type     | Required | Default | Description                                                |
| ---------------- | -------- | -------- | ------- | ---------------------------------------------------------- |
| `appSourcePath`  | `string` | Yes      | -       | Absolute path to the root of the app source code directory |
| `gitBranch`      | `string` | No       | `main`  | Branch name                                                |
| `requestHeaders` | `any`    | No       | -       | Headers to include in the request                          |
| `apiPath`        | `string` | No       | -       | Path to call on the app                                    |
| `method`         | `string` | No       | -       | HTTP method for the request                                |
| `body`           | `any`    | No       | -       | Request body                                               |

## list-apps

List all deployed apps within an organization.

### Parameters

| Parameter       | Type     | Required | Description                                                                                                                                   |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of an app's source code directory. If not submitted, defaults to listing apps from the user's personal organization |

## delete-app

Deletes an app and all its related data (branches, versions, deployments, analytics). This is a comprehensive cleanup operation that removes all traces of an app.

### Parameters

| Parameter       | Type     | Required | Description                                                                                    |
| --------------- | -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `appName`       | `string` | Yes      | The name of the app to delete                                                                  |
| `appSourcePath` | `string` | Yes      | Absolute path to the root of an app's source code directory for resolving organization context |
