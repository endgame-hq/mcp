/**
 * Gets the MCP version from package.json
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedVersion = null;

/**
 * Gets the current MCP version
 * 
 * @returns {string} The MCP version or 'unknown' if not available
 */
export const getMcpVersion = () => {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageContent = readFileSync(packagePath, 'utf8');
    const packageInfo = JSON.parse(packageContent);
    cachedVersion = packageInfo.version || 'unknown';
    return cachedVersion;
  } catch (error) {
    cachedVersion = 'unknown';
    return cachedVersion;
  }
}; 