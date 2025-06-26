import { deleteApp, getAccount } from '../sdk.js';
import { findOrgByName } from '../utils/organization.js';
import { validateAndGetLocalConfig } from '../utils/local-config.js';

/**
 * Deletes an app and all its related data (branches, versions, deployments, analytics).
 * This is a comprehensive cleanup operation that removes all traces of an app.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled by the getAccount function.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appName - The name of the app to delete
 * @param {string} params.appSourcePath - Directory path for resolving org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property containing deletion summary
 */
export async function deleteAppTool({
  appName,
  appSourcePath,
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

  if (!appName) {
    throw new Error('App name is required for deletion');
  }

  // Use SDK method to delete app
  const data = await deleteApp({ 
    orgId: currentOrg.id,
    appName, 
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
