import { useColorScheme } from './colorScheme';

import { Group } from './types';

export const lightTheme = {
  background: '#F6F4EF',
  card: '#FFFFFF',
  text: '#1D1B18',
  muted: '#6F6A62',
  border: '#E4E0D8',
  primary: '#2F6B5E',
  primaryText: '#FFFFFF',
  danger: '#B3261E',
  groups: { morning: '#D98A1E', work: '#2F6FB3', evening: '#6B4FB3' } as Record<Group, string>,
};

export const darkTheme: typeof lightTheme = {
  background: '#141311',
  card: '#1F1D1A',
  text: '#F1EEE8',
  muted: '#A39D93',
  border: '#34312C',
  primary: '#6FBFAA',
  primaryText: '#0E1F1B',
  danger: '#F2B8B5',
  groups: { morning: '#F0B357', work: '#7DAEE6', evening: '#AE98EB' },
};

export type Theme = typeof lightTheme;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
