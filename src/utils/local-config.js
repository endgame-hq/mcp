import fs from 'fs';
import path from 'path';
import { ERRORS } from './errors.js';

// Global configuration
export const DOTFILE_NAME = '.endgame';
export const DEFAULT_ORG = 'personal';

/**
 * Reads the configuration from the .endgame dotfile in the specified directory.
 * Returns null if the file doesn't exist, throws error for invalid JSON.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to look for the .endgame file
 * @returns {object|null} Parsed JSON data or null if file doesn't exist
 */
export const readLocalConfig = ({ appSourcePath }) => {
  const dotFilePath = path.join(appSourcePath, DOTFILE_NAME);

  try {
    // Check if file exists
    fs.accessSync(dotFilePath, fs.constants.F_OK);

    // Read and parse the file
    const fileContent = fs.readFileSync(dotFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist, return null
    if (error.message.includes('ENOENT')) {
      return null;
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in ${DOTFILE_NAME} file. Fix the JSON and try again.`
      );
    }

    // Re-throw other errors
    throw error;
  }
};

/**
 * Writes configuration data to the .endgame dotfile in the specified directory.
 * Merges with existing data, preserving existing values unless explicitly overridden.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to write the .endgame file
 * @param {object} params.data - Data to write to the file
 */
export const writeLocalConfig = ({ appSourcePath, data }) => {
  const dotFilePath = path.join(appSourcePath, DOTFILE_NAME);

  /**
   * Default configuration that should always be present in the dotfile
   */
  const defaultConfig = {
    org: DEFAULT_ORG,
    settings: {},
  };

  // Read existing dotfile data first
  const existingData = readLocalConfig({ appSourcePath }) || {};

  // Merge in the following order: defaults -> existing data -> new data
  const endgameData = {
    ...defaultConfig,
    ...existingData,
    ...data,
  };

  try {
    fs.writeFileSync(dotFilePath, JSON.stringify(endgameData, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to write ${DOTFILE_NAME} file: ${error.message}`);
  }
};

/**
 * Ensures the application directory has a dotfile with essential details for deployment.
 * Creates or updates the .endgame file with org, app name, and settings.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to create/update the .endgame file
 * @param {string} params.appName - Application name to set in the dotfile
 * @returns {Promise<object>} Setup result with success status and dotfile data
 */
export async function createLocalConfig({ appSourcePath, appName }) {
  if (!appName) {
    throw new Error('appName is required for setup');
  }

  // Validate appName format (same as deploy tool requirements)
  const appNameRegex = /^[a-z0-9-]{3,20}$/;
  if (!appNameRegex.test(appName)) {
    throw new Error(
      'appName must be lowercase, alphanumeric characters and dashes only, between 3-20 characters'
    );
  }

  // Read existing dotfile data
  const existingData = readLocalConfig({ appSourcePath }) || {};

  // Check if app name conflicts with existing
  if (existingData.app && existingData.app !== appName) {
    throw new Error(
      `App name conflict: "${existingData.app}" already exists in "${DOTFILE_NAME}" file. Use that name or update the file manually.`
    );
  }

  // Essential details to write
  const essentialData = {
    app: appName,
  };

  // Write/update the dotfile
  writeLocalConfig({ appSourcePath, data: essentialData });

  return essentialData;
}

/**
 * Resolves the application name from the .endgame file.
 * Requires the setup tool to be run first if no app name is found.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to look for the .endgame file
 * @returns {Promise<string>} Resolved application name
 */
export async function resolveAppName({ appSourcePath }) {
  // Read existing dotfile data
  const dotfileData = readLocalConfig({ appSourcePath }) || {};

  // Throw error if dotfile is not found
  if (!dotfileData) {
    throw new Error(
      `No "${DOTFILE_NAME}" file found in the root directory. Please run the "setup" tool first to configure your app for deployment.`
    );
  }

  // Check if app name exists in dotfile
  if (!dotfileData.app) {
    throw new Error(
      `No "app" property for your app's name found in "${DOTFILE_NAME}" file. Please run the "setup" tool first with an app name to configure your app for deployment.`
    );
  }

  return dotfileData.app;
}

/**
 * Validates that the .endgame dotfile exists in the specified directory.
 * Throws a standardized error if it doesn't exist, instructing to use the review tool.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to look for the .endgame file
 * @throws {Error} If dotfile doesn't exist or is invalid
 */
export const validateDotFileExists = ({ appSourcePath }) => {
  const dotfileData = readLocalConfig({ appSourcePath });
  
  if (!dotfileData) {
    throw new Error(
      'No ".endgame" file found in the root directory. Please call the "review-app" tool with an "appName" parameter and the ".endgame" file will be created for you and your app will be set up for deployment to Endgame. The app name must be lowercase, alphanumeric characters and dashes only, between 3-20 characters.'
    );
  }
  
  if (!dotfileData.app) {
    throw new Error(
      'No "app" property found in ".endgame" file. Please call the "review-app" tool with an "appName" parameter to set up your app for deployment.'
    );
  }
  
  return dotfileData;
};

/**
 * Validates that the .endgame file exists and has required properties.
 * Fetches and returns the local config file contents.
 * 
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to look for the .endgame file
 * @returns {object} The local config data from the .endgame file
 * @throws {Error} If dotfile doesn't exist or lacks required app property
 */
export const validateAndGetLocalConfig = ({ appSourcePath }) => {
  const dotfileData = readLocalConfig({ appSourcePath });
  
  if (!dotfileData) {
    throw new Error(ERRORS.MISSING_LOCAL_ENDGAME_FILE);
  }
  
  if (!dotfileData.app) {
    throw new Error(ERRORS.MISSING_LOCAL_ENDGAME_FILE_APP_PROPERTY);
  }

  // If no "org" property, set it to the default org
  if (!dotfileData.org) {
    dotfileData.org = DEFAULT_ORG;
  }
  
  return dotfileData;
}; 