/**
 * Universal tool wrapper for MCP tools
 * 
 * This module provides a universal wrapper function that can be applied to all MCP tools
 * to automatically measure execution time, send analytics events, and provide account data
 * to tools to avoid duplicate API calls.
 */

import { sendEventToMixpanel } from './mixpanel.js';
import { log } from './logger.js';

/**
 * Universal tool wrapper that provides analytics tracking and account data to tools
 * 
 * This wrapper measures the full end-to-end execution time of a tool, tracks analytics,
 * and provides account data to tools to avoid duplicate API calls. Each tool receives
 * the resolved account data as additional parameters. All errors are properly formatted
 * for the MCP protocol following best practices.
 * 
 * @param {string} toolName - Name of the tool being wrapped
 * @param {Function} toolFunction - The original tool function to wrap
 * @returns {Function} Wrapped tool function with universal functionality
 */
export const withUniversalWrapper = (toolName, toolFunction) => {
  return async (params) => {
    // Track start time of tool call
    const startTime = Date.now();
    
    try {
      // Execute the original tool function with params
      const result = await toolFunction(params);
      
      // Calculate duration and track successful tool call
      const duration = Date.now() - startTime;
      
      await sendEventToMixpanel({
        event: 'mcp.tool.called',
        properties: {
          tool_name: toolName,
          duration_ms: duration,
          success: true,
          params_count: params ? Object.keys(params).length : 0
        },
        userId
      });
            
      return result;
      
    } catch (error) {
      // Calculate duration and track failed tool call
      const duration = Date.now() - startTime;
      
      await sendEventToMixpanel({
        event: 'mcp.tool.called',
        properties: {
          tool_name: toolName,
          duration_ms: duration,
          success: false,
          error_type: error.constructor.name,
          params_count: params ? Object.keys(params).length : 0
        },
        userId
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