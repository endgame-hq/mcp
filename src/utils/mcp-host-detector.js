import { execSync } from 'child_process';

/**
 * Detects which MCP host initiated this server process.
 * Returns a simple string identifier for the host type.
 *
 * @returns {string} Host type: 'cursor', 'claude', 'test', or 'unknown'
 */
export function detectMCPHost() {
  // Try to get parent process info first (most reliable for Cursor detection)
  try {
    if (process.ppid) {
      // Get both the command name and full command line
      const parentComm = execSync(`ps -p ${process.ppid} -o comm=`, { encoding: 'utf8' }).trim();
      const parentCmd = execSync(`ps -p ${process.ppid} -o args=`, { encoding: 'utf8' }).trim();
      
      const parentLower = (parentComm + ' ' + parentCmd).toLowerCase();
      if (parentLower.includes('cursor')) {
        return 'cursor';
      } else if (parentLower.includes('claude')) {
        return 'claude';
      }
    }
  } catch (error) {
    // Silently continue to other detection methods
  }
  
  // Check for Cursor environment variables
  if (process.env.CURSOR_TRACE_ID || Object.keys(process.env).some(key => key.includes('CURSOR'))) {
    return 'cursor';
  }

  // Check for Claude Desktop environment variables
  if (Object.keys(process.env).some(key => key.includes('CLAUDE'))) {
    return 'claude';
  }

  // Check for test environment
  if (process.env.NODE_ENV === 'test' || process.argv.some(arg => 
    arg.includes('test') || arg.includes('jest') || arg.includes('mocha')
  )) {
    return 'test';
  }

  // Check process title for additional clues
  const titleLower = process.title.toLowerCase();
  if (titleLower.includes('cursor')) {
    return 'cursor';
  } else if (titleLower.includes('claude')) {
    return 'claude';
  }

  // Check process arguments for cursor or claude
  const argsString = process.argv.join(' ').toLowerCase();
  if (argsString.includes('cursor')) {
    return 'cursor';
  } else if (argsString.includes('claude')) {
    return 'claude';
  }

  // Check execPath for cursor or claude
  const execPathLower = process.execPath.toLowerCase();
  if (execPathLower.includes('cursor')) {
    return 'cursor';
  } else if (execPathLower.includes('claude')) {
    return 'claude';
  }

  return 'unknown';
}

// Store the detected host at startup
let detectedHost = null;

/**
 * Initialize host detection at server startup.
 * Call this once when the server starts to detect and store the host type.
 *
 * @returns {string} The detected host type
 */
export function initializeHostDetection() {
  detectedHost = detectMCPHost();
  return detectedHost;
}

/**
 * Get the detected MCP host type.
 * Returns the host that was detected during initialization.
 *
 * @returns {string} Host type: 'cursor', 'claude', 'test', or 'unknown'
 */
export function getMCPHost() {
  return detectedHost || detectMCPHost();
}

/**
 * Logs MCP host detection information to help with debugging and monitoring.
 * This should be called when the MCP server starts to understand the execution context.
 */
export function logMCPHostDetection() {
  const detection = detectMCPHost();
  return detection;
}

/**
 * Returns a simple boolean indicating if the MCP server is currently being used by Cursor.
 * This is the most straightforward way to check if Cursor is the MCP client.
 *
 * @returns {boolean} True if Cursor is detected as the MCP host
 */
export function isCursorMCPHost() {
  const detection = detectMCPHost();
  return detection === 'cursor';
}  