import { listApps } from '../sdk.js';

/**
 * List all branches grouped by app name for the authenticated organization.
 * Uses the SDK to properly handle organization context and API communication.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile (defaults to current directory)
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function appsTool({ appSourcePath = process.cwd() } = {}) {
  try {
    // Use SDK method to fetch apps (SDK handles org resolution internally)
    const data = await listApps({ appSourcePath });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data),
        },
      ],
    };
  } catch (error) {
    console.error('[APPS TOOL ERROR]', error);
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
