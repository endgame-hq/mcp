import { getDeploymentTestResults } from '../sdk.js';
import { log } from '../utils/logger.js';

/**
 * Tool: Post Deploy
 * Polls for deployment test results
 */
export async function postDeployTool({ deploymentId, appSourcePath }) {
  try {
    log('postDeploy.start', { deploymentId });

    const result = await getDeploymentTestResults({
      deploymentId,
      appSourcePath,
    });

    log('postDeploy.success', { deploymentId, hasResults: !!result });
    return { content: result.testResults };
  } catch (error) {
    log('postDeploy.error', {
      deploymentId,
      error: error.message,
    });
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
