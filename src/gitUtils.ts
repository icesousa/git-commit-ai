import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Gets the diff of staged changes in the git repository
 * @param repoPath Path to the git repository
 * @returns Promise with the diff output
 */
export async function getGitStagedDiff(repoPath: string): Promise<string> {
  try {
    // Get the diff of staged changes
    const { stdout } = await execPromise('git diff --staged', { cwd: repoPath });
    
    // If no diff is returned, try to get file names at least
    if (!stdout.trim()) {
      const { stdout: filesStdout } = await execPromise('git diff --staged --name-status', { cwd: repoPath });
      if (!filesStdout.trim()) {
        throw new Error('No staged changes found');
      }
      return filesStdout;
    }
    
    return stdout;
  } catch (error: any) {
    console.error('Error getting git diff:', error);
    throw new Error(`Failed to get git diff: ${error.message}`);
  }
}

/**
 * Gets a summary of staged changes (files modified, added, deleted)
 * @param repoPath Path to the git repository
 * @returns Promise with a summary of changes
 */
export async function getGitStagedSummary(repoPath: string): Promise<string> {
  try {
    // Get list of staged files with status
    const { stdout } = await execPromise('git diff --staged --name-status', { cwd: repoPath });
    
    // Count added, modified, deleted files
    const lines = stdout.trim().split('\n').filter(Boolean);
    const added = lines.filter(line => line.startsWith('A')).length;
    const modified = lines.filter(line => line.startsWith('M')).length;
    const deleted = lines.filter(line => line.startsWith('D')).length;
    
    return `${lines.length} files changed (${added} added, ${modified} modified, ${deleted} deleted)`;
  } catch (error: any) {
    console.error('Error getting git summary:', error);
    throw new Error(`Failed to get git summary: ${error.message}`);
  }
}
