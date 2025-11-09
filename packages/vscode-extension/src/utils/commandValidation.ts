// packages/vscode-extension/src/utils/commandValidation.ts

import * as crypto from 'crypto';
import { getCommandTemplate } from '../templates/cursorCommands';

/**
 * Regex to extract hash comment from file content
 */
const HASH_COMMENT_REGEX = /<!-- forge-hash: ([a-f0-9]{64}) -->/;

/**
 * Computes SHA-256 hash of content
 */
export function computeContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}

/**
 * Validates that a command file's content matches its embedded hash
 */
export function validateCommandFileHash(
  fileContent: string,
  commandPath: string
): boolean {
  // Extract the embedded hash
  const match = fileContent.match(HASH_COMMENT_REGEX);
  if (!match) {
    // No hash comment found - file is invalid
    return false;
  }
  
  const embeddedHash = match[1];
  
  // Get the expected template
  const template = getCommandTemplate(commandPath);
  if (!template) {
    // Unknown command path
    return false;
  }
  
  // Remove hash comment from both file content and template before comparing
  const fileContentWithoutHash = fileContent.replace(HASH_COMMENT_REGEX, '').trim();
  const templateWithoutHash = template.trim();
  
  // Compute expected hash
  const expectedHash = computeContentHash(templateWithoutHash);
  
  // Validate: embedded hash matches expected AND content matches template
  return (
    embeddedHash === expectedHash &&
    fileContentWithoutHash === templateWithoutHash
  );
}

/**
 * Generates a command file with embedded hash comment
 */
export function generateCommandFile(commandPath: string): string {
  const template = getCommandTemplate(commandPath);
  if (!template) {
    throw new Error(`Unknown command path: ${commandPath}`);
  }
  
  // Compute hash of template content
  const hash = computeContentHash(template);
  
  // Return content with hash comment at top
  return `<!-- forge-hash: ${hash} -->\n\n${template}`;
}

