#!/usr/bin/env node
import { validateApiKey } from './src/sdk.js';

async function testOAuth() {
  try {
    delete process.env.API_KEY;
    
    console.log('Testing OAuth flow...');
    await validateApiKey();
    console.log('OAuth test completed successfully!');
  } catch (error) {
    console.error('OAuth test failed:', error.message);
    process.exit(1);
  }
}

testOAuth();
