import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptGenerator } from '../PromptGenerator';
import { FileParser } from '../FileParser';
import { GitUtils } from '../GitUtils';
import * as vscode from 'vscode';
import path from 'path';

// Mock FileParser
vi.mock('../FileParser', () => ({
    FileParser: {
        readFile: vi.fn(),
        parseFrontmatter: vi.fn()
    }
}));

// Mock GitUtils
vi.mock('../GitUtils', () => ({
    GitUtils: {
        isGitRepository: vi.fn(),
        getDiffForFile: vi.fn(),
        getFileStatus: vi.fn(),
        getCurrentCommit: vi.fn()
    }
}));

describe('PromptGenerator', () => {
    it('should be importable', () => {
        expect(PromptGenerator).toBeDefined();
    });
});
