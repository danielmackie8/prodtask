import React from 'react';
import { Text, View } from 'react-native';
import { MONO } from '../theme';

export function Chip({ label, color, bg, small, sz }: { label?: string; color?: string; bg?: string; small?: boolean; sz?: number }) {
  if (!label) return null;
  const fontSize = sz || (small ? 10 : 11);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: small ? 2 : 3,
        paddingHorizontal: small ? 6 : 9,
        borderRadius: 4,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: `${color}33`,
      }}
    >
      <Text style={{ fontSize, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color, fontFamily: MONO }}>{label}</Text>
    </View>
  );
}
