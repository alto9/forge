// packages/vscode-extension/src/utils/projectReadiness.ts

import * as vscode from 'vscode';
import { getManagedCommandPaths } from '../templates/cursorCommands';
import { validateCommandFileHash } from './commandValidation';

/**
 * Required folders for a Forge-ready project.
 * NOTE: ai/models is LEGACY and NOT included.
 */
export const REQUIRED_FOLDERS = [
  'ai',
  'ai/actors',
  'ai/contexts',
  'ai/features',
  'ai/sessions',
  'ai/specs'
];

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
 * 1. All REQUIRED_FOLDERS exist (6 folders, excluding legacy ai/models)
 * 2. All REQUIRED_COMMANDS exist with valid content (hash validation passes)
 * 
 * @param projectUri - The URI of the project to check
 * @returns Promise<boolean> - true if project is ready, false otherwise
 */
export async function checkProjectReadiness(projectUri: vscode.Uri): Promise<boolean> {
  // Check all required folders exist
  for (const folder of REQUIRED_FOLDERS) {
    const folderUri = vscode.Uri.joinPath(projectUri, folder);
    try {
      await vscode.workspace.fs.stat(folderUri);
      // Folder exists, continue checking
    } catch {
      // Folder does not exist
      return false;
    }
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
  
  // All folders and commands exist with valid content
  return true;
}


