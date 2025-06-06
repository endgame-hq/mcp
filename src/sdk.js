// Helper for authenticated requests to the Management API
import fs from 'fs';
import path from 'path';
import { zipDirectory } from './utils/zip.js';
import { log } from './utils/logger.js';

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
export const readDotFile = ({ appSourcePath }) => {
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
export const writeDotFile = ({ appSourcePath, data }) => {
  const dotFilePath = path.join(appSourcePath, DOTFILE_NAME);

  /**
   * Default configuration that should always be present in the dotfile
   */
  const defaultConfig = {
    org: DEFAULT_ORG,
    settings: {},
  };

  // Read existing dotfile data first
  const existingData = readDotFile({ appSourcePath }) || {};

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
 * Sets up the application directory for deployment by ensuring a dotfile exists with essential details.
 * Creates or updates the .endgame file with org, app name, and settings.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path to create/update the .endgame file
 * @param {string} params.appName - Application name to set in the dotfile
 * @returns {Promise<object>} Setup result with success status and dotfile data
 */
export async function setup({ appSourcePath, appName }) {
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
  const existingData = readDotFile({ appSourcePath }) || {};

  // Check if app name conflicts with existing
  if (existingData.app && existingData.app !== appName) {
    throw new Error(
      `App name conflict: "${existingData.app}" already exists in "${DOTFILE_NAME}" file. Use that name or update the file manually.`
    );
  }

  // Essential details to write
  const essentialData = {
    org: 'personal',
    app: appName,
    settings: {},
  };

  // Write/update the dotfile
  writeDotFile({ appSourcePath, data: essentialData });

  return {
    success: true,
    message: `Successfully set up project with app name: ${appName}`,
    dotfileData: { ...existingData, ...essentialData },
  };
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
  const dotfileData = readDotFile({ appSourcePath }) || {};

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
 * Makes authenticated requests to the Management API.
 * Automatically includes authorization headers and validates API key.
 *
 * @param {string} path - API endpoint path
 * @param {object} [options={}] - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch response object
 */
export async function fetchManagementApi(path, options = {}) {
  const apiKey = process.env.API_KEY;
  /**
   * If no API_KEY is set, throw an error that they need to get an API Key from the Dashboard.
   */
  if (!apiKey)
    throw new Error(
      'API_KEY environment variable is not set. Get an API Key from the Dashboard.'
    );
  const baseUrl = process.env.MANAGEMENT_API_URL || 'https://api.endgame.dev';
  const url = baseUrl + path;

  log('sdk.called', {
    method: options.method || 'GET',
    url,
    body: options.body,
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const responseData = await response
    .clone()
    .json()
    .catch(() => null);
  log('sdk.responded', {
    status: response.status,
    statusText: response.statusText,
    data: responseData,
  });

  return response;
}

/**
 * Resolves organization name and returns full account data with current organization.
 * This method combines org name resolution, account fetching, and org lookup.
 * Should be called before any API operation that requires account or org info.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Object with user, organizations, and currentOrg
 */
export async function resolveAccountData({ appSourcePath }) {
  let resolvedOrgName;

  if (appSourcePath) {
    // Read existing dotfile data
    const dotfileData = readDotFile({ appSourcePath }) || {};

    // Use org name from dotfile or always default to "DEFAULT_ORG"
    resolvedOrgName = dotfileData.org || DEFAULT_ORG;
    if (!dotfileData.org) {
      writeDotFile({ appSourcePath, data: { org: resolvedOrgName } });
    }
  } else {
    resolvedOrgName = DEFAULT_ORG;
  }

  // Get account info to find the actual org
  const accountData = await getAccount();

  // Find the org by name to get the full org object
  const currentOrg = findOrgByName(accountData.organizations, resolvedOrgName);

  return {
    user: accountData.user,
    organizations: accountData.organizations,
    currentOrg,
  };
}

/**
 * Gets account information including all organizations the user is a member of.
 * This is called before other API operations to resolve organization IDs.
 *
 * @returns {Promise<object>} Account data with user info and organizations array
 */
export async function getAccount() {
  const response = await fetchManagementApi('/account');

  if (!response.ok) {
    throw new Error(
      `Failed to get account info: ${response.status} ${response.statusText}`
    );
  }

  const accountData = await response.json();

  return accountData;
}

/**
 * Gets a presigned S3 URL for file uploads.
 * Used primarily for deployment artifact uploads.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} params.zipFilename - Name of the file to upload
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Object containing the presigned URL
 */
export async function getPresignedUrl({ zipFilename, appSourcePath }) {
  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const presignPath = `/orgs/${currentOrg.id}/presign-s3-url?filename=${encodeURIComponent(zipFilename)}`;

  const response = await fetchManagementApi(presignPath);
  if (!response.ok) {
    throw new Error(
      `Failed to get presigned url: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Deploys an application by zipping the source code, uploading, and triggering a build.
 * Handles the complete deployment workflow including directory zipping, presigned URL generation,
 * file upload, and build initiation. Automatically resolves app and org names from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appSourcePath - Directory path for resolving app/org from dotfile (also the source directory to zip)
 * @param {string} [params.envFilePath] - Path to environment file to inject as .env
 * @param {string} [params.buildCommand] - Build command to execute
 * @param {string} [params.buildArtifactPath] - Path to build artifacts
 * @param {string} [params.branch] - Git branch name
 * @param {string} [params.description] - Deployment description
 * @param {string} [params.entrypoint] - Application entrypoint file
 * @param {object} [params.testing] - Optional testing configuration with required path and optional test scenarios
 * @returns {Promise<object>} Deployment result
 */
export async function deployApp({
  appSourcePath,
  envFilePath,
  buildCommand,
  buildArtifactPath,
  branch,
  description,
  entrypoint,
  testing,
}) {
  // Resolve app name and account from dotfile
  const resolvedAppName = await resolveAppName({ appSourcePath });
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  // Generate zipFilename for the deployment
  const zipFilename = `deploy-${Date.now()}.zip`;

  // Get presigned URL (this will handle org resolution internally)
  const { url: presignedUrl } = await getPresignedUrl({
    zipFilename,
    appSourcePath,
  });

  // Create zip file from source directory
  const tmpZipPath = path.join(appSourcePath, `tmp-${Date.now()}.zip`);

  // Prepare additional files (env file injection)
  const additionalFiles = envFilePath
    ? [{ src: envFilePath, dest: '.env' }]
    : [];

  await zipDirectory(appSourcePath, tmpZipPath, additionalFiles);

  // Upload zip file to S3
  await uploadZipFile(tmpZipPath, presignedUrl);

  // Prepare build parameters
  const buildParams = {
    s3Url: presignedUrl.split('?')[0],
    name: resolvedAppName,
    buildCommand,
    buildArtifactPath,
    branch,
    description,
  };

  if (entrypoint) {
    buildParams.entrypoint = entrypoint;
  }

  if (testing) {
    buildParams.testing = testing;
  }

  // Call build endpoint
  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildParams),
  });

  if (!response.ok) {
    throw new Error(
      `Deployment failed: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();

  // Clean up temporary zip file
  try {
    fs.unlinkSync(tmpZipPath);
  } catch (error) {
    log('sdk.error', {
      message: 'Failed to clean up temporary zip file',
      error: error.message,
    });
  }

  return result;
}

/**
 * Uploads a zip file to a presigned S3 URL.
 * This is an internal helper function used by deployApp.
 *
 * @param {string} filePath - Path to the zip file to upload
 * @param {string} presignedUrl - Presigned S3 URL for upload
 * @returns {Promise<void>}
 */
async function uploadZipFile(filePath, presignedUrl) {
  // Import fetch here to avoid issues with ES modules
  const fetch = (await import('node-fetch')).default;
  const fs = await import('fs');

  const fileStream = fs.createReadStream(filePath);
  const stat = fs.statSync(filePath);

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: fileStream,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': stat.size,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Lists all applications for the specified organization.
 * Returns applications grouped by branch.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} List of applications
 */
export async function listApps({ appSourcePath }) {
  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/apps`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch apps: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Lists all versions for a specific application.
 * Returns versions grouped by branch with a maximum of 20 per branch.
 * Automatically resolves app and org names from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.appSourcePath] - Directory path for resolving app and org from dotfile
 * @returns {Promise<object>} List of application versions
 */
export async function listVersions({ appSourcePath }) {
  // Resolve app name and account from dotfile
  const appName = await resolveAppName({ appSourcePath });
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(
    `/orgs/${currentOrg.id}/versions?app=${encodeURIComponent(appName)}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch versions: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Lists all deployments for the organization.
 * Returns deployments grouped by application.
 * Automatically resolves org name and ID from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} List of deployments
 */
export async function listDeployments({ appSourcePath }) {
  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  let url = `/orgs/${currentOrg.id}/deployments`;

  const response = await fetchManagementApi(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch deployments: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Rolls back an application to a previous version.
 * Requires both version ID and branch to be specified.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} params.versionId - Version ID to rollback to
 * @param {string} params.branch - Branch to rollback
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Rollback result
 */
export async function rollbackApp({ versionId, branch, appSourcePath }) {
  if (!versionId || !branch) {
    throw new Error('versionId and branch are required');
  }

  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ versionId, branch }),
  });

  if (!response.ok) {
    throw new Error(
      `Rollback failed: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Interacts with a deployed application by calling its endpoint.
 * Proxies requests to the application and returns response with logs.
 * Automatically resolves app and org names from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.branch] - Branch name (defaults to 'main')
 * @param {object} [params.headers] - Headers to forward to the application
 * @param {string} [params.path] - Path to call on the application
 * @param {string} [params.method] - HTTP method
 * @param {object} [params.body] - Request body
 * @param {string} [params.appSourcePath] - Directory path for resolving app and org from dotfile
 * @returns {Promise<object>} Application response with logs
 */
export async function interactWithApp({
  branch = 'main',
  headers = {},
  path = '',
  method,
  body,
  appSourcePath,
}) {
  // Resolve app name and account from dotfile
  const app = await resolveAppName({ appSourcePath });
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const requestBody = {
    app,
    branch,
    headers,
    path,
  };

  if (method) requestBody.method = method;
  if (body) requestBody.body = body;

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/interact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `Interaction failed: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Fetches usage analytics for the organization.
 * Returns analytics data including resource usage and metrics.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Usage analytics data
 */
export async function getUsageAnalytics({ appSourcePath }) {
  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/analytics`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch usage: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Gets examples and build instructions for application development.
 * Returns framework-specific examples and deployment guidance.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.runtime] - Runtime environment (e.g., 'nodejs22.x')
 * @param {string} [params.language] - Programming language (e.g., 'javascript', 'typescript')
 * @param {string} [params.packageManager] - Package manager (e.g., 'npm', 'yarn', 'pnpm')
 * @param {string[]|string} [params.frameworks] - Frameworks used (e.g., ['express', 'nextjs'])
 * @param {string} [params.orgName] - Organization name (will be resolved if not provided)
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Examples and build instructions
 */
export async function review({
  runtime,
  language,
  packageManager,
  frameworks,
  appSourcePath,
}) {
  /**
   * Resolve app name first from dotfile.
   * This throws an error if the dotfile is not found, or app name is not set.
   * It instructs to run the "setup" tool first to configure the project with an app name.
   */
  const appName = await resolveAppName({ appSourcePath });

  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  // Prepare request body with all parameters
  const requestBody = {};

  if (runtime) {
    requestBody.runtime = runtime;
  }

  if (language) {
    requestBody.language = language;
  }

  if (packageManager) {
    requestBody.packageManager = packageManager;
  }

  if (frameworks) {
    requestBody.frameworks = frameworks;
  }

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch examples: ${response.status} ${response.statusText}`
    );
  }

  const responseJson = await response.json();
  return responseJson;
}

/**
 * Deletes an app and all its related data (branches, versions, deployments, analytics).
 * This is a comprehensive cleanup operation that removes all traces of an app.
 * Automatically resolves org name and ID from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} params.appName - The name of the app to delete
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Deletion summary with counts of deleted records
 * @throws {Error} If app is not found or deletion fails
 */
export async function deleteApp({ appName, appSourcePath }) {
  if (!appName) {
    throw new Error('App name is required for deletion');
  }

  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(
    `/orgs/${currentOrg.id}/apps/${appName}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`App '${appName}' not found in organization`);
    }
    throw new Error(
      `Failed to delete app: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Polls for deployment test results.
 * Makes requests every second for up to 1 minute to retrieve test results.
 * Automatically resolves org name and ID from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} params.deploymentId - The deployment ID to check for test results
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Test results or error after timeout
 */
export async function getDeploymentTestResults({
  deploymentId,
  appSourcePath,
}) {
  if (!deploymentId) {
    throw new Error('Deployment ID is required');
  }

  // Resolve account and get current org
  const { currentOrg } = await resolveAccountData({ appSourcePath });

  const response = await fetchManagementApi(`/orgs/${currentOrg.id}/deployments/${deploymentId}/test-results`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get test results: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Finds an organization by name from an organizations array.
 * Used to resolve organization names to actual MongoDB ObjectIds for API calls.
 *
 * @param {object[]} organizations - Array of organization objects
 * @param {string} orgName - Organization name to find
 * @returns {object} Organization object with _id field
 * @throws {Error} If organization is not found or user doesn't have access
 */
function findOrgByName(organizations, orgName) {
  if (!organizations || !Array.isArray(organizations)) {
    throw new Error('Invalid organizations array provided');
  }

  const org = organizations.find(org => org.name === orgName);

  if (!org) {
    throw new Error(
      `Organization "${orgName}" does not exist or you don't have access to it. ` +
        `Available organizations: ${organizations.map(o => o.name).join(', ')}`
    );
  }

  return org;
}
