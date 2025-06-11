import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { setupTool } from './tools/setup.js';
import { deployTool } from './tools/deploy.js';
import { appsTool } from './tools/apps.js';
import { deleteAppTool } from './tools/deleteApp.js';
// import { interactTool } from './tools/interact.js';
import { postDeployTool } from './tools/postDeploy.js';
// import { deploymentsTool } from './tools/deployments.js';
// import { versionsTool } from './tools/versions.js';
// import { usageTool } from './tools/usage.js';
// import { rollbackTool } from './tools/rollback.js';
import { reviewTool } from './tools/review.js';
import { errorHandler } from './utils/errors.js';

export function createServer() {
  const server = new McpServer({
    name: 'endgame',
    version: '1.0.0',
    capabilities: {
      tools: {},
    },
  });

  /**
   *
   * Tool: Setup
   *
   */
  server.tool(
    'setup-app',
    `Sets up the app directory for deployment to the Endgame platform by ensuring a dotfile exists with essential details. 
- ONLY run this when an error from another tool suggests to run this.`,
    {
      appSourcePath: z
        .string()
        .describe(
          'Absolute path to the root of the app source code directory.'
        ),
      appName: z
        .string()
        .regex(/^[a-z0-9-]{3,20}$/)
        .describe(
          'App name. Lowercase, alphanumeric characters and dashes only. Between 3-20 characters. Come up with an app name that fits the product and meets the criteria.'
        ),
    },
    errorHandler(setupTool)
  );

  /**
   *
   * Tool: Review
   *
   */
  server.tool(
    'review-app',
    `This tool reviews your app and provides specific instructions, guidance and examples for building and deploying apps for the Endgame platform based on the details you provide.
- ALWAYS call the "review" tool before calling the "deploy" tool to ensure deployment is successful.
- ALWAYS include ALL frameworks, languages, and package managers used in the app.
- GENERALLY call the "review" tool before starting development to get to know how to build and deploy your app to ensure the work is compliant with the Endgame platform.`,
    {
      appSourcePath: z
        .string()
        .describe(
          'Absolute path to the root of the app source code directory.'
        ),
      runtime: z.string().optional().describe('Runtime (e.g., nodejs22.x)'),
      language: z
        .string()
        .optional()
        .describe('Programming language (e.g., javascript, typescript)'),
      packageManager: z
        .string()
        .optional()
        .describe('Package manager (e.g., npm, yarn, pnpm)'),
      frameworks: z
        .array(z.string())
        .optional()
        .describe(
          'Frameworks used in the app (e.g., express, bun, nextjs, remix, sveltekit, react).'
        ),
    },
    errorHandler(reviewTool)
  );

  /**
   *
   * Tool: Deploy
   *
   */
  server.tool(
    'deploy-app',
    `Deploys an application to the Endgame platform which will host it on a cloud server, and then tests it in the cloud.
- ALWAYS call the "review" tool before calling the "deploy" tool to get guidance on how to build and deploy your app to ensure the work is compliant with the Endgame platform.
- ALWAYS call the "post-deploy" tool after the "deploy" tool to get the test results.
- ALWAYS ensure your app is a web server listening on port 8080. Apps without a back-end server (e.g. only static site files) are not supported.
- ALWAYS ensure the runtime is Node.js, version 22.x.
- ALWAYS ensure the 'appSourcePath' parameter is the absolute path to the root of the app's source code directory (not a build output directory).
- ALWAYS ensure the buildCommand includes the install command for the package manager used in the app (see example below).
- NEVER run any build, export, or install commands locally before deployment. The Endgame platform will install dependencies and execute the 'buildCommand' in the cloud.
- ALWAYS tell the user the app URL and other important information just after deployment.`,
    {
      appSourcePath: z
        .string()
        .describe(
          'Absolute path to the root of the app source code directory.'
        ),
      gitBranch: z
        .string()
        .optional()
        .describe('Git branch name (default: main)'),
      buildCommand: z
        .string()
        .optional()
        .describe(
          `An optional shell commands, combined into a single string, to install dependencies and build the project. This will be executed in the cloud.
- ALWAYS include the install command for the package manager used in the app (e.g. "npm install" or "pnpm install"), if needed.
- ALWAYS include the build command for the app (e.g. "npm run build" or "pnpm run build"), if needed.
- ALWAYS include any other commands needed to prepare and build the app (e.g. "npm run content:sync"), if needed.
- ALWAYS combine commands to be run in a single string, e.g. "npm install && npm run build".`
        ),
      buildArtifactPath: z
        .string()
        .optional()
        .default('.')
        .describe(
          "The path to the build artifact (relative to the root of the source code directory). Examples: 'dist' or 'build'. Only the files in this directory will be deployed. Skip this parameter to use entire source code directory as build artifact."
        ),
      entrypointFile: z
        .string()
        .optional()
        .default('index.js')
        .describe(
          "Path to the entrypoint file for the application (relative to the root of the build artifact directory), e.g. 'index.js' or 'main.js'. Only files from build artifact directory can be entrypoint. Optional. Defaults to 'index.js'."
        ),
      deploymentDescription: z
        .string()
        .describe(
          'A description of the app use-case, followed by the changes made in this deployment. Ensure a minimum of 240 characters. Example: "This is a full-stack codebase for a SaaS solution that hosts bots for the Slack messaging platform. This deployment includes changes to the home page and a new feature that allows users to select from a variety of templates to create a new Slack bot from. The templates area available via API within new API routes."'
        ),
      testing: z
        .object({
          path: z
            .string()
            .describe(
              'Required path to append to the app URL for testing (e.g., "/", "/login", "/dashboard", "/api/health"). Default testing for this path always captures: full-page screenshot, comprehensive test analysis with checks and validations, browser insights analysis from Chrome DevTools Protocol events, and server logs analysis.'
            ),
          mode: z
            .enum(['browser', 'api'])
            .default('browser')
            .describe(
              'Testing mode: "browser" for browser-based testing with screenshots and CDP events, "api" for API/server testing with HTTP requests and server logs only'
            ),
          method: z
            .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
            .default('GET')
            .describe(
              'HTTP method for API testing (default: GET). Only used in API mode.'
            ),
          body: z
            .string()
            .optional()
            .describe(
              'Request body for POST/PUT/PATCH requests. Should be a JSON string or raw body content. Only allowed for POST, PUT, and PATCH methods.'
            ),
          headers: z
            .record(z.string())
            .optional()
            .describe(
              'Custom HTTP headers as key-value pairs. Content-Type will be auto-set to application/json if body is provided and Content-Type is not specified.'
            ),
        })
        .refine(
          data => {
            // Validate body is only used with appropriate methods
            return !(
              data.body && !['POST', 'PUT', 'PATCH'].includes(data.method)
            );
          },
          {
            message:
              'Invalid configuration for selected mode: body only allowed for POST/PUT/PATCH methods',
          }
        )
        .optional()
        .describe('Testing configuration with required path.'),
    },
    errorHandler(deployTool)
  );

  /**
   *
   * Tool: Post Deploy
   *
   */
  server.tool(
    'post-deploy',
    `Polls for deployment test results.
- ALWAYS call this after the "deploy" tool, but print "deploy" tool output first.
- BEFORE calling this tool, inform the user that the application is currently being tested and that they will be notified once the results are available.
- Once the test results are returned, notify the user and provide a summary of the findings.`,
    {
      deploymentId: z.string().describe('The deployment ID'),
      appSourcePath: z
        .string()
        .describe(
          'Absolute path to the root of the app source code directory for resolving organization context.'
        ),
    },
    errorHandler(postDeployTool)
  );

  /**
   *
   * Tool: Rollback
   *
   */
  //   server.tool(
  //     'rollback',
  //     'Rollback a branch to a previous version (by versionId and branch)',
  //     {
  //       versionId: z.string().describe('Version ID to rollback to (required)'),
  //       gitBranch: z.string().describe('Branch to rollback (required)'),
  //     },
  //     async params => rollbackTool(params)
  //   );

  /**
   *
   * Tool: Usage
   *
   */
  //   server.tool('usage', 'Fetch usage analytics', undefined, async params =>
  //     usageTool(params)
  //   );

  /**
   *
   * Tool: Interact
   *
   */
  //   server.tool(
  //     'interact-with-app',
  //     `Call an App and respective Branch's endpoint and stream logs. Returns a stringified JSON object: { branchUrl, response, logs }.`,
  //     {
  //       gitBranch: z
  //         .string()
  //         .optional()
  //         .default('main')
  //         .describe('Branch name (default: main)'),
  //       requestHeaders: z
  //         .any()
  //         .optional()
  //         .describe('Headers to include in the request'),
  //       apiPath: z.string().optional().describe('Path to call on the app'),
  //       method: z.string().optional().describe('HTTP method for the request'),
  //       body: z.any().optional().describe('Request body'),
  //       appSourcePath: z
  //         .string()
  //         .describe('Absolute path to the root of the app source code directory'),
  //     },
  //     errorHandler(interactTool)
  //   );

  /**
   *
   * Tool: Apps
   *
   */
  server.tool(
    'list-apps',
    'List all deployed apps within an organization.',
    {
      appSourcePath: z
        .string()
        .describe(
          `Absolute path to the root of an app's source code directory. If this isn't submitted, it will default to listing app's from the user's personal organization.`
        ),
    },
    errorHandler(appsTool)
  );

  /**
   *
   * Tool: Delete App
   *
   */
  server.tool(
    'delete-app',
    'Deletes an app and all its related data (branches, versions, deployments, analytics). This is a comprehensive cleanup operation that removes all traces of an app.',
    {
      appName: z.string().describe('The name of the app to delete'),
      appSourcePath: z
        .string()
        .describe(
          `Absolute path to the root of an app's source code directory for resolving organization context.`
        ),
    },
    errorHandler(deleteAppTool)
  );

  /**
   *
   * Tool: Versions
   *
   */
  //   server.tool(
  //     'versions',
  //     'List all versions for an app, grouped by branch (max 20 per branch). App name is resolved from dotfile.',
  //     undefined,
  //     async params => versionsTool(params)
  //   );

  /**
   *
   * Tool: Deployments
   *
   */
  //   server.tool(
  //     'deployments',
  //     'List all deployments grouped by app.',
  //     undefined,
  //     async params => deploymentsTool(params)
  //   );

  return server;
}

export async function runServerWithStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
