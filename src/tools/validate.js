import { validate, validateApiKey } from '../sdk.js';
import { validateDotFileExists } from '../utils/local-config.js';
import { log } from '../utils/logger.js';

/**
 * Tool: Validate
 * Validates deployment test results by polling for completion
 * API key validation is handled directly within this function.
 */
export async function validateTool({ deploymentId, appSourcePath }) {
  // Validate API key before proceeding
  await validateApiKey();

  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath });
  
  log('validate.start', { deploymentId });

  try {
    const result = await validate({
      deploymentId,
      appSourcePath,
    });

    log('validate.success', { deploymentId, hasResults: !!result });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    log('validate.error', { deploymentId, error: error.message });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
    };
  }
}
