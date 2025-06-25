import { startDashboardAuthFlow } from '../utils/oauth-flow.js';
import { log } from '../utils/logger.js';
import { GLOBAL_CONFIG_FILENAME } from '../utils/global-config.js';

/**
 * Tool: Authenticate
 * Triggers the dashboard OAuth authentication flow to obtain and save API key.
 * This tool opens the dashboard in the browser and waits for authentication completion.
 */
export async function authenticateTool() {
  log('authenticate.start');

  try {
    const apiKey = await startDashboardAuthFlow();
    log('authenticate.success', { hasApiKey: !!apiKey });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Authentication successful! API key has been saved to ~/${GLOBAL_CONFIG_FILENAME}. You can now use other Endgame tools.`,
          }),
        },
      ],
    };
  } catch (error) {
    log('authenticate.error', { error: error.message });
    throw error;
  }
}
