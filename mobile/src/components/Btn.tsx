import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../ThemeContext';
import { FONT_MEDIUM } from '../theme';

export function Btn({
  children,
  onPress,
  accent,
  danger,
  ghost,
  small,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onPress: () => void;
  accent?: string;
  danger?: boolean;
  ghost?: boolean;
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { T } = useTheme();
  const bg = danger ? '#f0629222' : accent ? accent : ghost ? 'transparent' : T.card;
  const col = danger ? '#f06292' : accent ? T.bg : T.textSoft;
  const bord = danger ? '#f0629255' : accent ? 'transparent' : T.border;
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
