// packages/vscode-extension/src/utils/projectReadiness.ts

import * as vscode from 'vscode';

/**
 * Required Cursor command files for a Forge-ready project.
 */
export const REQUIRED_COMMANDS = [
  '.cursor/commands/architect-this.md',
  '.cursor/commands/plan-roadmap.md',
  '.cursor/commands/refine-issue.md',
  '.cursor/commands/build-from-github.md',
  '.cursor/commands/review-pr.md'
];

/**
 * THE authoritative check for project readiness.
 * All components MUST use this function to ensure consistency.
 *
 * A project is "Forge-ready" when:
 * 1. .forge directory exists
 * 2. All REQUIRED_COMMANDS exist
 *
 * @param projectUri - The URI of the project to check
 * @returns Promise<boolean> - true if project is ready, false otherwise
 */
export async function checkProjectReadiness(projectUri: vscode.Uri): Promise<boolean> {
  // Check .forge directory exists
  const forgeUri = vscode.Uri.joinPath(projectUri, '.forge');
  try {
    const stat = await vscode.workspace.fs.stat(forgeUri);
    if (stat.type !== vscode.FileType.Directory) {
      return false;
    }
  } catch {
    return false;
  }

  // Check all required Cursor commands exist
  for (const commandPath of REQUIRED_COMMANDS) {
    const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
    try {
      await vscode.workspace.fs.stat(commandUri);
    } catch {
      return false;
    }
  }

  return true;
}
