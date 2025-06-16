import fs from 'fs';
import path from 'path';
import os from 'os';

export const GLOBAL_CONFIG_FILENAME = '.endgamerc';
export const GLOBAL_CONFIG_PATH = path.join(os.homedir(), GLOBAL_CONFIG_FILENAME);

export function readGlobalConfig() {
  try {
    fs.accessSync(GLOBAL_CONFIG_PATH, fs.constants.F_OK);
    const fileContent = fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
      return null;
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in ${GLOBAL_CONFIG_FILENAME} file. Fix the JSON and try again.`
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
    const tempPath = `${GLOBAL_CONFIG_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(mergedData, null, 2), 'utf8');
    
    try {
      fs.chmodSync(tempPath, 0o600);
    } catch (chmodError) {
    }
    
    fs.renameSync(tempPath, GLOBAL_CONFIG_PATH);
  } catch (error) {
    throw new Error(`Failed to write ${GLOBAL_CONFIG_FILENAME} file: ${error.message}`);
  }
}

export function ensureGlobalConfigDir() {
  const configDir = path.dirname(GLOBAL_CONFIG_PATH);
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
