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
 * Check if VS Code extension server is available
 * @returns {Promise<boolean>} Whether the server is available
 */
async function isVSCodeExtensionAvailable() {
  try {
    const response = await fetch('http://localhost:3111/health');
    const data = await response.json();
    return data.status === 'ok' && data.extension === 'endgame';
  } catch (error) {
    return false;
  }
}

/**
 * Call VS Code extension command via HTTP
 * @param {string} command - The command to execute
 * @param {any[]} args - Arguments for the command
 * @returns {Promise<any>} Command result
 */
async function callVSCodeCommand(command, args = []) {
  const response = await fetch('http://localhost:3111/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command,
      args,
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
    const vsCodeAvailable = await isVSCodeExtensionAvailable();

    console.error(
      `[MERGE FUTURE-STATE] VS Code extension available: ${vsCodeAvailable}`
    );

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
      if (vsCodeAvailable) {
        try {
          console.error(`[MERGE FUTURE-STATE] Opening VS Code diff view`);
          // Compare future-state (source) vs local (target) to show new files from future-state
          const vscodeResult = await callVSCodeCommand(
            'endgame.diffDirectory',
            [extractDir, appSourcePath]
          );
          diffResult = vscodeResult.result;
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
      } else if (!vsCodeAvailable) {
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
