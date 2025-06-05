import { review } from '../sdk.js';

/**
 * Get examples for app development based on specified parameters.
 * Uses the SDK to properly handle API communication.
 *
 * @param {object} params - Input parameters
 * @param {string} [params.runtime] - Runtime environment (e.g., 'nodejs22.x')
 * @param {string} [params.language] - Programming language (e.g., 'javascript', 'typescript')
 * @param {string} [params.packageManager] - Package manager (e.g., 'npm', 'yarn', 'pnpm')
 * @param {string[]|string} [params.frameworks] - Frameworks used (e.g., ['express', 'nextjs'])
 * @param {string} [params.appSourcePath] - Directory path for resolving app and org from dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function reviewTool(params) {
  // Use SDK method to get review examples
  const data = await review({
    runtime: params.runtime,
    language: params.language,
    packageManager: params.packageManager,
    frameworks: params.frameworks,
    appSourcePath: params.appSourcePath,
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
