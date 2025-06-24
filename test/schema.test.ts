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

const enterpriseConfig = {
  ...validConfig,
  logo: 'https://example.com/logo.png',
  docsUrl: 'https://docs.example.com',
  maintainer: 'Enterprise Corp',
  secureCloud: true,
  network: 'private',
  healthcheck: {
    path: '/health',
    timeoutSeconds: 60,
  },
};

const invalidSecureCloud = {
  ...validConfig,
  secureCloud: true,
  // Missing network - should fail validation
};

const invalidHealthcheck = {
  ...validConfig,
  healthcheck: {
    path: '/health',
    timeoutSeconds: 400, // Exceeds max of 300
  },
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

  it('accepts enterprise-specific fields', () => {
    expect(() => StackSchema.parse(enterpriseConfig)).not.toThrow();
  });

  it('rejects secureCloud=true without network', () => {
    expect(() => StackSchema.parse(invalidSecureCloud)).toThrow();
  });

  it('rejects invalid healthcheck timeout', () => {
    expect(() => StackSchema.parse(invalidHealthcheck)).toThrow();
  });

  it('validates URL fields', () => {
    const invalidLogo = {
      ...validConfig,
      logo: 'not-a-url',
    };
    expect(() => StackSchema.parse(invalidLogo)).toThrow();
  });
}); 