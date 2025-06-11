import { deleteApp, validateDotFileExists } from '../sdk.js';

/**
 * Deletes an app and all its related data (branches, versions, deployments, analytics).
 * This is a comprehensive cleanup operation that removes all traces of an app.
 * Uses the SDK to properly handle organization context and API communication.
 * API key validation is handled by the errorHandler wrapper before this function is called.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appName - The name of the app to delete
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile (defaults to current directory)
 * @returns {Promise<object>} A promise resolving to an object with a content property containing deletion summary
 */
export async function deleteAppTool({
  appName,
  appSourcePath = process.cwd(),
} = {}) {
  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath });
  
  if (!appName) {
    throw new Error('App name is required for deletion');
  }

  // Use SDK method to delete app (SDK handles org resolution internally)
  const data = await deleteApp({ appName, appSourcePath });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
  };
}
