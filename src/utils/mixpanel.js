/**
 * Mixpanel integration for the MCP server
 * 
 * This module handles analytics tracking for MCP events. It ensures proper device 
 * identification and respects environment configuration to avoid sending events 
 * during development or testing.
 */

import Mixpanel from 'mixpanel';
import { ensureGlobalConfig } from './global-config.js';
import { log } from './logger.js';
import { getMCPHost } from './mcp-host-detector.js';
import { getMcpVersion } from './package-info.js';

let mixpanelClient = null;

// Production Mixpanel project token
const MIXPANEL_PROJECT_TOKEN = '3a77e40fe4752276955a0f1e1067f6cc';

/**
 * Determines if Mixpanel events should be sent
 * Only sends events if MANAGEMENT_API_URL is not set (not in development/testing)
 * 
 * @returns {boolean} True if events should be sent, false otherwise
 */
const shouldSendEvents = () => {
  return !process.env.MANAGEMENT_API_URL;
};

/**
 * Initialize Mixpanel client with project token
 * 
 * Creates a singleton Mixpanel client instance. Only initializes if events should be sent.
 * 
 * @returns {Mixpanel|null} Mixpanel client instance or null if not configured
 */
const getMixpanelClient = () => {
  if (!shouldSendEvents()) {
    return null;
  }

  if (!mixpanelClient) {
    try {
      mixpanelClient = Mixpanel.init(MIXPANEL_PROJECT_TOKEN, {
        debug: false
      });
    } catch (error) {
      log('mixpanel.initialization_failed', { error: error.message });
      return null;
    }
  }
  
  return mixpanelClient;
};

/**
 * Formats event properties for Mixpanel consumption
 * 
 * Converts event data properties into a format suitable for Mixpanel,
 * handling type conversion and property naming conventions.
 * 
 * @param {Object} properties - Raw event properties
 * @returns {Object} Formatted properties for Mixpanel
 */
const formatEventProperties = (properties) => {
  const formatted = {};
  
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== null) {
      // Convert camelCase to snake_case for consistency
      const formattedKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      // Handle different value types
      if (typeof value === 'object' && !Array.isArray(value)) {
        formatted[formattedKey] = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        formatted[formattedKey] = value;
      } else if (typeof value === 'number') {
        formatted[formattedKey] = value;
      } else {
        formatted[formattedKey] = String(value);
      }
    }
  }
  
  return formatted;
};

/**
 * Sends an event to Mixpanel with proper device identification
 * 
 * Ensures deviceID exists before sending any events. Uses deviceID for anonymous
 * tracking and user ID for authenticated tracking when available.
 * 
 * @param {Object} params - Event parameters
 * @param {string} params.event - The event name
 * @param {Object} [params.properties] - Event properties
 * @param {string} [params.userId] - Optional user ID for authenticated events
 * @returns {Promise<void>}
 */
export const sendEventToMixpanel = async ({ event, properties = {}, userId = null }) => {
  try {
    const client = getMixpanelClient();
    
    if (!client) {
      return;
    }

    // Always ensure global config is initialized before sending events
    const config = ensureGlobalConfig();
    const deviceID = config.deviceID;
    
    // Ensure event name starts with "mcp."
    const eventName = event.startsWith('mcp.') ? event : `mcp.${event}`;
    
    // Use userId if provided, otherwise use deviceID for anonymous tracking
    const distinctId = userId || deviceID;
    
    // Format event properties for Mixpanel
    const mixpanelProperties = {
      ...formatEventProperties(properties),
      timestamp: new Date(),
      device_id: deviceID,
      mcp_host: getMCPHost(),
      mcp_version: getMcpVersion(),
      ...(userId && { user_id: userId })
    };

    // Identify user if userId is provided
    if (userId) {
      client.people.set(distinctId, {
        last_seen: new Date(),
        device_id: deviceID
      });
    }

    // Track the event
    client.track(eventName, {
      distinct_id: distinctId,
      ...mixpanelProperties
    });

  } catch (error) {
    log('mixpanel.event_failed', { 
      error: error.message, 
      event: eventName 
    });
  }
}; 