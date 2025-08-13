import { rollbackApp, getAccount } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';
import { sendEventToMixpanel } from '../utils/mixpanel.js';

/**
 * Rollback tool for rolling back deployment to a previous version via management API.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled by the getAccount function.
 *
 * @param {object} params - Input parameters
 * @param {string} params.versionId - Version ID to rollback to (required)
 * @param {string} params.gitBranch - Branch to rollback (required)
 * @param {string} params.appSourcePath - Directory path for resolving org from dotfile
 * @returns {Promise<object>} MCP formatted response
 */
export async function rollbackTool({
  versionId,
  gitBranch,
  appSourcePath,
}) {
  if (!versionId || !gitBranch) {
    return {
      content: [
        { type: 'text', text: 'versionId and gitBranch are required.' },
      ],
    };
  }

  // Track start time for analytics
  const startTime = Date.now();

  try {
    // Validate local config
    const localConfig = validateAndGetLocalConfig({ appSourcePath });

    // Get account data
    const accountData = await getAccount();

    // Find org by name
    const currentOrg = findOrgByName(
      accountData?.organizations,
      localConfig?.org
    );

    // Use SDK method to rollback the app
    const data = await rollbackApp({
      orgId: currentOrg.id,
      appName: localConfig.app,
      versionId,
      branch: gitBranch,
      appSourcePath,
    });

    // Track successful rollback
    const duration = Date.now() - startTime;
    await sendEventToMixpanel({
      event: 'tool.succeeded',
      properties: {
        tool_name: 'rollback',
        duration_ms: duration,
      },
      userId: accountData.id,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Rollback error: ${error.message}`,
        },
      ],
    };
  }
}
