import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    parseFrontmatter,
    readForgeJson,
    readMemoryDoc,
    readProductOwnerDocs,
} from './MemoryReader';

const tempDirs: string[] = [];

function mkTemp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-mem-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('parseFrontmatter', () => {
    it('parses YAML frontmatter and body', () => {
        const content = `---
doc: product.brief
product: Forge
audience:
  - Engineering leads
goals:
  - Ship dashboard
---

Body text here.
`;
        const { frontmatter, body } = parseFrontmatter(content);
        expect(frontmatter.doc).toBe('product.brief');
        expect(frontmatter.product).toBe('Forge');
        expect(frontmatter.audience).toEqual(['Engineering leads']);
        expect(frontmatter.goals).toEqual(['Ship dashboard']);
        expect(body.trim()).toBe('Body text here.');
    });

    it('returns empty frontmatter when missing', () => {
        const { frontmatter, body } = parseFrontmatter('just text');
        expect(frontmatter).toEqual({});
        expect(body).toBe('just text');
    });
});

describe('readMemoryDoc', () => {
    it('reads existing doc and reports missing', () => {
        const root = mkTemp();
        const rel = 'product/brief.md';
        fs.mkdirSync(path.join(root, 'product'), { recursive: true });
        fs.writeFileSync(
            path.join(root, rel),
            `---\ndoc: product.brief\nproduct: X\n---\n\n`
        );

        const found = readMemoryDoc(root, rel);
        expect(found.exists).toBe(true);
        expect(found.frontmatter.product).toBe('X');

        const missing = readMemoryDoc(root, 'product/missing.md');
        expect(missing.exists).toBe(false);
    });
});

describe('readProductOwnerDocs + forge.json', () => {
    it('reads all PO docs and forge.json', () => {
        const root = mkTemp();
        fs.mkdirSync(path.join(root, 'product'), { recursive: true });
        for (const name of [
            'brief',
            'competitive',
            'personas',
            'experiments',
            'insights',
            'metrics',
        ]) {
            fs.writeFileSync(
                path.join(root, 'product', `${name}.md`),
                `---\ndoc: product.${name}\nupdated: 2026-01-01\n---\n\n`
            );
        }
        fs.writeFileSync(
            path.join(root, 'forge.json'),
            JSON.stringify({ path: 'app', host: 'github' })
        );

        const docs = readProductOwnerDocs(root);
        expect(docs.brief.exists).toBe(true);
        expect(docs.metrics.frontmatter.doc).toBe('product.metrics');
        expect(readForgeJson(root)).toEqual({ path: 'app', host: 'github' });
    });
});
