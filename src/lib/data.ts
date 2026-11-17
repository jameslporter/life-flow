import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { createMergeableStore, type MergeableStore } from 'tinybase/mergeable-store';

import { loadLegacy, type LegacyData } from './persist';
import { createListPersister } from './persister';
import { ALL_WEEK, GROUPS, Group, Schedule, Task, WEEKDAYS } from './types';

/**
 * Task data lives in TinyBase MergeableStores, one per list, saved to expo-sqlite
 * (localStorage on web). A MergeableStore keeps a timestamp for every cell, so when
 * sync arrives, edits from different devices merge cell by cell.
 */

/** Everyone's private list. Shared lists come later, each in its own store. */
export const PERSONAL_LIST = 'personal';

export const TABLES_SCHEMA = {
  tasks: {
    title: { type: 'string', default: '' },
    group: { type: 'string', default: 'morning' },
    scheduleKind: { type: 'string', default: 'weekly' },
    /** Weekly days as digits, 0 = Sunday ... 6 = Saturday, e.g. '12345'. */
    days: { type: 'string', default: '12345' },
    /** A one-off task's day, 'YYYY-MM-DD'. */
    date: { type: 'string', default: '' },
    sortKey: { type: 'string', default: 'a0' },
    createdAt: { type: 'number', default: 0 },
  },
  checks: {
    taskId: { type: 'string', default: '' },
    day: { type: 'string', default: '' },
    state: { type: 'string', default: 'open' },
    /** Who checked it: a user id once accounts exist, 'local' until then. */
    by: { type: 'string', default: 'local' },
    /** When it was checked, in ms. */
    at: { type: 'number', default: 0 },
  },
} as const;

export const VALUES_SCHEMA = {
  listName: { type: 'string', default: 'Personal' },
  /** Set once the store has been seeded or migrated from v1. */
  initialized: { type: 'boolean', default: false },
} as const;

/** dateKey -> ids of the tasks done that day. */
export type Completions = Record<string, string[]>;

export type DoneChange = { taskId: string; day: string; done: boolean };

export type TaskInput = { title: string; group: Group; schedule: Schedule };

export type Db = { store: MergeableStore; persister: ReturnType<typeof createListPersister> };

let opening: Promise<Db> | null = null;

/** Opens the Personal list's store once per JS runtime: loads it, migrates or seeds it, then auto-saves. */
export function openDb(): Promise<Db> {
  opening ??= open().catch((e) => {
    opening = null;
    throw e;
  });
  return opening;
}

async function open(): Promise<Db> {
  const store = createMergeableStore();
  store.setSchema(TABLES_SCHEMA, VALUES_SCHEMA);
  const persister = createListPersister(store, PERSONAL_LIST);
  // Load before saving, so an empty in-memory store never overwrites saved data.
  await persister.load();
  if (!store.getValue('initialized')) {
    const legacy = await loadLegacy();
    store.transaction(() => {
      if (legacy) importLegacy(store, legacy);
      else seed(store);
      store.setValue('initialized', true);
    });
  }
  await persister.startAutoSave();
  return { store, persister };
}

/** A UUIDv7: time ordered, so ids made on different devices never collide and sort by creation. */
export function newId(now = Date.now()): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  let ms = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const GROUP_KEYS = GROUPS.map((g) => g.key) as string[];

function scheduleCells(schedule: Schedule): Record<string, string> {
  return schedule.kind === 'weekly'
    ? { scheduleKind: 'weekly', days: [...schedule.days].sort().join('') }
    : { scheduleKind: 'once', date: schedule.date };
}

/** All tasks, ordered by their sort key (screens filter by group). */
export function readTasks(store: MergeableStore): Task[] {
  const tasks: Task[] = [];
  store.forEachRow('tasks', (id) => {
    const row = store.getRow('tasks', id);
    const group = String(row.group);
    if (!GROUP_KEYS.includes(group)) return;
    const schedule: Schedule =
      row.scheduleKind === 'once' && row.date
        ? { kind: 'once', date: String(row.date) }
        : { kind: 'weekly', days: String(row.days ?? '').split('').map(Number).filter((d) => d >= 0 && d <= 6) };
    tasks.push({
      id,
      listId: PERSONAL_LIST,
      title: String(row.title ?? ''),
      group: group as Group,
      schedule,
      sortKey: String(row.sortKey ?? 'a0'),
      createdAt: Number(row.createdAt ?? 0),
    });
  });
  return tasks.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : a.id < b.id ? -1 : 1));
}

/** Done check-offs by day, the shape the screens and widgets use. */
export function readCompletions(store: MergeableStore): Completions {
  const out: Completions = {};
  store.forEachRow('checks', (id) => {
    const row = store.getRow('checks', id);
    if (row.state !== 'done') return;
    const day = String(row.day);
    (out[day] ??= []).push(String(row.taskId));
  });
  return out;
}

