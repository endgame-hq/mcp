import { getUsageAnalytics } from '../sdk.js';

/**
 * Usage tool for fetching organization analytics from the management API.
 * Uses the SDK to properly handle organization context and API communication.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.orgName] - Organization name (optional, will be resolved from dotfile if not provided)
 * @param {string} [params.dirPath] - Directory path for resolving org from dotfile (defaults to current directory)
 * @returns {Promise<object>} Usage analytics for the organization
 */
export async function usageTool({ orgName, dirPath = process.cwd() } = {}) {
  try {
    // Use SDK method to fetch usage analytics (SDK handles org resolution internally)
    const data = await getUsageAnalytics({ orgName, dirPath });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data),
        },
      ],
    };
  } catch (error) {
    console.error('[USAGE TOOL ERROR]', error);
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
