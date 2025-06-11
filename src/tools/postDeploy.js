import { getDeploymentTestResults, validateDotFileExists } from '../sdk.js';
import { log } from '../utils/logger.js';

/**
 * Tool: Post Deploy
 * Polls for deployment test results
 * API key validation is handled by the errorHandler wrapper before this function is called.
 */
export async function postDeployTool({ deploymentId, appSourcePath }) {
  // Validate that dotfile exists before proceeding
  validateDotFileExists({ appSourcePath });
  
  log('postDeploy.start', { deploymentId });

  const result = await getDeploymentTestResults({
    deploymentId,
    appSourcePath,
  });

  log('postDeploy.success', { deploymentId, hasResults: !!result });
  return { content: result.testResults };
}
