import { interactWithApp } from '../sdk.js';

/**
 * Interacts with a deployed application by calling its endpoint and streaming logs.
 * Uses the SDK to properly handle organization context and API communication.
 * App name is resolved from the dotfile by the SDK.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.gitBranch] - Branch name (default: 'main')
 * @param {object} [params.requestHeaders] - Headers to forward to the Lambda URL
 * @param {string} [params.apiPath] - Path to call on the app
 * @param {string} [params.method] - HTTP method for the request
 * @param {object} [params.body] - Request body
 * @param {string} [params.appSourcePath] - Directory path for resolving app and org from dotfile
 * @returns {Promise<object>} Response object containing branchUrl, response, and logs
 */
export async function interactTool({
  gitBranch = 'main',
  requestHeaders = {},
  apiPath = '',
  method,
  body,
  appSourcePath,
}) {
  try {
    // Use SDK method to interact with the app (SDK handles app and org resolution internally)
    const json = await interactWithApp({
      branch: gitBranch,
      headers: requestHeaders,
      path: apiPath,
      method,
      body,
      appSourcePath,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(json),
        },
      ],
    };
  } catch (err) {
    console.error('[INTERACT TOOL] Error interacting with app:', err);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: err.message }),
        },
      ],
    };
  }
}
