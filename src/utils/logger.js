/**
 * Universal structured logger for the MCP server.
 * Logs events in the format "context.action_in_past_tense" with structured data.
 * All logs are JSON objects with an event property and relevant data.
 */

/**
 * Logs a structured event with the specified event name and data.
 * Uses console.error() as required by MCP protocol to avoid interfering with JSON-RPC communication.
 *
 * @param {string} event - Event name in format "context.action_in_past_tense"
 * @param {object} data - Additional data to include in the log entry
 */
export function log(event, data = {}) {
  console.error(
    JSON.stringify({
      event,
      ...data,
    })
  );
}
