import { setup } from '../sdk.js';

/**
 * Sets up the application directory for deployment by ensuring a dotfile exists with essential details.
 * Uses the SDK to properly handle dotfile creation and validation.
 *
 * @param {object} params - Input parameters
 * @param {string} params.appSourcePath - Absolute path to the root of the app source code directory
 * @param {string} params.appName - Application name to set in the dotfile
 * @returns {Promise<object>} A promise resolving to an object with a content property
 */
export async function setupTool(params) {
  try {
    // Use SDK method to setup the project
    const data = await setup({
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
  } catch (error) {
    console.error('[SETUP TOOL ERROR]', error);
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
