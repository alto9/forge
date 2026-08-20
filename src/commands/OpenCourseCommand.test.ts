import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { localPluginPath } from '../plugin/ensureLocalPlugin';
import { CourseServer } from '../course/serveCourse';
import { openForgeCourse } from './OpenCourseCommand';

const dirs: string[] = [];
const servers: CourseServer[] = [];

afterEach(async () => {
    while (servers.length) {
        await servers.pop()?.stop();
    }
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function output() {
    return {
        appendLine: vi.fn()
    } as unknown as import('vscode').OutputChannel;
}

function writeCourse(pluginDest: string): void {
    const course = path.join(pluginDest, 'course');
    fs.mkdirSync(course, { recursive: true });
    fs.writeFileSync(path.join(course, 'index.html'), '<!doctype html><title>Forge Course</title>');
}

describe('openForgeCourse', () => {
    it('serves an existing plugin course and opens a browser tab', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-course-home-'));
        dirs.push(home);
        writeCourse(localPluginPath(home));

        const server = new CourseServer();
        servers.push(server);
        const openTab = vi.fn();
        const ensurePlugin = vi.fn();

        const url = await openForgeCourse(output(), server, {
            homeDir: home,
            ensurePlugin,
            openTab
        });

        expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
        expect(openTab).toHaveBeenCalledWith(url);
        expect(ensurePlugin).not.toHaveBeenCalled();
    });

    it('syncs the plugin when the course is missing, then opens it', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-course-home-'));
        dirs.push(home);

        const server = new CourseServer();
        servers.push(server);
        const openTab = vi.fn();
        const ensurePlugin = vi.fn(async () => {
            const dest = localPluginPath(home);
            writeCourse(dest);
            return { action: 'cloned' as const, dest };
        });

        const url = await openForgeCourse(output(), server, {
            homeDir: home,
            ensurePlugin,
            openTab
        });

        expect(ensurePlugin).toHaveBeenCalled();
        expect(openTab).toHaveBeenCalledWith(url);
    });

    it('fails closed when sync still has no course', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-course-home-'));
        dirs.push(home);
        const dest = localPluginPath(home);

        const server = new CourseServer();
        servers.push(server);
        const ensurePlugin = vi.fn(async () => ({ action: 'unchanged' as const, dest }));

        await expect(
            openForgeCourse(output(), server, {
                homeDir: home,
                ensurePlugin,
                openTab: vi.fn()
            })
        ).rejects.toThrow(/includes course\//);
    });
});
