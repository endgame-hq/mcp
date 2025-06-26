import { listDeployments, getAccount } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';

/**
 * Lists all deployments for the organization.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled by the getAccount function.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appSourcePath - Directory path for resolving org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function deploymentsTool({ appSourcePath }) {
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

    // Use SDK method to fetch deployments
    const data = await listDeployments({
      orgId: currentOrg.id,
      appSourcePath,
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
          text: error && error.message ? error.message : String(error),
        },
      ],
    };
  }
}
