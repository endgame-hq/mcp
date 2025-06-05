#!/usr/bin/env node
import { runServerWithStdio } from './src/server.js';

runServerWithStdio().catch(error => {
  console.error('Fatal error: MCP Server failed to start:', error);
  process.exit(1);
});
