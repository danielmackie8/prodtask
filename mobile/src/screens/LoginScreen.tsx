import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { FONT, FONT_MEDIUM } from '../theme';
import { Logo } from '../components/Logo';

export function LoginScreen() {
  const { T, theme, toggleTheme } = useTheme();
  const { signInWithGoogle, signingIn, signInError } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 32 }}>
        <Pressable onPress={toggleTheme} style={{ position: 'absolute', top: 16, right: 16, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ color: T.dim, fontSize: 12, fontFamily: FONT_MEDIUM }}>{theme === 'dark' ? 'Light' : 'Dark'}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size={32} />
          <Text style={{ fontSize: 28, fontWeight: '700', color: T.white, letterSpacing: -0.5, fontFamily: FONT_MEDIUM }}>TALIN</Text>
        </View>

        <View style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', gap: 20 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: T.white, fontFamily: FONT_MEDIUM }}>Welcome back</Text>
            <Text style={{ fontSize: 13, color: T.muted, fontFamily: FONT }}>Sign in to access your board</Text>
          </View>
          <Pressable
            onPress={signInWithGoogle}
            disabled={signingIn}
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 20,
              backgroundColor: T.card,
              borderWidth: 1,
              borderColor: T.border,
              borderRadius: 10,
              opacity: signingIn ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: T.text, fontFamily: FONT_MEDIUM }}>
              {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </Text>
          </Pressable>
          {!!signInError && <Text style={{ fontSize: 12, color: '#f06292', textAlign: 'center', fontFamily: FONT }}>{signInError}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}
