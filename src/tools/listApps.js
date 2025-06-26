import { listApps, getAccount } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';

/**
 * List all branches grouped by app name for the authenticated organization.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled by the getAccount function.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appSourcePath - Directory path for resolving org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function listAppsTool({ appSourcePath }) {
  // Validate local config
  const localConfig = validateAndGetLocalConfig({ appSourcePath });

  // Get account data
  const accountData = await getAccount();

  // Find org by name
  const currentOrg = findOrgByName(
    accountData?.organizations,
    localConfig?.org
  );

  // Use SDK method to fetch apps
  const data = await listApps({ 
    orgId: currentOrg.id,
    appSourcePath 
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
  };
}
