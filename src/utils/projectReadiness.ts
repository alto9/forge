// packages/vscode-extension/src/utils/projectReadiness.ts

import * as vscode from 'vscode';
import { getManagedCommandPaths } from '../templates/cursorCommands';
import { validateCommandFileHash } from './commandValidation';

/**
 * Required Cursor command files for a Forge-ready project.
 * Dynamically retrieved from command templates.
 */
export const REQUIRED_COMMANDS = getManagedCommandPaths();

/**
 * THE authoritative check for project readiness.
 * All components MUST use this function to ensure consistency.
 *
 * A project is "Forge-ready" when:
 * 1. .forge directory exists
 * 2. All REQUIRED_COMMANDS exist with valid content (hash validation passes)
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

  // Check all required Cursor commands exist and have valid content
  for (const commandPath of REQUIRED_COMMANDS) {
    const commandUri = vscode.Uri.joinPath(projectUri, commandPath);
    try {
      const fileContent = await vscode.workspace.fs.readFile(commandUri);
      const contentString = Buffer.from(fileContent).toString('utf8');
      
      // Validate content hash
      const isValid = validateCommandFileHash(contentString, commandPath);
      if (!isValid) {
        // File exists but content is invalid/outdated
        return false;
      }
    } catch {
      // File doesn't exist
      return false;
    }
  }
  
  // .forge and all commands exist with valid content
  return true;
}


