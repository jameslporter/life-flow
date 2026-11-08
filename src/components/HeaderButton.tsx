import { Link, type Href } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/lib/theme';

export function HeaderLink({ href, label }: { href: Href; label: string }) {
  const theme = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable hitSlop={8} style={{ paddingHorizontal: 8 }}>
        <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>{label}</Text>
      </Pressable>
    </Link>
  );
}
