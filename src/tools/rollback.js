// MCP tool: Rollback deployment to a previous version via management API
// Required: versionId, branch
// Returns: { content: [{ type: 'text', text: ... }] }
import { rollbackApp } from '../sdk.js';

/**
 * Rollback tool for rolling back deployment to a previous version via management API.
 * Uses the SDK to properly handle organization context and API communication.
 *
 * @param {object} params - Input parameters
 * @param {string} params.versionId - Version ID to rollback to (required)
 * @param {string} params.gitBranch - Branch to rollback (required)
 * @param {string} [params.orgName] - Organization name (optional, will be resolved from dotfile if not provided)
 * @param {string} [params.dirPath] - Directory path for resolving org from dotfile (defaults to current directory)
 * @returns {Promise<object>} MCP formatted response
 */
export async function rollbackTool({
  versionId,
  gitBranch,
  orgName,
  dirPath = process.cwd(),
}) {
  if (!versionId || !gitBranch) {
    return {
      content: [
        { type: 'text', text: 'versionId and gitBranch are required.' },
      ],
    };
  }

  try {
    // Use SDK method to rollback the app (SDK handles org resolution internally)
    const data = await rollbackApp({
      versionId,
      branch: gitBranch,
      orgName,
      dirPath,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data),
        },
      ],
    };
  } catch (error) {
    console.error('[ROLLBACK TOOL] Error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Rollback error: ${error.message}`,
        },
      ],
    };
  }
}
