// App entry. The background refresh task has to be defined before anything else
// loads: when Android wakes the app in the background to run it, no screen renders,
// so a task defined from a screen or the root layout would never exist.
import './src/lib/backgroundRefresh';

// Expo Router must come last.
import 'expo-router/entry';
