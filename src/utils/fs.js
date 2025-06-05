import fs from 'fs';
import path from 'path';
import { getCurrentBranch } from './git.js';

/**
 * Determines the appropriate environment file and branch based on the current git state.
 * Uses .env for main/master branches and .env.dev for feature branches.
 *
 * @param {string} codeDir - Code directory path
 * @returns {Promise<{envFilePath: string|null, branch: string}>} Environment file path and branch
 */
export async function determineEnvFileAndBranch(codeDir) {
  // List all files in codeDir
  const files = await fs.promises.readdir(codeDir);
  // Find all .env* files
  const envFiles = files.filter(f => f.startsWith('.env'));

  const currentBranch = await getCurrentBranch(codeDir);
  console.error('[FS UTILS] currentBranch:', currentBranch);

  // If branch is main/master OR dir is not git repository, use .env and "main" branch
  if (
    !currentBranch ||
    currentBranch === 'main' ||
    currentBranch === 'master'
  ) {
    if (envFiles.includes('.env')) {
      return { envFilePath: path.join(codeDir, '.env'), branch: 'main' };
    }
    if (envFiles.includes('.env.main')) {
      return { envFilePath: path.join(codeDir, '.env.main'), branch: 'main' };
    }
    return { envFilePath: null, branch: 'main' };
  }

  // For other branches, use .env.dev if it exists
  if (envFiles.includes('.env.dev')) {
    return {
      envFilePath: path.join(codeDir, '.env.dev'),
      branch: currentBranch,
    };
  }

  // No .env.dev, return null and use current branch
  return { envFilePath: null, branch: currentBranch };
}

/**
 * Gets the appropriate environment file and branch based on explicit branch or auto-detection.
 * Handles branch-specific environment file selection logic.
 *
 * @param {string} codeDir - Code directory path
 * @param {string} [branch] - Explicit branch name
 * @returns {Promise<{envFilePath: string|null, branch: string}>} Environment file path and branch
 */
export async function getEnvFileAndBranch(codeDir, branch) {
  if (branch === 'main') {
    const candidates = ['.env', '.env.main'].map(f => path.join(codeDir, f));
    for (const envFilePath of candidates) {
      try {
        await fs.promises.access(envFilePath, fs.constants.F_OK);
        return { envFilePath, branch: 'main' };
      } catch {}
    }
    return { envFilePath: null, branch: 'main' };
  } else if (branch) {
    const envCandidate = path.join(codeDir, `.env.${branch}`);
    try {
      await fs.promises.access(envCandidate, fs.constants.F_OK);
      return { envFilePath: envCandidate, branch };
    } catch {
      return { envFilePath: null, branch };
    }
  } else {
    return determineEnvFileAndBranch(codeDir);
  }
}
