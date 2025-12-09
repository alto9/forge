import { describe, it, expect } from 'vitest';
import YAML from 'yaml';

describe('Yaml basics', () => {
    it('stringifies and parses', () => {
        const obj = { name: 'Test', description: 'Desc', background: 'Bg' };
        const text = YAML.stringify(obj);
        const parsed = YAML.parse(text);
        expect(parsed).toEqual(obj);
    });
});



