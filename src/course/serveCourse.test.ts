import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    CourseServer,
    courseIndexExists,
    courseRootFromPlugin,
    safeCoursePath
} from './serveCourse';

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

function makeCourse(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-course-'));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>Forge Course</title>');
    fs.writeFileSync(path.join(dir, 'styles.css'), 'body{margin:0}');
    return dir;
}

async function get(url: string): Promise<{ status: number; type: string; body: string }> {
    const res = await fetch(url);
    return {
        status: res.status,
        type: res.headers.get('content-type') || '',
        body: await res.text()
    };
}

describe('courseRootFromPlugin', () => {
    it('appends course/ under the plugin dest', () => {
        expect(courseRootFromPlugin('/tmp/forge-cursor')).toBe(
            path.join('/tmp/forge-cursor', 'course')
        );
    });
});

describe('courseIndexExists', () => {
    it('is true only when index.html is present', () => {
        const root = makeCourse();
        expect(courseIndexExists(root)).toBe(true);
        expect(courseIndexExists(path.join(root, 'missing'))).toBe(false);
    });
});

describe('safeCoursePath', () => {
    it('resolves the site root to index.html and blocks traversal', () => {
        const root = makeCourse();
        expect(safeCoursePath(root, '/')).toBe(path.join(root, 'index.html'));
        expect(safeCoursePath(root, '/styles.css')).toBe(path.join(root, 'styles.css'));
        expect(safeCoursePath(root, '/../secret')).toBeNull();
    });
});

describe('CourseServer', () => {
    it('serves the course index and static assets on loopback', async () => {
        const root = makeCourse();
        const server = new CourseServer();
        servers.push(server);

        const url = await server.start(root, 0);
        expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);

        const index = await get(url);
        expect(index.status).toBe(200);
        expect(index.type).toContain('text/html');
        expect(index.body).toContain('Forge Course');

        const css = await get(new URL('styles.css', url).href);
        expect(css.status).toBe(200);
        expect(css.type).toContain('text/css');
        expect(css.body).toContain('margin:0');
    });

    it('rejects missing files and path traversal', async () => {
        const root = makeCourse();
        const server = new CourseServer();
        servers.push(server);
        const url = await server.start(root, 0);

        const missing = await get(new URL('nope.js', url).href);
        expect(missing.status).toBe(404);

        const parsed = new URL(url);
        const traversal = await new Promise<{ status: number }>((resolve, reject) => {
            http.get(
                {
                    hostname: parsed.hostname,
                    port: parsed.port,
                    path: '/../package.json'
                },
                (res) => {
                    res.resume();
                    resolve({ status: res.statusCode || 0 });
                }
            ).on('error', reject);
        });
        expect(traversal.status).toBe(403);
    });

    it('reuses a running listener', async () => {
        const root = makeCourse();
        const server = new CourseServer();
        servers.push(server);
        const first = await server.start(root, 0);
        const second = await server.start(root, 0);
        expect(second).toBe(first);
    });
});
