import { listApps, validateDotFileExists, validateApiKey } from '../sdk.js';

/**
 * List all branches grouped by app name for the authenticated organization.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled directly within this function.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile (defaults to current directory)
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function appsTool({ appSourcePath = process.cwd() } = {}) {
  // Validate API key before proceeding
  await validateApiKey();

  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath });
  
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
}
