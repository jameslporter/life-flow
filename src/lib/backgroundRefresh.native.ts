import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

import { glanceChanges, pushWidget, syncActivity } from './glance';
import { applyDone, openDb, readCompletions, readTasks } from './data';

const TASK = 'life-flow-refresh';

// Runs every half hour or so while the app is in the background, so the widget
// and the Live Activity / pinned notification move on to the next part of the day.
TaskManager.defineTask(TASK, async () => {
  try {
    // While the app is open, GlanceSync keeps everything up to date.
    if (AppState.currentState === 'active') return BackgroundTask.BackgroundTaskResult.Success;
    const { store, persister } = await openDb();
    // Pick up anything saved since this runtime last read the database.
    await persister.load();

    const changes = await glanceChanges();
    if (changes.length > 0) {
      applyDone(store, changes);
      await persister.save();
    }

    const tasks = readTasks(store);
    const completions = readCompletions(store);
    await pushWidget(tasks, completions);
    await syncActivity(tasks, completions);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.warn('[life-flow] Background refresh failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundRefresh() {
  try {
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (await TaskManager.isTaskRegisteredAsync(TASK)) return;
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 30 });
  } catch (e) {
    console.warn('[life-flow] Registering background refresh failed', e);
  }
}
