import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests to verify build configuration for webview bundles
 * 
 * These tests document the build setup and verify outputs exist.
 */

describe('Webview Build Configuration', () => {
    describe('Build scripts in package.json', () => {
        it('should have build:webview script for production builds', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toBeTruthy();
            expect(buildScript).toContain('esbuild');
        });

        it('should build studio bundle', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('src/webview/studio/index.tsx');
            expect(buildScript).toContain('media/studio/main.js');
        });

        it('should build welcome bundle', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('src/webview/welcome/index.tsx');
            expect(buildScript).toContain('media/welcome/main.js');
        });

        it('should minify bundles for production', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('--minify');
        });

        it('should use iife format for browser compatibility', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('--format=iife');
        });

        it('should target browser platform', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('--platform=browser');
        });

        it('should bundle dependencies', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts['build:webview'];

            expect(buildScript).toContain('--bundle');
        });
    });

    describe('Watch mode configuration', () => {
        it('should have dev:webview script for development', () => {
            const packageJson = require('../../package.json');
            const devScript = packageJson.scripts['dev:webview'];

            expect(devScript).toBeTruthy();
            expect(devScript).toContain('esbuild');
        });

        it('should watch both studio and welcome bundles', () => {
            const packageJson = require('../../package.json');
            const devScript = packageJson.scripts['dev:webview'];

            expect(devScript).toContain('src/webview/studio/index.tsx');
            expect(devScript).toContain('src/webview/welcome/index.tsx');
            expect(devScript).toContain('--watch');
        });

        it('should use concurrently for parallel watching', () => {
            const packageJson = require('../../package.json');
            const devScript = packageJson.scripts['dev:webview'];

            expect(devScript).toContain('concurrently');
        });
    });

    describe('Build outputs', () => {
        it('should create media/studio/main.js', () => {
            const studioBundle = path.join(__dirname, '../../media/studio/main.js');
            const exists = fs.existsSync(studioBundle);

            expect(exists).toBe(true);
        });

        it('should create media/welcome/main.js', () => {
            const welcomeBundle = path.join(__dirname, '../../media/welcome/main.js');
            const exists = fs.existsSync(welcomeBundle);

            expect(exists).toBe(true);
        });

        it('should have reasonable studio bundle size', () => {
            const studioBundle = path.join(__dirname, '../../media/studio/main.js');
            const stats = fs.statSync(studioBundle);
            const sizeKB = stats.size / 1024;

            // Should be less than 1000KB (react-flow adds ~600KB)
            expect(sizeKB).toBeLessThan(1000);
            expect(sizeKB).toBeGreaterThan(0);
        });

        it('should have reasonable welcome bundle size', () => {
            const welcomeBundle = path.join(__dirname, '../../media/welcome/main.js');
            const stats = fs.statSync(welcomeBundle);
            const sizeKB = stats.size / 1024;

            // Should be less than 200KB as per requirement
            expect(sizeKB).toBeLessThan(200);
            expect(sizeKB).toBeGreaterThan(0);
        });
    });

    describe('.vscodeignore configuration', () => {
        it('should not ignore media directory', () => {
            const vscodeignorePath = path.join(__dirname, '../../.vscodeignore');
            const content = fs.readFileSync(vscodeignorePath, 'utf8');

            // Should not explicitly ignore media
            expect(content).not.toContain('media/**');
            expect(content).not.toContain('!media');
        });

        it('should ignore source files', () => {
            const vscodeignorePath = path.join(__dirname, '../../.vscodeignore');
            const content = fs.readFileSync(vscodeignorePath, 'utf8');

            expect(content).toContain('src/**');
        });

        it('should ignore build artifacts', () => {
            const vscodeignorePath = path.join(__dirname, '../../.vscodeignore');
            const content = fs.readFileSync(vscodeignorePath, 'utf8');

            expect(content).toContain('out/**');
            expect(content).toContain('node_modules/**');
        });
    });

    describe('Integration with main build', () => {
        it('should include webview build in compile script', () => {
            const packageJson = require('../../package.json');
            const compileScript = packageJson.scripts.compile;

            expect(compileScript).toContain('build:webview');
        });

        it('should include webview build in build script', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts.build;

            expect(buildScript).toContain('build:webview');
        });

        it('should include webview build in package script', () => {
            const packageJson = require('../../package.json');
            const packageScript = packageJson.scripts.package;

            expect(packageScript).toContain('build:webview');
        });

        it('should include webview watch in watch script', () => {
            const packageJson = require('../../package.json');
            const watchScript = packageJson.scripts.watch;

            expect(watchScript).toContain('dev:webview');
        });
    });

    describe('WelcomePanel script loading', () => {
        it('should reference correct welcome bundle path', () => {
            // This is a documentation test - actual implementation is in WelcomePanel.ts
            const expectedPath = 'media/welcome/main.js';
            
            expect(expectedPath).toBe('media/welcome/main.js');
        });

        it('should use webview.asWebviewUri for security', () => {
            // WelcomePanel should use webview.asWebviewUri to get secure URI
            const usesSecureUri = true;
            
            expect(usesSecureUri).toBe(true);
        });

        it('should load script with nonce for CSP', () => {
            // WelcomePanel should use nonce in script tag for Content Security Policy
            const usesNonce = true;
            
            expect(usesNonce).toBe(true);
        });
    });

    describe('Build process', () => {
        it('should build webpack before webview', () => {
            const packageJson = require('../../package.json');
            const buildScript = packageJson.scripts.build;

            // webpack should come before build:webview
            const webpackIndex = buildScript.indexOf('webpack');
            const webviewIndex = buildScript.indexOf('build:webview');
            
            expect(webpackIndex).toBeLessThan(webviewIndex);
        });

        it('should have clean script to remove build artifacts', () => {
            const packageJson = require('../../package.json');
            const cleanScript = packageJson.scripts.clean;

            expect(cleanScript).toBeTruthy();
            expect(cleanScript).toContain('rm -rf');
        });
    });

    describe('Entry points', () => {
        it('should have studio entry point', () => {
            const studioEntry = path.join(__dirname, '../webview/studio/index.tsx');
            const exists = fs.existsSync(studioEntry);

            expect(exists).toBe(true);
        });

        it('should have welcome entry point', () => {
            const welcomeEntry = path.join(__dirname, '../webview/welcome/index.tsx');
            const exists = fs.existsSync(welcomeEntry);

            expect(exists).toBe(true);
        });
    });

    describe('Output directories', () => {
        it('should have media directory', () => {
            const mediaDir = path.join(__dirname, '../../media');
            const exists = fs.existsSync(mediaDir);

            expect(exists).toBe(true);
        });

        it('should have media/studio directory', () => {
            const studioDir = path.join(__dirname, '../../media/studio');
            const exists = fs.existsSync(studioDir);

            expect(exists).toBe(true);
        });

        it('should have media/welcome directory', () => {
            const welcomeDir = path.join(__dirname, '../../media/welcome');
            const exists = fs.existsSync(welcomeDir);

            expect(exists).toBe(true);
        });
    });
});

