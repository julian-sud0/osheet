import type { Log, LogPatch } from './types';

/**
 * Persistence interface. Implementations live next to this file with
 * platform extensions: LogRepository.web.ts (idb-keyval) and
 * LogRepository.native.ts (expo-sqlite, added when native build lands).
 */
export interface LogRepository {
  list(): Promise<Log[]>;
  add(log: Omit<Log, 'id'> & { id?: string }): Promise<Log>;
  update(id: string, patch: LogPatch): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export { getRepository } from './repository';
