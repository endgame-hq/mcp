import { ensureGlobalConfig } from './src/utils/global-config.js';
import { sendEventToMixpanel } from './src/utils/mixpanel.js';
import { initializeHostDetection } from './src/utils/mcp-host-detector.js';

console.log('Testing server startup event with host detection...');

// Initialize like the server does
const hostType = initializeHostDetection();
ensureGlobalConfig();

await sendEventToMixpanel({
  event: 'mcp.server.started',
  properties: {}
});

console.log('Server startup event sent (host should be included automatically)');
