import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Determines if the current environment is development
 * Based on NODE_ENV or if the MANAGEMENT_API_URL includes dev domains
 */
const isDevelopment = () => {
  return process.env.MANAGEMENT_API_URL && 
  process.env.MANAGEMENT_API_URL.includes('endgame-dev.dev');
};

/**
 * Gets the appropriate global config filename based on environment
 * Dev environment uses .endgamedevrc, prod uses .endgamerc
 */
const getGlobalConfigFilename = () => {
  return isDevelopment() ? '.endgamedevrc' : '.endgamerc';
};

/**
 * Gets the current global config filename (environment-aware)
 */
export const GLOBAL_CONFIG_FILENAME = getGlobalConfigFilename();

/**
 * Gets the current global config path (environment-aware)
 */
export const getGlobalConfigPath = () => {
  return path.join(os.homedir(), getGlobalConfigFilename());
};

export function readGlobalConfig() {
  try {
    const configPath = getGlobalConfigPath();
    fs.accessSync(configPath, fs.constants.F_OK);
    const fileContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
      return null;
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in ${getGlobalConfigFilename()} file. Fix the JSON and try again.`
      );
    }
    
    throw error;
  }
}

export function writeGlobalConfig(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided to writeGlobalConfig');
  }
  
  const existingData = readGlobalConfig() || {};
  const mergedData = { ...existingData, ...data };
  
  try {
    ensureGlobalConfigDir();
    const configPath = getGlobalConfigPath();
    const tempPath = `${configPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(mergedData, null, 2), 'utf8');
    
    try {
      fs.chmodSync(tempPath, 0o600);
    } catch (chmodError) {
    }
    
    fs.renameSync(tempPath, configPath);
  } catch (error) {
    throw new Error(`Failed to write ${getGlobalConfigFilename()} file: ${error.message}`);
  }
}

export function ensureGlobalConfigDir() {
  const configPath = getGlobalConfigPath();
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }
}

export function getGlobalApiKey() {
  try {
    const config = readGlobalConfig();
    return config?.apiKey || null;
  } catch (error) {
    return null;
  }
}

export function saveGlobalApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key provided');
  }
  
  writeGlobalConfig({ apiKey });
}
