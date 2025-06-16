import { review, validateDotFileExists, ensureDotFile, validateApiKey } from '../sdk.js';

/**
 * Get examples for app development based on specified parameters.
 * Uses the SDK to properly handle API communication.
 * Validates dotfile exists or creates it if appName is provided.
 * API key validation is handled by the errorHandler wrapper before this function is called.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appSourcePath - Directory path for resolving app and org from dotfile
 * @param {string} [params.appName] - App name (required only if .endgame file doesn't exist)
 * @param {string} [params.runtime] - Runtime environment (e.g., 'nodejs22.x')
 * @param {string} [params.language] - Programming language (e.g., 'javascript', 'typescript')
 * @param {string} [params.packageManager] - Package manager (e.g., 'npm', 'yarn', 'pnpm')
 * @param {string[]|string} [params.frameworks] - Frameworks used (e.g., ['express', 'nextjs'])
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function reviewTool(params) {
  await validateApiKey();

  // Try to validate dotfile exists, but if it doesn't and we have appName, create it
  try {
    validateDotFileExists({ appSourcePath: params.appSourcePath });
  } catch (error) {
    if (!params.appName) {
      // Re-throw the error if no appName provided
      throw error;
    }
    
    // Create the dotfile with the provided appName
    await ensureDotFile({
      appSourcePath: params.appSourcePath,
      appName: params.appName,
    });
  }

  // Use SDK method to get review examples
  const data = await review({
    runtime: params.runtime,
    language: params.language,
    packageManager: params.packageManager,
    frameworks: params.frameworks,
    appSourcePath: params.appSourcePath,
    appName: params.appName,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
