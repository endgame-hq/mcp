/**
 * Universal tool wrapper for MCP tools
 *
 * This module provides a universal wrapper function that can be applied to all MCP tools
 * to handle errors and track failed tool calls. Success events are tracked by individual
 * tools after successful completion.
 */

import { sendEventToMixpanel } from './mixpanel.js';
import { log } from './logger.js';
import { ensureGlobalConfig } from './global-config.js';

/**
 * Universal tool wrapper that handles errors and tracks failed tool calls
 *
 * This wrapper tracks failed tool calls using device ID from global config.
 * All errors are properly formatted for the MCP protocol following best practices.
 * Individual tools are responsible for tracking their own success events.
 *
 * @param {string} toolName - Name of the tool being wrapped
 * @param {Function} toolFunction - The original tool function to wrap
 * @returns {Function} Wrapped tool function with error handling
 */
export const withUniversalWrapper = (toolName, toolFunction) => {
  return async params => {
    try {
      // Execute the original tool function with params
      const result = await toolFunction(params);
      return result;
    } catch (error) {
      // Get device ID from global config for failed event tracking
      const globalConfig = ensureGlobalConfig();

      await sendEventToMixpanel({
        event: 'tool.failed',
        properties: {
          tool_name: toolName,
          error_type: error.constructor.name,
          params_count: params ? Object.keys(params).length : 0,
        },
        deviceId: globalConfig.deviceID,
      });

      log('mcp.tool.error', {
        error: error.message || String(error),
        stack: error.stack,
      });

      // Return properly formatted MCP error response following best practices
      // This allows the LLM to see and potentially handle the error
      const errorMessage = error?.message || String(error);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  };
};
