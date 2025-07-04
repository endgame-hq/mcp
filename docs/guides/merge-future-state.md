# Merge Future State Guide

The `merge-future-state` tool allows you to download and merge AI-generated improvements from the FutureState agent back into your local codebase.

## VS Code Integration

The tool now integrates with VS Code to provide a visual diff experience:

- **Visual Diffs**: When running with `--dry-run`, VS Code will open diff views for changed files
- **Backup Files**: Modified files are backed up before overwriting
- **No Git Required**: The tool no longer requires Git, making it accessible to all users

### VS Code Extension Setup

1. Install the Endgame VS Code extension
2. Ensure VS Code is running when using the merge tool
3. The extension server runs on port 3000 by default

## Overview

When you deploy to the `main` branch, the Endgame platform automatically triggers the FutureState agent in the background. This AI agent analyzes your code, implements improvements or new features, and deploys them to a special `future-state` branch.

The `merge-future-state` tool lets you:

- Download the latest future-state version
- Compare it with your local files using VS Code's diff viewer
- Merge the changes with automatic backups

## Usage

### Basic Merge

To merge the latest future-state changes into your local code:

```
merge-future-state /path/to/your/app
```

This will:

1. Find the latest version deployed to the `future-state` branch
2. Download the source package
3. Merge new and updated files into your local directory
4. Create backup files for any modified files
5. Show a notification in VS Code when complete

### Dry Run with Visual Diff

To preview what would be merged with visual diffs in VS Code:

```
merge-future-state /path/to/your/app --dry-run
```

This shows you:

- Which files would be added
- Which files would be updated
- Which files would be skipped
- Opens VS Code diff views for the first few modified files

### Excluding Files

To exclude specific files or patterns from the merge:

```
merge-future-state /path/to/your/app --exclude "*.config.js" "dist/*"
```

## Default Exclusions

The following are always excluded from merging:

- `node_modules/`
- `.git/`
- `.env`
- `run.sh` (platform wrapper)
- `.endgame`

## Merge Process

1. **Download**: Downloads the latest future-state version
2. **Backup**: Creates `.backup-{timestamp}` files for any files that will be modified
3. **New Files**: Files that exist in future-state but not locally are added
4. **Updated Files**: Files that differ are replaced (with backups created)
5. **Identical Files**: Files with identical content are skipped
6. **Excluded Files**: Files matching exclusion patterns are skipped

## Example Output

```json
{
  "status": "success",
  "futureStateVersion": {
    "id": "673d8e9a...",
    "createdAt": "2024-01-20T10:30:00Z",
    "description": "AI improvements"
  },
  "branch": {
    "name": "future-state",
    "subdomain": "abc123-future"
  },
  "merge": {
    "dryRun": false,
    "summary": {
      "added": ["src/newFeature.js", "docs/feature.md"],
      "updated": ["src/index.js", "package.json"],
      "skipped": ["node_modules/...", ".git/..."],
      "conflicts": []
    },
    "totalChanges": 4,
    "vscodeComparison": {
      "modified": 2,
      "added": 2,
      "deleted": 0,
      "identical": 15,
      "total": 19
    },
    "note": "Changes have been applied to your working directory. Backup files have been created for modified files.",
    "hint": "To undo changes, restore from the .backup-* files."
  }
}
```

## Workflow

1. Deploy your app to the main branch
2. Wait for the FutureState agent to complete (check the future-state branch URL)
3. Review the changes on the deployed future-state branch
4. Ensure VS Code is running with the Endgame extension
5. Run `merge-future-state` with `--dry-run` to preview changes in VS Code
6. Run `merge-future-state` to apply the changes
7. Review the changes in your editor
8. If needed, restore from backup files to undo specific changes

## Handling Changes

### Review Changes in VS Code

When running with `--dry-run`, VS Code will automatically open diff views for modified files, allowing you to:

- See side-by-side comparisons
- Navigate through changes
- Understand what the AI agent modified

### Restore from Backups

If you want to undo changes to specific files:

```bash
# Find backup files
ls *.backup-*

# Restore a specific file
cp index.js.backup-1737389123456 index.js

# Remove backup files when done
rm *.backup-*
```

### Using with Git (Optional)

If your project uses Git, you can still leverage it for version control:

```bash
# Review changes
git diff

# Stage and commit
git add .
git commit -m "Merge future-state improvements"

# Or selectively stage
git add -p
```

## Testing VS Code Integration

A test script is provided to verify VS Code extension integration:

```bash
node mcp/test-vscode-merge.js
```

This will:

- Check if the VS Code extension server is running
- Test basic commands
- Show you how to use the merge tool

## Limitations

- Only merges the latest future-state version
- Requires source package availability (deployments must have source tracking enabled)
- Requires the future-state branch to have at least one deployment
- VS Code diff views are limited to the first 5 files when many files are modified (to avoid overwhelming the editor)
