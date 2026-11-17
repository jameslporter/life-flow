import { openDatabaseSync } from 'expo-sqlite';
import type { MergeableStore } from 'tinybase/mergeable-store';
import { createExpoSqlitePersister } from 'tinybase/persisters/persister-expo-sqlite';

/** Saves a list's store to the app's SQLite database, one table per list. */
export function createListPersister(store: MergeableStore, listId: string) {
  return createExpoSqlitePersister(store, openDatabaseSync('life-flow.db'), `list_${listId}`);
}
