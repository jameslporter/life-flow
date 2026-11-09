import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  applyDone,
  Completions,
  DEFAULT_SETTINGS,
  DoneChange,
  loadPersisted,
  NEW_USER_SETTINGS,
  Persisted,
  savePersisted,
  Settings,
} from './persist';
import { ALL_WEEK, Group, Task, WEEKDAYS } from './types';

export type { Settings } from './persist';

type Store = {
  ready: boolean;
  tasks: Task[];
  completions: Completions;
  settings: Settings;
  updateSettings: (input: Partial<Settings>) => void;
  addTask: (input: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, input: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (taskId: string, day: string) => void;
  /** Set several completions at once, e.g. check-offs made from the widget. */
  setDone: (changes: DoneChange[]) => void;
  /** Re-read saved data, e.g. after a background refresh changed it. */
  reload: () => Promise<void>;
  isDone: (taskId: string, day: string) => boolean;
};

const StoreContext = createContext<Store | null>(null);

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function seed(): Task[] {
  const make = (title: string, group: Group, days: number[], i: number): Task => ({
    id: newId() + i,
    title,
    group,
    days,
    createdAt: Date.now() + i,
  });
  return [
    make('Drink a glass of water', 'morning', ALL_WEEK, 0),
    make('Stretch for 5 minutes', 'morning', WEEKDAYS, 1),
    make('Review the day’s calendar', 'work', WEEKDAYS, 2),
    make('Pick the top 3 priorities', 'work', WEEKDAYS, 3),
    make('Plan tomorrow', 'evening', WEEKDAYS, 4),
    make('Read for 20 minutes', 'evening', ALL_WEEK, 5),
  ];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Persisted>({ tasks: [], completions: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPersisted();
      if (cancelled) return;
      setData(loaded ?? { tasks: seed(), completions: {}, settings: NEW_USER_SETTINGS });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePersisted(data).catch(() => {});
  }, [data, ready]);

  const addTask = useCallback<Store['addTask']>((input) => {
    setData((d) => ({ ...d, tasks: [...d.tasks, { ...input, id: newId(), createdAt: Date.now() }] }));
  }, []);

  const updateTask = useCallback<Store['updateTask']>((id, input) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...input } : t)) }));
  }, []);

  const deleteTask = useCallback<Store['deleteTask']>((id) => {
    setData((d) => {
      const completions: Completions = {};
      for (const [day, ids] of Object.entries(d.completions)) {
        const rest = ids.filter((x) => x !== id);
        if (rest.length) completions[day] = rest;
      }
      return { ...d, tasks: d.tasks.filter((t) => t.id !== id), completions };
    });
  }, []);

  const toggleDone = useCallback<Store['toggleDone']>((taskId, day) => {
    setData((d) => {
      const current = d.completions[day] ?? [];
      const next = current.includes(taskId) ? current.filter((x) => x !== taskId) : [...current, taskId];
      return { ...d, completions: { ...d.completions, [day]: next } };
    });
  }, []);

  const setDone = useCallback<Store['setDone']>((changes) => {
    if (changes.length === 0) return;
    setData((d) => ({ ...d, completions: applyDone(d.completions, changes) }));
  }, []);

  const reload = useCallback<Store['reload']>(async () => {
    const loaded = await loadPersisted();
    if (loaded) setData(loaded);
  }, []);

  const updateSettings = useCallback<Store['updateSettings']>((input) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...input } }));
  }, []);

  const settings = useMemo<Settings>(() => ({ ...DEFAULT_SETTINGS, ...data.settings }), [data.settings]);

  const isDone = useCallback<Store['isDone']>(
    (taskId, day) => (data.completions[day] ?? []).includes(taskId),
    [data.completions]
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      tasks: data.tasks,
      completions: data.completions,
      settings,
      updateSettings,
      addTask,
      updateTask,
      deleteTask,
      toggleDone,
      setDone,
      reload,
      isDone,
    }),
    [ready, data, settings, updateSettings, addTask, updateTask, deleteTask, toggleDone, setDone, reload, isDone]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
