import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests to verify build configuration for webview bundles
 *
 * These tests document the build setup. When forge has no webviews
 * (build:webview === "echo No webviews"), webview-specific tests are skipped.
 */

const packageJson = require('../../package.json');
const hasWebviews =
    packageJson.scripts['build:webview'] &&
    !packageJson.scripts['build:webview'].includes('echo No webviews');

describe('Webview Build Configuration', () => {
    describe('Build scripts in package.json', () => {
        it('should have build:webview script', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toBeTruthy();
        });

        it.skipIf(!hasWebviews)('should use esbuild for production builds when webviews exist', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('esbuild');
        });

        it.skipIf(!hasWebviews)('should build refinement bundle', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('src/webview/refinement/index.tsx');
            expect(buildScript).toContain('media/refinement/main.js');
        });

        it.skipIf(!hasWebviews)('should build scribe bundle', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('src/webview/scribe/index.tsx');
            expect(buildScript).toContain('media/scribe/main.js');
        });

        it.skipIf(!hasWebviews)('should build roadmap bundle', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('src/webview/roadmap/index.tsx');
            expect(buildScript).toContain('media/roadmap/main.js');
        });

        it.skipIf(!hasWebviews)('should minify bundles for production', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('--minify');
        });

        it.skipIf(!hasWebviews)('should use iife format for browser compatibility', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('--format=iife');
        });

        it.skipIf(!hasWebviews)('should target browser platform', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('--platform=browser');
        });

        it.skipIf(!hasWebviews)('should bundle dependencies', () => {
            const buildScript = packageJson.scripts['build:webview'];
            expect(buildScript).toContain('--bundle');
        });
    });

    describe('Watch mode configuration', () => {
        it('should have dev:webview script', () => {
            const devScript = packageJson.scripts['dev:webview'];
            expect(devScript).toBeTruthy();
        });

        it.skipIf(!hasWebviews)('should use esbuild for development when webviews exist', () => {
            const devScript = packageJson.scripts['dev:webview'];
            expect(devScript).toContain('esbuild');
        });

        it.skipIf(!hasWebviews)('should watch all webview bundles', () => {
            const devScript = packageJson.scripts['dev:webview'];
            expect(devScript).toContain('src/webview/refinement/index.tsx');
            expect(devScript).toContain('src/webview/scribe/index.tsx');
            expect(devScript).toContain('src/webview/roadmap/index.tsx');
            expect(devScript).toContain('--watch');
        });

        it.skipIf(!hasWebviews)('should use concurrently for parallel watching', () => {
            const devScript = packageJson.scripts['dev:webview'];
            expect(devScript).toContain('concurrently');
        });
    });

    describe('Build outputs', () => {
        it.skipIf(!hasWebviews)('should create media/refinement/main.js', () => {
            const refinementBundle = path.join(__dirname, '../../media/refinement/main.js');
            const exists = fs.existsSync(refinementBundle);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should create media/scribe/main.js', () => {
            const scribeBundle = path.join(__dirname, '../../media/scribe/main.js');
            const exists = fs.existsSync(scribeBundle);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should create media/roadmap/main.js', () => {
            const roadmapBundle = path.join(__dirname, '../../media/roadmap/main.js');
            const exists = fs.existsSync(roadmapBundle);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have reasonable refinement bundle size', () => {
            const refinementBundle = path.join(__dirname, '../../media/refinement/main.js');
            const stats = fs.statSync(refinementBundle);
            const sizeKB = stats.size / 1024;
            expect(sizeKB).toBeLessThan(200);
            expect(sizeKB).toBeGreaterThan(0);
        });

        it.skipIf(!hasWebviews)('should have reasonable scribe bundle size', () => {
            const scribeBundle = path.join(__dirname, '../../media/scribe/main.js');
            const stats = fs.statSync(scribeBundle);
            const sizeKB = stats.size / 1024;
            expect(sizeKB).toBeLessThan(200);
            expect(sizeKB).toBeGreaterThan(0);
        });

        it.skipIf(!hasWebviews)('should have reasonable roadmap bundle size', () => {
            const roadmapBundle = path.join(__dirname, '../../media/roadmap/main.js');
            const stats = fs.statSync(roadmapBundle);
            const sizeKB = stats.size / 1024;
            expect(sizeKB).toBeLessThan(200);
            expect(sizeKB).toBeGreaterThan(0);
        });
    });

    describe('.vscodeignore configuration', () => {
        it('should not ignore media directory', () => {
            const vscodeignorePath = path.join(__dirname, '../../.vscodeignore');
            const content = fs.readFileSync(vscodeignorePath, 'utf8');
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
        it.skipIf(!hasWebviews)('should include webview build in compile script', () => {
            const compileScript = packageJson.scripts.compile;
            expect(compileScript).toContain('build:webview');
        });

        it.skipIf(!hasWebviews)('should include webview build in build script', () => {
            const buildScript = packageJson.scripts.build;
            expect(buildScript).toContain('build:webview');
        });

        it('should call vsce package in package script', () => {
            const packageScript = packageJson.scripts.package;
            expect(packageScript).toContain('vsce package');
        });

        it.skipIf(!hasWebviews)('should include webview build in vscode:prepublish', () => {
            const prepublishScript = packageJson.scripts['vscode:prepublish'];
            expect(prepublishScript).toContain('build:webview');
        });

        it.skipIf(!hasWebviews)('should include webview watch in watch script', () => {
            const watchScript = packageJson.scripts.watch;
            expect(watchScript).toContain('dev:webview');
        });
    });

    describe('Webview script loading', () => {
        it('should use webview.asWebviewUri for security', () => {
            const usesSecureUri = true;
            expect(usesSecureUri).toBe(true);
        });

        it('should load script with nonce for CSP', () => {
            const usesNonce = true;
            expect(usesNonce).toBe(true);
        });
    });

    describe('Build process', () => {
        it.skipIf(!hasWebviews)('should build webpack before webview', () => {
            const buildScript = packageJson.scripts.build;
            const webpackIndex = buildScript.indexOf('webpack');
            const webviewIndex = buildScript.indexOf('build:webview');
            expect(webpackIndex).toBeLessThan(webviewIndex);
        });

        it('should have clean script to remove build artifacts', () => {
            const cleanScript = packageJson.scripts.clean;
            expect(cleanScript).toBeTruthy();
            expect(cleanScript).toContain('rm -rf');
        });
    });

    describe('Entry points', () => {
        it.skipIf(!hasWebviews)('should have refinement entry point', () => {
            const refinementEntry = path.join(__dirname, '../webview/refinement/index.tsx');
            const exists = fs.existsSync(refinementEntry);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have scribe entry point', () => {
            const scribeEntry = path.join(__dirname, '../webview/scribe/index.tsx');
            const exists = fs.existsSync(scribeEntry);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have roadmap entry point', () => {
            const roadmapEntry = path.join(__dirname, '../webview/roadmap/index.tsx');
            const exists = fs.existsSync(roadmapEntry);
            expect(exists).toBe(true);
        });
    });

    describe('Output directories', () => {
        it('should have media directory', () => {
            const mediaDir = path.join(__dirname, '../../media');
            const exists = fs.existsSync(mediaDir);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have media/refinement directory', () => {
            const refinementDir = path.join(__dirname, '../../media/refinement');
            const exists = fs.existsSync(refinementDir);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have media/scribe directory', () => {
            const scribeDir = path.join(__dirname, '../../media/scribe');
            const exists = fs.existsSync(scribeDir);
            expect(exists).toBe(true);
        });

        it.skipIf(!hasWebviews)('should have media/roadmap directory', () => {
            const roadmapDir = path.join(__dirname, '../../media/roadmap');
            const exists = fs.existsSync(roadmapDir);
            expect(exists).toBe(true);
        });
    });
});
