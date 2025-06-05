import git from 'isomorphic-git';
import fs from 'fs';
import { join, dirname } from 'path';
const { NotFoundError } = git;

/**
 * Get the current git branch name for a repository.
 * Returns null if not in a git repository or if the repository has no commits.
 *
 * @param {string} dir - Path to the git repository
 * @returns {Promise<string|null>} Name of the current branch or null
 */
export async function getCurrentBranch(dir) {
  try {
    // First find the git root using our limited-depth findRoot function
    let rootDir;
    try {
      rootDir = await findRoot({ filepath: dir });
      console.error('[GIT] Found git root:', rootDir);
    } catch (error) {
      console.error('[GIT] Could not find git root:', error.message);
      return null;
    }

    const currentBranch = await git.currentBranch({
      fs,
      dir: rootDir,
      fullname: false, // Return just the branch name, not the full ref
    });

    return currentBranch;
  } catch (error) {
    console.error('[GIT] Error getting current branch:', error);
    if (error.message.includes('Could not find HEAD')) {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a directory is a git repository.
 * Uses a limited depth search to avoid performance issues.
 *
 * @param {string} dir - Path to check
 * @returns {Promise<boolean>} True if the directory is a git repository
 */
export async function isGitRepository(dir) {
  try {
    await findRoot({ filepath: dir });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the last commit hash for a repository.
 * Returns null if not in a git repository or if the repository has no commits.
 *
 * @param {string} dir - Path to the git repository
 * @returns {Promise<string|null>} Last commit hash or null
 */
export async function getLastCommitHash(dir) {
  try {
    // First find the git root using our limited-depth findRoot function
    let rootDir;
    try {
      rootDir = await findRoot({ filepath: dir });
    } catch (error) {
      console.error('[GIT] Could not find git root:', error.message);
      return null;
    }

    const commitOid = await git.resolveRef({
      fs,
      dir: rootDir,
      ref: 'HEAD',
    });

    return commitOid;
  } catch (error) {
    console.error('[GIT] Error getting last commit hash:', error);
    throw error;
  }
}

/**
 * Find the git root directory, limiting to 3 folders up max to avoid performance issues.
 * This prevents infinite traversal up the directory tree.
 *
 * @param {object} params - Parameters object
 * @param {string} params.filepath - Starting filepath
 * @param {number} [params.depth=0] - Current recursion depth
 * @param {number} [params.maxDepth=3] - Maximum recursion depth
 * @returns {Promise<string>} Path to the git root
 * @throws {NotFoundError} When git root is not found within maxDepth
 */
async function findRoot({ filepath, depth = 0, maxDepth = 3 }) {
  const gitPath = join(filepath, '.git');

  try {
    await fs.promises.access(gitPath);
    return filepath;
  } catch {
    const parent = dirname(filepath);
    if (parent === filepath || depth >= maxDepth) {
      throw new NotFoundError(`git root for ${filepath}`);
    }
    return findRoot({ filepath: parent, depth: depth + 1, maxDepth });
  }
}

export default {
  getCurrentBranch,
  isGitRepository,
  getLastCommitHash,
};
