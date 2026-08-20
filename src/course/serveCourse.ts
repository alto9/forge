import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

export const DEFAULT_COURSE_PORT = 4321;
export const COURSE_DIRNAME = 'course';

const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

export function courseRootFromPlugin(pluginDest: string): string {
    return path.join(pluginDest, COURSE_DIRNAME);
}

export function courseIndexExists(root: string): boolean {
    return fs.existsSync(path.join(root, 'index.html'));
}

export function safeCoursePath(root: string, urlPath: string): string | null {
    const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\//, '') || 'index.html';
    const resolved = path.resolve(root, clean);
    const rootNorm = path.normalize(path.resolve(root));
    const rel = path.normalize(resolved);
    const prefix = rootNorm.endsWith(path.sep) ? rootNorm : rootNorm + path.sep;
    if (rel !== rootNorm && !rel.startsWith(prefix)) {
        return null;
    }
    return rel;
}

function listenOnce(server: http.Server, port: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const onError = (err: Error) => {
            server.off('listening', onListening);
            reject(err);
        };
        const onListening = () => {
            server.off('error', onError);
            const addr = server.address();
            resolve(addr && typeof addr === 'object' ? addr.port : port);
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '127.0.0.1');
    });
}

async function listenLoopback(server: http.Server, port: number): Promise<number> {
    try {
        return await listenOnce(server, port);
    } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EADDRINUSE' && port !== 0) {
            return listenOnce(server, 0);
        }
        throw err;
    }
}

/**
 * Loopback static server for the plugin course site (same contract as
 * forge-cursor-plugin/scripts/serve-course.mjs).
 */
export class CourseServer {
    private server: http.Server | undefined;
    private url: string | undefined;

    public async start(root: string, port: number = DEFAULT_COURSE_PORT): Promise<string> {
        if (this.server && this.url) {
            return this.url;
        }
        if (!courseIndexExists(root)) {
            throw new Error(`Forge course is missing at ${root} (no index.html).`);
        }

        const rootNorm = path.normalize(path.resolve(root));
        this.server = http.createServer((req, res) => {
            let file = safeCoursePath(rootNorm, req.url || '/');
            if (!file) {
                res.writeHead(403).end('Forbidden');
                return;
            }
            if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
                file = path.join(file, 'index.html');
            }
            if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
                return;
            }
            const type = MIME[path.extname(file)] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': type });
            fs.createReadStream(file).pipe(res);
        });

        const bound = await listenLoopback(this.server, port);
        this.url = `http://127.0.0.1:${bound}/`;
        return this.url;
    }

    public async stop(): Promise<void> {
        const server = this.server;
        this.server = undefined;
        this.url = undefined;
        if (!server) {
            return;
        }
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }

    public dispose(): void {
        void this.stop();
    }
}
