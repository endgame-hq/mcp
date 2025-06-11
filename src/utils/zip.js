import os from 'os';
import pLimit from 'p-limit';
import fs from 'fs';
import path from 'path';
import yazl from 'yazl';
import { readdir, stat, rm } from 'fs/promises';
import { randomBytes } from 'crypto';

/**
 * Creates a unique temporary zip file path in the system temp directory.
 * Uses the system temp directory and ensures cross-platform compatibility.
 *
 * @param {string} [prefix='app-'] - Prefix for the zip file name
 * @returns {Promise<string>} Full path to the temporary zip file
 */
export async function createTempZipPath(prefix = 'app-') {
  const tempDir = os.tmpdir();
  const randomSuffix = randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const zipFileName = `${prefix}${timestamp}-${randomSuffix}.zip`;
  return path.join(tempDir, zipFileName);
}

/**
 * Safely removes a temporary zip file with error handling.
 * Logs errors but doesn't throw to avoid breaking the main flow.
 *
 * @param {string} zipPath - Path to the zip file to remove
 * @returns {Promise<void>}
 */
export async function cleanupTempZip(zipPath) {
  try {
    if (zipPath && fs.existsSync(zipPath)) {
      await rm(zipPath, { force: true });
      console.log(`Cleaned up temporary zip file: ${zipPath}`);
    }
  } catch (error) {
    console.error(`Failed to clean up temporary zip file ${zipPath}:`, error.message);
    // Don't throw - cleanup failures shouldn't break the main flow
  }
}

/**
 * Creates a zip file from a source directory with optional additional files.
 * Excludes node_modules and .env* files by default, but allows injecting
 * additional files with custom names (like .env files).
 * Includes comprehensive error handling and cleanup.
 *
 * @param {string} srcDir - Source directory to zip
 * @param {string} outPath - Output path for the zip file
 * @param {Array<{src: string, dest: string}>} [additionalFiles=[]] - Additional files to add with custom names
 * @returns {Promise<void>}
 */
export async function zipDirectory(srcDir, outPath, additionalFiles = []) {
  const zipfile = new yazl.ZipFile();
  let outStream = null;
  
  try {
    outStream = fs.createWriteStream(outPath);
    const endPromise = new Promise((resolve, reject) => {
      outStream.on('close', resolve);
      outStream.on('error', reject);
    });
    zipfile.outputStream.pipe(outStream);

    /**
     * Recursively collects all files from a directory, applying exclusion rules.
     * Excludes node_modules, .env* files, and the output zip file itself.
     *
     * @param {string} dir - Directory to collect files from
     * @param {string} base - Base path for relative file paths in the zip
     * @returns {Promise<Array<{fullPath: string, relPath: string}>>} Array of file objects
     */
    async function collectFiles(dir, base) {
      const entries = await readdir(dir, { withFileTypes: true });
      let files = [];
      for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        if (entry.name.startsWith('.env')) continue; // skip .env* files
        const fullPath = path.join(dir, entry.name);
        // Exclude the output zip file itself
        if (path.resolve(fullPath) === path.resolve(outPath)) continue;
        const relPath = path.join(base, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(await collectFiles(fullPath, relPath));
        } else if (entry.isFile()) {
          files.push({ fullPath, relPath });
        }
      }
      return files;
    }

    const files = await collectFiles(srcDir, '');
    const limit = pLimit(os.cpus().length);

    // Add normal files (excluding .env* and outPath)
    await Promise.all(
      files.map(({ fullPath, relPath }) =>
        limit(async () => {
          const stats = await stat(fullPath);
          zipfile.addReadStream(
            fs.createReadStream(fullPath),
            relPath,
            stats.size
          );
        })
      )
    );

    // Add additional files (e.g. .env)
    if (additionalFiles && additionalFiles.length) {
      for (const { src, dest } of additionalFiles) {
        const stats = await stat(src);
        zipfile.addReadStream(fs.createReadStream(src), dest, stats.size);
      }
    }

    zipfile.end();
    await endPromise;
  } catch (error) {
    // Clean up the partial zip file on error
    if (outStream) {
      outStream.destroy();
    }
    await cleanupTempZip(outPath);
    throw error;
  }
}

/**
 * Creates a zip from a source directory using a temporary file in the system temp directory.
 * Provides automatic cleanup even if the process fails.
 * This is the recommended way to create temporary zip files.
 *
 * @param {string} srcDir - Source directory to zip
 * @param {Array<{src: string, dest: string}>} [additionalFiles=[]] - Additional files to add with custom names
 * @param {string} [prefix='app-'] - Prefix for the temporary zip file name
 * @returns {Promise<{zipPath: string, cleanup: Function}>} Object with zip path and cleanup function
 */
export async function createTempZip(srcDir, additionalFiles = [], prefix = 'app-') {
  const zipPath = await createTempZipPath(prefix);
  
  try {
    await zipDirectory(srcDir, zipPath, additionalFiles);
    
    return {
      zipPath,
      cleanup: () => cleanupTempZip(zipPath)
    };
  } catch (error) {
    // Ensure cleanup even if zip creation fails
    await cleanupTempZip(zipPath);
    throw error;
  }
}
