import { deployApp, validateDotFileExists, validateApiKey } from '../sdk.js';
import { getEnvFileAndBranch } from '../utils/fs.js';
import { parseEnvFile } from '../utils/env.js';

/**
 * Deploy tool that handles application deployment via the SDK.
 * Determines environment files and delegates all zipping and deployment to the SDK.
 * App name is resolved from the dotfile by the SDK.
 * API key validation is handled directly within this function.
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
  // Validate API key before proceeding
  await validateApiKey();

  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath: params.appSourcePath });

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

  // Parse environment variables from the .env file
  const envVars = parseEnvFile(envFilePath);

  const buildResult = await deployApp({
    appSourcePath,
    envVars,
    buildCommand,
    buildArtifactPath,
    branch,
    description,
    entrypoint: params.entrypointFile,
    testing,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(buildResult),
      },
    ],
  };
}
