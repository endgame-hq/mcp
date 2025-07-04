import {
  fetchManagementApi,
  resolveAccountData,
  resolveAppName,
} from '../sdk.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yauzl from 'yauzl';
import { promisify } from 'util';

/**
 * Extract a zip file to a directory
 * @param {string} zipPath - Path to the zip file
 * @param {string} destDir - Destination directory
 */
async function unzip(zipPath, destDir) {
  const openZip = promisify(yauzl.open);
  const zipfile = await openZip(zipPath, { lazyEntries: true });

  return new Promise((resolve, reject) => {
    zipfile.readEntry();
    zipfile.on('entry', entry => {
      const destPath = path.join(destDir, entry.fileName);

      if (/\/$/.test(entry.fileName)) {
        // Directory entry
        fs.mkdirSync(destPath, { recursive: true });
        zipfile.readEntry();
      } else {
        // File entry
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) return reject(err);
          readStream.on('end', () => zipfile.readEntry());
          readStream.pipe(fs.createWriteStream(destPath));
        });
      }
    });
    zipfile.on('end', resolve);
    zipfile.on('error', reject);
  });
}

/**
 * Download file from presigned URL
 * @param {string} url - Presigned URL
 * @param {string} destPath - Local destination path
 */
async function downloadFromUrl(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

/**
 * Check if VS Code CLI is available
 * @returns {Promise<boolean>} Whether VS Code CLI is available
 */
async function isVSCodeInstalled() {
  try {
    const { execSync } = await import('child_process');
    // Try to run code --version
    execSync('code --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install the Endgame VS Code extension
 * @returns {Promise<boolean>} Whether installation was successful
 */
async function installVSCodeExtension() {
  try {
    const { execSync } = await import('child_process');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');

    // Get the directory of this file and navigate to the project root
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    // Find the .vsix file in the vscode-extension directory
    const extensionDir = path.join(projectRoot, 'vscode-extension');

    if (!fs.existsSync(extensionDir)) {
      console.error(
        '[MERGE FUTURE-STATE] VS Code extension directory not found:',
        extensionDir
      );
      return false;
    }

    const vsixFiles = fs
      .readdirSync(extensionDir)
      .filter(file => file.endsWith('.vsix'));

    if (vsixFiles.length === 0) {
      console.error(
        '[MERGE FUTURE-STATE] No .vsix file found in vscode-extension directory'
      );
      return false;
    }

    // Use the first .vsix file found
    const vsixPath = path.join(extensionDir, vsixFiles[0]);

    console.error(
      `[MERGE FUTURE-STATE] Installing VS Code extension from: ${vsixPath}`
    );

    // Install the extension
    execSync(`cursor --install-extension "${vsixPath}"`, { stdio: 'inherit' });

    console.error(
      '[MERGE FUTURE-STATE] VS Code extension installed successfully'
    );

    // Give VS Code a moment to start the extension
    await new Promise(resolve => setTimeout(resolve, 3000));

    return true;
  } catch (error) {
    console.error(
      '[MERGE FUTURE-STATE] Failed to install VS Code extension:',
      error.message
    );
    return false;
  }
}

/**
 * Check if VS Code extension server is available
 * @returns {Promise<{available: boolean, workspaceId?: string}>} Whether the server is available and workspace info
 */
async function isVSCodeExtensionAvailable() {
  try {
    const response = await fetch('http://localhost:3111/health');
    const data = await response.json();
    return {
      available: data.status === 'ok' && data.extension === 'endgame',
      workspaceId: data.workspaceId,
    };
  } catch (error) {
    return { available: false };
  }
}

/**
 * Call VS Code extension command via HTTP
 * @param {string} command - The command to execute
 * @param {any[]} args - Arguments for the command
 * @param {string} workspaceId - The workspace ID to target
 * @returns {Promise<any>} Command result
 */
async function callVSCodeCommand(command, args = [], workspaceId) {
  const response = await fetch('http://localhost:3111/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command,
      args,
      workspaceId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to execute VS Code command');
  }

  return response.json();
}

/**
 * Analyze differences between source and destination directories
 * @param {string} srcDir - Source directory (future-state)
 * @param {string} destDir - Destination directory (local)
 * @param {object} options - Analysis options
 * @returns {object} Diff summary
 */
async function analyzeDirectories(srcDir, destDir, options = {}) {
  const { exclude = [] } = options;
  const summary = {
    added: [],
    updated: [],
    skipped: [],
    unchanged: [],
    conflicts: [],
  };

  function shouldExclude(filePath) {
    return exclude.some(pattern => {
      if (pattern.includes('*')) {
        return filePath.includes(pattern.replace('*', ''));
      }
      return filePath.includes(pattern);
    });
  }

  async function walkDir(dir, baseDir = '') {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const srcPath = path.join(dir, file);
      const relativePath = path.join(baseDir, file);
      const destPath = path.join(destDir, relativePath);

      if (shouldExclude(relativePath)) {
        summary.skipped.push(relativePath);
        continue;
      }

      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        await walkDir(srcPath, relativePath);
      } else {
        if (!fs.existsSync(destPath)) {
          // New file
          summary.added.push(relativePath);
        } else {
          // Existing file - check if different
          const srcContent = fs.readFileSync(srcPath, 'utf8');
          const destContent = fs.readFileSync(destPath, 'utf8');

          if (srcContent !== destContent) {
            summary.updated.push(relativePath);
          } else {
            summary.unchanged.push(relativePath);
          }
        }
      }
    }
  }

  await walkDir(srcDir);
  return summary;
}

/**
 * Find the workspace ID that matches the given path
 * @param {string} targetPath - The path to match against workspaces
 * @returns {Promise<string|null>} The workspace ID or null if not found
 */
async function findWorkspaceForPath(targetPath) {
  try {
    const response = await fetch('http://localhost:3111/workspaces');
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const workspaces = data.workspaces || [];

    // Normalize the target path
    const normalizedTarget = path.resolve(targetPath);

    // Find workspace that matches or contains the target path
    for (const workspace of workspaces) {
      const normalizedWorkspace = path.resolve(workspace.workspacePath);

      // Check for exact match or if target is within workspace
      if (
        normalizedTarget === normalizedWorkspace ||
        normalizedTarget.startsWith(normalizedWorkspace + path.sep)
      ) {
        return workspace.workspaceId;
      }
    }

    return null;
  } catch (error) {
    console.error('[MERGE FUTURE-STATE] Error finding workspace:', error);
    return null;
  }
}

/**
 * Compare future-state branch changes with local code
 * @param {object} params - Tool parameters
 * @param {string} params.appSourcePath - Local app source directory
 * @param {string[]} params.exclude - Patterns to exclude from comparison
 * @returns {Promise<object>} MCP formatted response
 */
export async function mergeFutureStateTool(params) {
  const { appSourcePath, exclude = [] } = params;

  console.error('[MERGE FUTURE-STATE] Starting comparison process');

  try {
    // Check if VS Code extension is available
    let vsCodeAvailable = await isVSCodeExtensionAvailable();

    console.error(
      `[MERGE FUTURE-STATE] VS Code extension available: ${vsCodeAvailable.available}`
    );

    // If extension is not available, try to install it
    if (!vsCodeAvailable.available) {
      const vsCodeInstalled = await isVSCodeInstalled();

      if (vsCodeInstalled) {
        console.error(
          '[MERGE FUTURE-STATE] VS Code is installed but extension is not available'
        );
        console.error(
          '[MERGE FUTURE-STATE] Attempting to install Endgame extension...'
        );

        const installSuccess = await installVSCodeExtension();

        if (installSuccess) {
          // Check again if the extension is now available
          vsCodeAvailable = await isVSCodeExtensionAvailable();

          if (vsCodeAvailable.available) {
            console.error(
              '[MERGE FUTURE-STATE] Extension installed and server is now available'
            );
          } else {
            console.error(
              '[MERGE FUTURE-STATE] Extension installed but server may need to be started manually'
            );
            console.error(
              '[MERGE FUTURE-STATE] Try restarting VS Code or run "Endgame: Hello World" command in VS Code'
            );
          }
        }
      } else {
        console.error(
          '[MERGE FUTURE-STATE] VS Code is not installed on this system'
        );
      }
    }

    // Resolve app name and account
    const appName = await resolveAppName({ appSourcePath });
    const { currentOrg } = await resolveAccountData({ appSourcePath });

    console.error(
      `[MERGE FUTURE-STATE] App: ${appName}, Org: ${currentOrg.id}`
    );

    // Get versions for the app using the new RESTful endpoint
    const versionsResponse = await fetchManagementApi(
      `/orgs/${currentOrg.id}/apps/${encodeURIComponent(appName)}/versions`
    );

    if (!versionsResponse.ok) {
      throw new Error(`Failed to fetch versions: ${versionsResponse.status}`);
    }

    const versionsData = await versionsResponse.json();

    // Find future-state branch versions
    const futureStateBranch = versionsData.find(
      group => group.branchInfo && group.branchInfo.name === 'future-state'
    );

    if (
      !futureStateBranch ||
      !futureStateBranch.versions ||
      futureStateBranch.versions.length === 0
    ) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'no_future_state',
                message:
                  'No future-state branch found or no versions deployed to it yet',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Get the latest version (already sorted by createdAt desc)
    const latestVersion = futureStateBranch.versions[0];

    console.error(`[MERGE FUTURE-STATE] Latest version: ${latestVersion._id}`);
    console.error(
      `[MERGE FUTURE-STATE] Created at: ${latestVersion.createdAt}`
    );

    // Get presigned URL for downloading the source package (pre-build artifact)
    const downloadUrlResponse = await fetchManagementApi(
      `/orgs/${currentOrg.id}/versions/${latestVersion._id}/source-download`
    );

    if (!downloadUrlResponse.ok) {
      // If source download fails, it might be an older deployment without source tracking
      if (downloadUrlResponse.status === 404) {
        const errorData = await downloadUrlResponse.json();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'error',
                  error: errorData.error,
                  hint:
                    errorData.hint ||
                    'This version may have been deployed before source tracking was implemented. Only deployments made after source tracking implementation can be merged.',
                },
                null,
                2
              ),
            },
          ],
        };
      }
      throw new Error(
        `Failed to get source download URL: ${downloadUrlResponse.status}`
      );
    }

    const { downloadUrl, isSource } = await downloadUrlResponse.json();

    console.error(`[MERGE FUTURE-STATE] Download URL received: ${downloadUrl}`);
    console.error(`[MERGE FUTURE-STATE] Is source package: ${isSource}`);

    if (!isSource) {
      console.warn(
        `[MERGE FUTURE-STATE] Warning: Download URL is not marked as source package`
      );
    }

    // Create temporary directory for download
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'merge-future-state-')
    );
    const zipPath = path.join(tmpDir, 'future-state-source.zip');
    const extractDir = path.join(tmpDir, 'extracted');

    try {
      // Download the source artifact
      console.error(`[MERGE FUTURE-STATE] Downloading source package`);
      await downloadFromUrl(downloadUrl, zipPath);

      // Extract the zip
      console.error(`[MERGE FUTURE-STATE] Extracting source package`);
      fs.mkdirSync(extractDir, { recursive: true });
      await unzip(zipPath, extractDir);

      // Log what we found after extraction
      const extractedFiles = fs.readdirSync(extractDir);
      console.error(
        `[MERGE FUTURE-STATE] Extracted files in root:`,
        extractedFiles
      );

      // Check if there's a package.json to verify it's source code
      const hasPackageJson = fs.existsSync(
        path.join(extractDir, 'package.json')
      );
      const hasIndexJs = fs.existsSync(path.join(extractDir, 'index.js'));
      const hasRunSh = fs.existsSync(path.join(extractDir, 'run.sh'));

      console.error(`[MERGE FUTURE-STATE] Has package.json: ${hasPackageJson}`);
      console.error(`[MERGE FUTURE-STATE] Has index.js: ${hasIndexJs}`);
      console.error(
        `[MERGE FUTURE-STATE] Has run.sh: ${hasRunSh} (platform wrapper, indicates built artifact)`
      );

      if (hasRunSh && !hasPackageJson) {
        console.warn(
          `[MERGE FUTURE-STATE] WARNING: This appears to be a built artifact, not source code!`
        );
      }

      // Default exclusions for merge
      const defaultExclusions = [
        'node_modules',
        '.git',
        '.env',
        'run.sh', // Platform wrapper script
        '.endgame',
      ];

      const allExclusions = [...defaultExclusions, ...exclude];

      // Analyze the differences
      console.error(`[MERGE FUTURE-STATE] Analyzing differences`);
      const diffSummary = await analyzeDirectories(extractDir, appSourcePath, {
        exclude: allExclusions,
      });

      // If VS Code is available, show diff
      let diffResult = null;
      if (vsCodeAvailable.available) {
        try {
          // Find the workspace ID that matches the appSourcePath
          const targetWorkspaceId = await findWorkspaceForPath(appSourcePath);

          if (!targetWorkspaceId) {
            console.error(
              '[MERGE FUTURE-STATE] Could not find VS Code workspace for path:',
              appSourcePath
            );
            console.error(
              '[MERGE FUTURE-STATE] Make sure VS Code is open with the target directory'
            );
          } else {
            console.error(
              `[MERGE FUTURE-STATE] Found workspace ID: ${targetWorkspaceId}`
            );
            console.error(`[MERGE FUTURE-STATE] Opening VS Code diff view`);

            // Compare future-state (source) vs local (target) to show new files from future-state
            const vscodeResult = await callVSCodeCommand(
              'endgame.diffDirectory',
              [extractDir, appSourcePath],
              targetWorkspaceId
            );
            diffResult = vscodeResult.result;
          }
        } catch (error) {
          console.error(
            '[MERGE FUTURE-STATE] Failed to open VS Code diff:',
            error
          );
        }
      }

      // Prepare response
      const response = {
        status: 'success',
        futureStateVersion: {
          id: latestVersion._id,
          createdAt: latestVersion.createdAt,
          description: latestVersion.description,
        },
        branch: futureStateBranch.branchInfo,
        comparison: {
          summary: diffSummary,
          totalChanges: diffSummary.added.length + diffSummary.updated.length,
          filesAnalyzed:
            diffSummary.added.length +
            diffSummary.updated.length +
            diffSummary.unchanged.length,
        },
      };

      if (diffResult) {
        response.comparison.vscodeComparison = diffResult.summary;
        response.comparison.note =
          'VS Code diff view has been opened to show the changes.';
      } else if (vsCodeAvailable.available) {
        // VS Code is available but diff wasn't opened
        response.comparison.note =
          'VS Code extension is available but could not open diff. Make sure VS Code is open with the target directory.';
      } else if (!vsCodeAvailable.available) {
        response.comparison.note =
          'VS Code extension not available. Install the Endgame VS Code extension to see a visual diff.';
      }

      if (response.comparison.totalChanges > 0) {
        response.comparison.hint =
          'Review the changes in VS Code diff view. To apply these changes, use the VS Code merge controls or manually copy the desired changes.';
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } finally {
      // Cleanup temp directory
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('[MERGE FUTURE-STATE] Error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'error',
              error: error.message,
              stack: error.stack,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
