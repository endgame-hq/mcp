import { log } from './logger.js';

/**
 * Creates a clean error object with only essential information and returns it as stringified JSON.
 * Used for consistent error responses across the MCP server tools.
 *
 * @param {object} params - The parameters object
 * @param {string} params.error - The main error message
 * @returns {string} Stringified JSON error object with error property
 */
export const mcpError = ({ error }) => {
  const errorObj = { error };
  return JSON.stringify(errorObj);
};

/**
 * Standard error handler for MCP tools that wraps tool functions and catches errors.
 * Converts any thrown errors into clean mcpError format for consistent responses.
 * This is the only place that should use mcpError - all other code can throw standard errors.
 *
 * @param {Function} toolFunction - The tool function to wrap with error handling
 * @returns {Function} Wrapped function that handles errors consistently
 */
export const errorHandler = toolFunction => {
  return async params => {
    try {
      // Execute the tool function and return its result
      return await toolFunction(params);
    } catch (error) {
      // Log the original error for debugging and monitoring
      log('mcp.tool.error', {
        error: error.message || String(error),
        stack: error.stack,
      });

      // Extract error message from the error
      const errorMessage = error?.message || String(error);

      // Return standardized error format using mcpError
      return {
        content: [
          {
            type: 'text',
            text: mcpError({ error: errorMessage }),
          },
        ],
      };
    }
  };
};
