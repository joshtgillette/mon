import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveDbPath } from './paths.js';

describe('resolveDbPath', () => {
  it('honors MON_DB_PATH when set', () => {
    const env = { MON_DB_PATH: '/tmp/some/custom/mon.db' } as NodeJS.ProcessEnv;
    expect(resolveDbPath(env)).toBe('/tmp/some/custom/mon.db');
  });

  it('falls back to a default per-user path when unset', () => {
    const env = {} as NodeJS.ProcessEnv;
    const resolved = resolveDbPath(env);
    expect(resolved).not.toBe('');
    expect(resolved.endsWith(path.join('mon', 'mon.db'))).toBe(true);
    expect(resolved.startsWith(os.homedir()) || resolved.includes('mon')).toBe(true);
  });
});
