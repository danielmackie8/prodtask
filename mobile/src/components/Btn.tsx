import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../ThemeContext';
import { FONT_MEDIUM } from '../theme';

export function Btn({
  children,
  onPress,
  accent,
  tint,
  danger,
  ghost,
  small,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onPress: () => void;
  accent?: string;
  tint?: string;
  danger?: boolean;
  ghost?: boolean;
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { T } = useTheme();
  const c = tint || (danger ? '#f06292' : null);
  const bg = c ? `${c}22` : accent ? accent : ghost ? 'transparent' : T.card;
  const col = c ? c : accent ? T.bg : T.textSoft;
  const bord = c ? `${c}55` : accent ? 'transparent' : T.border;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderColor: bord,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: small ? 7 : 10,
        paddingHorizontal: small ? 14 : 18,
        opacity: isDisabled ? 0.4 : pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      })}
    >
      {loading && <ActivityIndicator size="small" color={col} />}
      <Text style={{ color: col, fontSize: small ? 12 : 13, fontWeight: '500', fontFamily: FONT_MEDIUM }}>{children}</Text>
    </Pressable>
  );
}
