import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import fs from 'fs';
import path from 'path';

const CLI = path.resolve(__dirname, '../dist/cli.js');
const VALID_STACK = path.resolve(__dirname, './fixtures/valid-stack.yaml');
const INVALID_STACK = path.resolve(__dirname, './fixtures/invalid-stack.yaml');

describe('CLI validate', () => {
  it('returns 0 for valid stack', async () => {
    const { exitCode } = await execa('node', [CLI, 'validate', '-f', VALID_STACK]);
    expect(exitCode).toBe(0);
  });

  it('returns 1 for invalid stack', async () => {
    const { exitCode } = await execa('node', [CLI, 'validate', '-f', INVALID_STACK], { reject: false });
    expect(exitCode).toBe(1);
  });
}); 