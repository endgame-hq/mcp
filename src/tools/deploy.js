import { getAccount, deployApp } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';
import { getEnvFileAndBranch } from '../utils/fs.js';

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
export async function deployTool({
  appSourcePath,
  gitBranch,
  buildCommand,
  buildArtifactPath,
  entrypointFile,
  deploymentDescription,
  testing,
}) {
  // Validate local config
  const localConfig = validateAndGetLocalConfig({ appSourcePath });

  // Get account data
  const accountData = await getAccount();

  // Find org by name
  const currentOrg = findOrgByName(
    accountData?.organizations,
    localConfig?.org
  );

  // If the appSourcePath is the same as the buildArtifactPath, set buildArtifactPath to '.'
  if (appSourcePath === buildArtifactPath) {
    buildArtifactPath = '.';
  }

  // Determine environment file and branch using utility functions
  const { envFilePath, branch } = await getEnvFileAndBranch(
    appSourcePath,
    gitBranch
  );

  const buildResult = await deployApp({
    orgId: currentOrg.id,
    appName: localConfig.app,
    appSourcePath,
    envFilePath,
    buildCommand,
    buildArtifactPath,
    branch,
    description: deploymentDescription,
    entrypoint: entrypointFile,
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
