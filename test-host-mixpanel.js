import { sendEventToMixpanel } from './src/utils/mixpanel.js';
import { initializeHostDetection } from './src/utils/mcp-host-detector.js';

console.log('Testing Mixpanel with host detection...');

// Initialize host detection first
const detectedHost = initializeHostDetection();
console.log('Detected host:', detectedHost);

await sendEventToMixpanel({
  event: 'test.host.event',
  properties: { test: true }
});

console.log('Event sent with host information');
