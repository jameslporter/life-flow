import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as data from './data';
import type { Completions, Db, DoneChange, TaskInput } from './data';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from './persist';
import type { Group, Task } from './types';

export type { Settings } from './persist';

type Store = {
  ready: boolean;
  tasks: Task[];
  completions: Completions;
  settings: Settings;
  updateSettings: (input: Partial<Settings>) => void;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: Partial<TaskInput>) => void;
  deleteTask: (id: string) => void;
  /** Move a task to another spot within its group (indexes count only that group's tasks). */
  moveTask: (group: Group, from: number, to: number) => void;
  toggleDone: (taskId: string, day: string) => void;
  /** Set several completions at once, e.g. check-offs made from the widget. */
  setDone: (changes: DoneChange[]) => void;
  /** Re-read saved data, e.g. after a background refresh changed it. */
  reload: () => Promise<void>;
  isDone: (taskId: string, day: string) => boolean;
};

const StoreContext = createContext<Store | null>(null);

type Snapshot = { tasks: Task[]; completions: Completions };

function snapshot(db: Db): Snapshot {
  return { tasks: data.readTasks(db.store), completions: data.readCompletions(db.store) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [snap, setSnap] = useState<Snapshot>({ tasks: [], completions: {} });
  const [savedSettings, setSavedSettings] = useState<Partial<Settings> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;
    (async () => {
      const [opened, loadedSettings] = await Promise.all([data.openDb(), loadSettings()]);
      if (cancelled) return;
      const listenerId = opened.store.addDidFinishTransactionListener(() => setSnap(snapshot(opened)));
      removeListener = () => opened.store.delListener(listenerId);
      setSnap(snapshot(opened));
      setSavedSettings(loadedSettings);
      setDb(opened);
    })().catch((e) => console.warn('[life-flow] Opening data failed', e));
    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  useEffect(() => {
    if (savedSettings) saveSettings(savedSettings).catch(() => {});
  }, [savedSettings]);

  const ready = db !== null && savedSettings !== null;

  const addTask = useCallback<Store['addTask']>((input) => db && void data.addTask(db.store, input), [db]);
  const updateTask = useCallback<Store['updateTask']>((id, input) => db && data.updateTask(db.store, id, input), [db]);
  const deleteTask = useCallback<Store['deleteTask']>((id) => db && data.deleteTask(db.store, id), [db]);
  const moveTask = useCallback<Store['moveTask']>(
    (group, from, to) => db && data.moveTask(db.store, group, from, to),
    [db]
  );
  const setDone = useCallback<Store['setDone']>((changes) => db && data.applyDone(db.store, changes), [db]);
  const toggleDone = useCallback<Store['toggleDone']>(
    (taskId, day) => {
      if (!db) return;
      const done = db.store.getCell('checks', data.checkId(taskId, day), 'state') === 'done';
      data.applyDone(db.store, [{ taskId, day, done: !done }]);
    },
    [db]
  );

  const reload = useCallback<Store['reload']>(async () => {
    if (!db) return;
    await db.persister.load();
    setSnap(snapshot(db));
  }, [db]);

  const updateSettings = useCallback<Store['updateSettings']>((input) => {
    setSavedSettings((s) => ({ ...s, ...input }));
  }, []);

  const settings = useMemo<Settings>(() => ({ ...DEFAULT_SETTINGS, ...savedSettings }), [savedSettings]);

  const isDone = useCallback<Store['isDone']>(
    (taskId, day) => (snap.completions[day] ?? []).includes(taskId),
    [snap.completions]
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      tasks: snap.tasks,
      completions: snap.completions,
      settings,
      updateSettings,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      toggleDone,
      setDone,
      reload,
      isDone,
    }),
    [ready, snap, settings, updateSettings, addTask, updateTask, deleteTask, moveTask, toggleDone, setDone, reload, isDone]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
