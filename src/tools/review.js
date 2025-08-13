import { review, getAccount } from '../sdk.js';
import { getApiKey } from '../utils/global-config.js';
import {
  validateAndGetLocalConfig,
  createLocalConfig,
} from '../utils/local-config.js';
import { findOrgByName } from '../utils/organization.js';
import { ERRORS } from '../utils/errors.js';
import { sendEventToMixpanel } from '../utils/mixpanel.js';

/**
 * Get examples for app development based on specified parameters.
 * Uses the SDK to properly handle API communication.
 * Validates dotfile exists or creates it if appName is provided.
 * API key validation is handled directly within this function.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appSourcePath - Directory path for resolving app and org from dotfile
 * @param {string} [params.appName] - App name (required only if .endgame file doesn't exist)
 * @param {string} [params.runtime] - Runtime environment (e.g., 'nodejs22.x')
 * @param {string} [params.language] - Programming language (e.g., 'javascript', 'typescript')
 * @param {string} [params.packageManager] - Package manager (e.g., 'npm', 'yarn', 'pnpm')
 * @param {string[]|string} [params.frameworks] - Frameworks used (e.g., ['express', 'nextjs'])
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function reviewTool({
  appSourcePath,
  appName,
  runtime,
  language,
  packageManager,
  frameworks,
}) {
  // Track start time for analytics
  const startTime = Date.now();

  /**
   * Normally, the SDK gets the API key, but this tool does it up front
   * in case the user has not authenticated yet. We can catch it early
   * and guide them through the authentication process.
   */
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(ERRORS.MISSING_API_KEY);
  }

  /**
   * This tool will throw an error if a local config file is missing,
   * telling AI to re-run the tool with the appName parameter,
   * so the local config file is created with the appName parameter.
   */
  let localConfig = null;
  try {
    localConfig = validateAndGetLocalConfig({ appSourcePath });
  } catch (error) {
    if (!appName) {
      // Re-throw the error if no appName provided
      throw error;
    }

    // Create the dotfile with the provided appName
    localConfig = await createLocalConfig({
      appSourcePath,
      appName,
    });
  }

  // Get account data
  const accountData = await getAccount();

  // Find org by name
  const currentOrg = findOrgByName(
    accountData?.organizations,
    localConfig?.org
  );

  // Use SDK method to get review examples
  const data = await review({
    orgId: currentOrg.id,
    runtime,
    language,
    packageManager,
    frameworks,
  });

  // Track successful review
  const duration = Date.now() - startTime;
  await sendEventToMixpanel({
    event: 'tool.succeeded',
    properties: {
      tool_name: 'review',
      duration_ms: duration,
    },
    userId: accountData.id,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
