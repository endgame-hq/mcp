import { validate, validateDotFileExists, validateApiKey } from '../sdk.js';
import { log } from '../utils/logger.js';

/**
 * Tool: Validate
 * Validates deployment test results by polling for completion
 */
export async function validateTool({ deploymentId, appSourcePath }) {
  // Validate API key before proceeding
  await validateApiKey();

  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath });
  
  log('validate.start', { deploymentId });

  const result = await validate({
    deploymentId,
    appSourcePath,
  });

  log('validate.success', { deploymentId, hasResults: !!result });
  return { content: result.testResults };
}
