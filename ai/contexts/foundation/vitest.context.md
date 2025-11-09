---
context_id: vitest
name: Vitest Testing Framework
category: foundation
description: Guidance for writing and running tests with Vitest in TypeScript projects
---

# Vitest Testing Context

## When to Use This Context

```gherkin
Scenario: Writing unit tests for TypeScript code
  Given a TypeScript project with testing requirements
  And a need for fast, modern testing framework
  When implementing tests for functions, classes, or components
  Then use Vitest as the testing framework
  And follow modern testing best practices
  And leverage Vitest's ESM support and speed
```

## Vitest Overview

Vitest is a blazing-fast unit test framework powered by Vite. Benefits:
- Lightning-fast test execution with hot module replacement
- ESM-first with native TypeScript support
- Jest-compatible API (easy migration)
- Built-in code coverage with c8
- Component testing support (React, Vue, Svelte)
- Watch mode with smart re-run

## Setup

### Installation

```bash
npm install -D vitest @vitest/ui
npm install -D @types/node  # For Node.js API types
```

### Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // Use global test APIs (describe, it, expect)
    environment: 'node',     // or 'jsdom' for browser-like environment
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    },
    setupFiles: ['./src/test/setup.ts'],  // Optional setup file
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Basic Test Structure

### Simple Function Test

```typescript
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// src/utils/__tests__/math.test.ts
import { describe, it, expect } from 'vitest';
import { add } from '../math';

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
```

### Class Testing

```typescript
// src/services/UserService.ts
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User | null> {
    return this.db.findUser(id);
  }
}

// src/services/__tests__/UserService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../UserService';

describe('UserService', () => {
  let mockDb: any;
  let service: UserService;

  beforeEach(() => {
    mockDb = {
      findUser: vi.fn(),
    };
    service = new UserService(mockDb);
  });

  it('should return user when found', async () => {
    const mockUser = { id: '1', name: 'John' };
    mockDb.findUser.mockResolvedValue(mockUser);

    const result = await service.getUser('1');

    expect(result).toEqual(mockUser);
    expect(mockDb.findUser).toHaveBeenCalledWith('1');
  });

  it('should return null when user not found', async () => {
    mockDb.findUser.mockResolvedValue(null);

    const result = await service.getUser('999');

    expect(result).toBeNull();
  });
});
```

## Mocking

### Function Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
expect(mockFn()).toBe(42);

// Mock with implementation
const mockAsync = vi.fn().mockResolvedValue('result');
await expect(mockAsync()).resolves.toBe('result');

// Spy on existing function
const spy = vi.spyOn(obj, 'method');
expect(spy).toHaveBeenCalled();
```

### Module Mocking

```typescript
// Mock entire module
vi.mock('../database', () => ({
  Database: vi.fn(() => ({
    query: vi.fn(),
  })),
}));

// Partial mock
vi.mock('../config', async () => {
  const actual = await vi.importActual('../config');
  return {
    ...actual,
    API_KEY: 'test-key',
  };
});
```

### VSCode API Mocking

```typescript
// src/test/__mocks__/vscode.ts
export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    show: vi.fn(),
  })),
};

export const workspace = {
  getConfiguration: vi.fn(),
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
};

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
};

// In tests
vi.mock('vscode');
```

## React Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

## Async Testing

```typescript
describe('async operations', () => {
  it('waits for promise to resolve', async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it('expects promise to reject', async () => {
    await expect(failingOperation()).rejects.toThrow('Error message');
  });

  it('uses async/await', async () => {
    const data = await getData();
    expect(data).toHaveProperty('id');
  });
});
```

## Best Practices

### 1. Test Organization
- Group related tests with `describe`
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests focused on one behavior

### 2. Setup and Teardown
```typescript
describe('MyClass', () => {
  beforeEach(() => {
    // Run before each test
  });

  afterEach(() => {
    // Run after each test
  });

  beforeAll(() => {
    // Run once before all tests
  });

  afterAll(() => {
    // Run once after all tests
  });
});
```

### 3. Assertions
```typescript
// Equality
expect(value).toBe(42);              // Strict equality (===)
expect(obj).toEqual({ key: 'val' }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThanOrEqual(100);
expect(value).toBeCloseTo(0.3, 5);  // Floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(arr).toContain('item');
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'val' });

// Exceptions
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('Error message');
```

### 4. Coverage Goals
- Aim for >80% coverage on critical code
- Don't obsess over 100% coverage
- Focus on meaningful tests, not coverage numbers
- Exclude generated code and types from coverage

### 5. Test Independence
- Each test should run independently
- Don't rely on test execution order
- Clean up state in `afterEach`
- Use fresh instances for each test

## Common Patterns

### Testing Error Handling
```typescript
it('handles errors gracefully', async () => {
  const mockDb = { query: vi.fn().mockRejectedValue(new Error('DB Error')) };
  const service = new Service(mockDb);

  await expect(service.fetch()).rejects.toThrow('DB Error');
});
```

### Testing Timers
```typescript
import { vi } from 'vitest';

it('calls callback after delay', () => {
  vi.useFakeTimers();
  const callback = vi.fn();

  setTimeout(callback, 1000);
  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledOnce();

  vi.useRealTimers();
});
```

### Snapshot Testing
```typescript
it('matches snapshot', () => {
  const result = generateComplexObject();
  expect(result).toMatchSnapshot();
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test

# Run specific file
npm test path/to/file.test.ts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Debugging Tests

### VSCode Launch Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Using `test.only` and `test.skip`
```typescript
it.only('runs only this test', () => {
  // Debug specific test
});

it.skip('skips this test', () => {
  // Temporarily disable
});
```

## References
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