function groupTasks(store: MergeableStore, group: Group) {
  return readTasks(store).filter((t) => t.group === group);
}

export function addTask(store: MergeableStore, input: TaskInput, now = Date.now()): string {
  const id = newId(now);
  const last = groupTasks(store, input.group).at(-1);
  store.setRow('tasks', id, {
    title: input.title,
    group: input.group,
    ...scheduleCells(input.schedule),
    sortKey: safeKeyBetween(last?.sortKey ?? null, null),
    createdAt: now,
  });
  return id;
}

/** Writes only the cells that changed, so concurrent edits to other fields survive a merge. */
export function updateTask(store: MergeableStore, id: string, input: Partial<TaskInput>) {
  if (!store.hasRow('tasks', id)) return;
  store.transaction(() => {
    if (input.title !== undefined) store.setCell('tasks', id, 'title', input.title);
    if (input.schedule) store.setPartialRow('tasks', id, scheduleCells(input.schedule));
    if (input.group !== undefined && input.group !== store.getCell('tasks', id, 'group')) {
      // Moving to another group puts the task at the end of that group.
      const last = groupTasks(store, input.group).at(-1);
      store.setPartialRow('tasks', id, { group: input.group, sortKey: safeKeyBetween(last?.sortKey ?? null, null) });
    }
  });
}

export function deleteTask(store: MergeableStore, id: string) {
  store.transaction(() => {
    store.delRow('tasks', id);
    store.forEachRow('checks', (checkId) => {
      if (store.getCell('checks', checkId, 'taskId') === id) store.delRow('checks', checkId);
    });
  });
}

/** Moves a task within its group; only the moved task gets a new sort key. */
export function moveTask(store: MergeableStore, group: Group, from: number, to: number) {
  const items = groupTasks(store, group);
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
  const moved = items[from];
  const rest = items.filter((_, i) => i !== from);
  const before = rest[to - 1]?.sortKey ?? null;
  const after = rest[to]?.sortKey ?? null;
  if (before !== null && after !== null && before >= after) {
    // Two devices made the same key: give the whole group fresh keys in the new order.
    rest.splice(to, 0, moved);
    const keys = generateNKeysBetween(null, null, rest.length);
    store.transaction(() => rest.forEach((t, i) => store.setCell('tasks', t.id, 'sortKey', keys[i])));
    return;
  }
  store.setCell('tasks', moved.id, 'sortKey', generateKeyBetween(before, after));
}

function safeKeyBetween(a: string | null, b: string | null) {
  try {
    return generateKeyBetween(a, b);
  } catch {
    return generateKeyBetween(null, null);
  }
}

export const checkId = (taskId: string, day: string) => `${taskId}|${day}`;

/** Applies check-offs from the app, widgets or Live Activity. Unchanged ones are skipped. */
export function applyDone(store: MergeableStore, changes: DoneChange[], now = Date.now()) {
  if (changes.length === 0) return;
  store.transaction(() => {
    for (const { taskId, day, done } of changes) {
      const id = checkId(taskId, day);
      const current = store.getCell('checks', id, 'state') ?? 'open';
      const next = done ? 'done' : 'open';
      if (current === next) continue;
      store.setRow('checks', id, { taskId, day, state: next, by: 'local', at: now });
    }
  });
}

function importLegacy(store: MergeableStore, legacy: LegacyData) {
  const now = Date.now();
  for (const group of GROUP_KEYS) {
    const inGroup = (legacy.tasks ?? []).filter((t) => t.group === group);
    const keys = generateNKeysBetween(null, null, inGroup.length);
    inGroup.forEach((t, i) => {
      store.setRow('tasks', t.id, {
        title: t.title,
        group,
        ...scheduleCells({ kind: 'weekly', days: t.days ?? WEEKDAYS }),
        sortKey: keys[i],
        createdAt: t.createdAt ?? now,
      });
    });
  }
  for (const [day, ids] of Object.entries(legacy.completions ?? {})) {
    for (const taskId of ids) {
      if (!store.hasRow('tasks', taskId)) continue;
      store.setRow('checks', checkId(taskId, day), { taskId, day, state: 'done', by: 'local', at: now });
    }
  }
}

function seed(store: MergeableStore) {
  const starter: [string, Group, number[]][] = [
    ['Drink a glass of water', 'morning', ALL_WEEK],
    ['Stretch for 5 minutes', 'morning', WEEKDAYS],
    ['Review the day’s calendar', 'work', WEEKDAYS],
    ['Pick the top 3 priorities', 'work', WEEKDAYS],
    ['Plan tomorrow', 'evening', WEEKDAYS],
    ['Read for 20 minutes', 'evening', ALL_WEEK],
  ];
  starter.forEach(([title, group, days], i) => addTask(store, { title, group, schedule: { kind: 'weekly', days } }, Date.now() + i));
}
