import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ALL_WEEK, Group, Task, WEEKDAYS } from './types';

const STORAGE_KEY = 'life-flow/v1';

type Completions = Record<string, string[]>; // dateKey -> task ids done that day

type Persisted = { tasks: Task[]; completions: Completions };

type Store = {
  ready: boolean;
  tasks: Task[];
  completions: Completions;
  addTask: (input: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, input: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (taskId: string, day: string) => void;
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
      let loaded: Persisted | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw);
      } catch {
        // Storage unavailable or corrupt: start fresh.
      }
      if (cancelled) return;
      setData(loaded ?? { tasks: seed(), completions: {} });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
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
      return { tasks: d.tasks.filter((t) => t.id !== id), completions };
    });
  }, []);

  const toggleDone = useCallback<Store['toggleDone']>((taskId, day) => {
    setData((d) => {
      const current = d.completions[day] ?? [];
      const next = current.includes(taskId) ? current.filter((x) => x !== taskId) : [...current, taskId];
      return { ...d, completions: { ...d.completions, [day]: next } };
    });
  }, []);

  const isDone = useCallback<Store['isDone']>(
    (taskId, day) => (data.completions[day] ?? []).includes(taskId),
    [data.completions]
  );

  const value = useMemo<Store>(
    () => ({ ready, tasks: data.tasks, completions: data.completions, addTask, updateTask, deleteTask, toggleDone, isDone }),
    [ready, data, addTask, updateTask, deleteTask, toggleDone, isDone]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
