import { validate, validateDotFileExists } from '../sdk.js';
import { log } from '../utils/logger.js';

/**
 * Tool: Validate
 * Validates deployment test results by polling for completion
 * API key validation is handled by the errorHandler wrapper before this function is called.
 */
export async function validateTool({ deploymentId, appSourcePath }) {
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
