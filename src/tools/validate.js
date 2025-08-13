import { validate, getAccount } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';
import { log } from '../utils/logger.js';
import { sendEventToMixpanel } from '../utils/mixpanel.js';

/**
 * Tool: Validate
 * Validates deployment test results by polling for completion.
 * API key validation is handled by the getAccount function.
 *
 * @param {object} params - Validation parameters
 * @param {string} params.deploymentId - Deployment ID to validate
 * @param {string} params.appSourcePath - Source directory path
 * @returns {Promise<object>} MCP formatted response
 */
export async function validateTool({ deploymentId, appSourcePath }) {
  // Track start time for analytics
  const startTime = Date.now();

  // Validate local config
  const localConfig = validateAndGetLocalConfig({ appSourcePath });

  // Get account data
  const accountData = await getAccount();

  // Find org by name
  const currentOrg = findOrgByName(
    accountData?.organizations,
    localConfig?.org
  );

  log('validate.start', { deploymentId });

  try {
    const result = await validate({
      orgId: currentOrg.id,
      appName: localConfig.app,
      deploymentId,
      appSourcePath,
    });

    log('validate.success', { deploymentId, hasResults: !!result });

    // Track successful validation
    const duration = Date.now() - startTime;
    await sendEventToMixpanel({
      event: 'tool.succeeded',
      properties: {
        tool_name: 'validate',
        duration_ms: duration,
      },
      userId: accountData.id,
    });

    // Filter out screenshot from the result
    const filteredResult = { ...result };
    if (filteredResult.screenshot) {
      delete filteredResult.screenshot;
    }
    // Also check for nested screenshots in case structure is different
    if (filteredResult.data?.screenshot) {
      filteredResult.data = { ...filteredResult.data };
      delete filteredResult.data.screenshot;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filteredResult),
        },
      ],
    };
  } catch (error) {
    log('validate.error', { deploymentId, error: error.message });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
    };
  }
}
