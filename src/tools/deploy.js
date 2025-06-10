import { deployApp } from '../sdk.js';
import { getEnvFileAndBranch } from '../utils/fs.js';

/**
 * Deploy tool that handles application deployment via the SDK.
 * Determines environment files and delegates all zipping and deployment to the SDK.
 * App name is resolved from the dotfile by the SDK.
 *
 * @param {object} params - Deployment parameters
 * @param {string} params.appSourcePath - Source directory path
 * @param {string} [params.buildCommand] - Build command
 * @param {string} [params.buildArtifactPath] - Build artifact path
 * @param {string} [params.deploymentDescription] - Deployment description
 * @param {string} [params.gitBranch] - Git branch
 * @param {string} [params.entrypointFile] - Application entrypoint file
 * @param {object} [params.testing] - Optional testing configuration with path and optional test scenarios
 * @returns {Promise<object>} MCP formatted response
 */
export async function deployTool(params) {
  try {
    console.error('[DEPLOY TOOL] called with params:', params);

    let {
      appSourcePath,
      buildCommand,
      buildArtifactPath,
      deploymentDescription: description,
      gitBranch: explicitBranch,
      testing,
    } = params;

    // If the appSourcePath is the same as the buildArtifactPath, set buildArtifactPath to '.'
    if (appSourcePath === buildArtifactPath) {
      buildArtifactPath = '.';
    }

    // Determine environment file and branch using utility functions
    const { envFilePath, branch } = await getEnvFileAndBranch(
      appSourcePath,
      explicitBranch
    );

    console.error(
      '[DEPLOY TOOL] determined branch and env file:',
      branch,
      'envFilePath:',
      envFilePath
    );

    // Deploy using SDK (SDK handles all zipping, upload, and deployment)
    const buildRequestStart = Date.now();
    const buildRequestTime = new Date(buildRequestStart).toISOString();

    console.error('[DEPLOY TOOL] calling deploy SDK method');
    const buildResult = await deployApp({
      appSourcePath,
      envFilePath,
      buildCommand,
      buildArtifactPath,
      branch,
      description,
      entrypoint: params.entrypointFile,
      testing,
    });

    console.error(`[MCP SERVER] /deploy request sent at: ${buildRequestTime}`);
    console.error('[DEPLOY TOOL] deployment complete');
    const buildRequestEnd = Date.now();
    const buildRequestElapsed = buildRequestEnd - buildRequestStart;
    console.error(
      `[MCP SERVER] /deploy request duration: ${buildRequestElapsed} ms`
    );
    console.error('[DEPLOY TOOL] build result:', buildResult);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(buildResult),
        },
      ],
    };
  } catch (error) {
    console.error('[DEPLOY TOOL ERROR]', error);
    return {
      content: [
        {
          type: 'text',
          text: error && error.message ? error.message : String(error),
        },
      ],
    };
  }
}
