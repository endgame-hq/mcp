import { listDeployments } from '../sdk.js';

/**
 * Lists all deployments for the organization.
 * Uses the SDK to properly handle organization context and API communication.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function deploymentsTool({ appSourcePath } = {}) {
  try {
    console.error('[DEPLOYMENTS TOOL] Fetching deployments');

    // Use SDK method to fetch deployments (SDK handles org resolution internally)
    const data = await listDeployments({
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
    console.error('[DEPLOYMENTS TOOL ERROR]', error);
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
