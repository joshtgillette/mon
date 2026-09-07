import os from 'node:os';
import path from 'node:path';

function defaultDbPath(env: NodeJS.ProcessEnv): string {
  const home = os.homedir();
  switch (process.platform) {
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'mon', 'mon.db');
    case 'win32':
      return path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'mon', 'mon.db');
    default:
      return path.join(env.XDG_DATA_HOME ?? path.join(home, '.local', 'share'), 'mon', 'mon.db');
  }
}

/** `MON_DB_PATH` overrides the default per-user location; used by tests and alternate profiles. */
export function resolveDbPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.MON_DB_PATH || defaultDbPath(env);
}
