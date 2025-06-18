import { listVersions } from '../sdk.js';

/**
 * Lists all versions for a specific application, grouped by branch.
 * Uses the SDK to properly handle organization context and API communication.
 * App name is resolved from the dotfile by the SDK.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.appSourcePath] - Directory path for resolving app and org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export const versionsTool = async ({ appSourcePath }) => {
  try {
    // Use SDK method to fetch versions (SDK handles app and org resolution internally)
    const data = await listVersions({
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
};
