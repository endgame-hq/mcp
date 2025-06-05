import os from 'os';
import pLimit from 'p-limit';
import fs from 'fs';
import path from 'path';
import yazl from 'yazl';
import { readdir, stat } from 'fs/promises';

/**
 * Creates a zip file from a source directory with optional additional files.
 * Excludes node_modules and .env* files by default, but allows injecting
 * additional files with custom names (like .env files).
 *
 * @param {string} srcDir - Source directory to zip
 * @param {string} outPath - Output path for the zip file
 * @param {Array<{src: string, dest: string}>} [additionalFiles=[]] - Additional files to add with custom names
 * @returns {Promise<void>}
 */
export async function zipDirectory(srcDir, outPath, additionalFiles = []) {
  const zipfile = new yazl.ZipFile();
  const outStream = fs.createWriteStream(outPath);
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
}
