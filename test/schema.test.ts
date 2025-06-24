import { describe, it, expect } from 'vitest';
import { StackSchema } from '../src/schema';

const validConfig = {
  id: 'my-stack',
  name: 'My Stack',
  version: '1.0.0',
  description: 'A valid stack config',
  author: 'Test Author',
  containerImage: 'my/image:latest',
  gpu: { type: 'A100', count: 1 },
  memory: 16,
  docs: { description: 'Docs' },
};

const missingRequired = {
  name: 'Missing ID',
  version: '1.0.0',
  description: 'No id',
  author: 'Test',
  containerImage: 'img',
  gpu: { type: 'A100', count: 1 },
  memory: 16,
  docs: { description: 'Docs' },
};

const badVersion = {
  ...validConfig,
  version: 'not-a-semver',
};

describe('StackSchema', () => {
  it('accepts a valid config', () => {
    expect(() => StackSchema.parse(validConfig)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => StackSchema.parse(missingRequired)).toThrow();
  });

  it('rejects bad version format', () => {
    expect(() => StackSchema.parse(badVersion)).toThrow();
  });
}); 