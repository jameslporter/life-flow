import type { MergeableStore } from 'tinybase/mergeable-store';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

/**
 * Web: saves a list's store to localStorage. expo-sqlite on web needs cross-origin
 * isolation headers, which static hosting such as GitHub Pages can't send.
 */
export function createListPersister(store: MergeableStore, listId: string) {
  return createLocalPersister(store, `life-flow/list/${listId}`);
}
