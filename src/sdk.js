// Helper for authenticated requests to the Management API
import { createTempZip } from './utils/zip.js';
import { log } from './utils/logger.js';
import {
  readLocalConfig,
  writeLocalConfig,
  DEFAULT_ORG,
  resolveAppName,
} from './utils/local-config.js';
import { findOrgByName } from './utils/organization.js';
import { uploadZipFile } from './utils/upload.js';
import { getGlobalConfig } from './utils/global-config.js';
import { ERRORS } from './utils/errors.js';

/**
 * Makes authenticated requests to the Management API.
 * Automatically includes authorization headers and validates API key.
 *
 * @param {string} path - API endpoint path
 * @param {object} [options={}] - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch response object
 */
export async function fetchManagementApi({ path, options = {} }) {
  // Getch API Key
  let apiKey = process.env.API_KEY || null;
  if (!apiKey) {
    // Get global config
    const globalConfig = getGlobalConfig();
    apiKey = globalConfig?.apiKey;
  }
  if (!apiKey) {
    throw new Error(ERRORS.MISSING_API_KEY);
  }

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
 * Gets account information including all organizations the user is a member of.
 * This is called before other API operations to resolve organization IDs.
 *
 * @returns {Promise<object>} Account data with user info and organizations array
 */
export async function getAccount() {
  const response = await fetchManagementApi({ path: '/account' });

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
 * @param {object} [params.accountData] - Pre-resolved account data to avoid duplicate API calls
 * @returns {Promise<object>} Object containing the presigned URL
 */
export async function getPresignedUrl({ orgId, zipFilename }) {
  const presignPath = `/orgs/${orgId}/presign-s3-url?filename=${encodeURIComponent(zipFilename)}`;

  const response = await fetchManagementApi({ path: presignPath });
  if (!response.ok) {
    throw new Error(
      `Failed to get presigned url: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
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
 * @param {string} [params.appName] - App name (optional, will be resolved from dotfile if not provided)
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Examples and build instructions
 */
export async function review({
  orgId,
  runtime,
  language,
  packageManager,
  frameworks,
}) {
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

  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/review`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
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
 * Deploys an application by zipping the source code, uploading, and triggering a build.
 * Handles the complete deployment workflow including directory zipping, presigned URL generation,
 * file upload, and build initiation. Automatically resolves app and org names from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} params.orgId - Organization ID
 * @param {string} params.appName - App name
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
  orgId,
  appName,
  appSourcePath,
  envFilePath,
  buildCommand,
  buildArtifactPath,
  branch,
  description,
  entrypoint,
  testing,
}) {
  // Generate zipFilename for the deployment
  const zipFilename = `deploy-${Date.now()}.zip`;

  // Get presigned URL (pass account data to avoid duplicate calls)
  const { url: presignedUrl } = await getPresignedUrl({
    orgId,
    zipFilename,
  });

  // Create zip file from source directory using temp directory
  const additionalFiles = envFilePath
    ? [{ src: envFilePath, dest: '.env' }]
    : [];

  const { zipPath: tmpZipPath, cleanup } = await createTempZip(
    appSourcePath,
    additionalFiles,
    `${appName}-`
  );

  try {
    // Upload zip file to S3
    await uploadZipFile(tmpZipPath, presignedUrl);

    // Prepare build parameters
    const buildParams = {
      s3Url: presignedUrl.split('?')[0],
      name: appName,
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
    const response = await fetchManagementApi({
      path: `/orgs/${orgId}/deploy`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildParams),
      },
    });

    if (!response.ok) {
      let errorMessage = `Deployment failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // JSON parsing failed, use the default error message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } finally {
    // Always clean up temporary zip file, even on error
    await cleanup();
  }
}

/**
 * Lists all applications for the specified organization.
 * Returns applications grouped by branch.
 * Automatically resolves org name and ID from dotfile if not provided.
 *
 * @param {object} params - The parameters object
 * @param {string} [params.orgId] - Organization ID
 * @returns {Promise<object>} List of applications
 */
export async function listApps({ orgId }) {
  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/apps`,
    options: {
      method: 'GET',
    },
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
 * @param {object} [params._accountData] - Pre-resolved account data to avoid duplicate API calls
 * @returns {Promise<object>} List of application versions
 */
export async function listVersions({ orgId, appName }) {
  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/versions?app=${encodeURIComponent(appName)}`,
  });

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
 * @param {string} [params.orgId] - Organization ID
 * @returns {Promise<object>} List of deployments
 */
export async function listDeployments({ orgId }) {
  let url = `/orgs/${orgId}/deployments`;

  const response = await fetchManagementApi({ path: url, method: 'GET' });

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
export async function rollbackApp({ orgId, versionId, branch }) {
  if (!versionId || !branch) {
    throw new Error('versionId and branch are required');
  }

  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/rollback`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ versionId, branch }),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Rollback failed: ${response.status} ${response.statusText}`
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
export async function getUsageAnalytics({ orgId }) {
  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/analytics`,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch usage: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
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
export async function deleteApp({ orgId, appName }) {
  if (!appName) {
    throw new Error('App name is required for deletion');
  }

  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/apps/${appName}`,
    options: {
      method: 'DELETE',
    },
  });

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
 * Validates deployment test results by polling for completion.
 * Makes requests every second for up to 1 minute to retrieve test results.
 * Automatically resolves org name and ID from dotfile.
 *
 * @param {object} params - The parameters object
 * @param {string} params.deploymentId - The deployment ID to check for test results
 * @param {string} [params.appSourcePath] - Directory path for resolving org from dotfile
 * @returns {Promise<object>} Test results or error after timeout
 */
export async function validate({ orgId, deploymentId }) {
  if (!deploymentId) {
    throw new Error('Deployment ID is required');
  }

  const response = await fetchManagementApi({
    path: `/orgs/${orgId}/deployments/${deploymentId}/test-results`,
    options: {
      method: 'GET',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get test results: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}
