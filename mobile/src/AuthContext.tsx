import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { sb } from './supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  session: Session | null;
  authLoading: boolean;
  signInError: string;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');
  const paramsStr = hashIdx > -1 ? url.slice(hashIdx + 1) : queryIdx > -1 ? url.slice(queryIdx + 1) : '';
  const params = new URLSearchParams(paramsStr);
  return {
    access_token: params.get('access_token') || undefined,
    refresh_token: params.get('refresh_token') || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    setSigningIn(true);
    setSignInError('');
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error || new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        if (result.type !== 'cancel' && result.type !== 'dismiss') {
          setSignInError('Sign-in did not complete. Please try again.');
        }
        return;
      }

      const { access_token, refresh_token } = parseTokensFromUrl(result.url);
      if (!access_token || !refresh_token) throw new Error('Missing tokens in redirect');
      const { error: sessionError } = await sb.auth.setSession({ access_token, refresh_token });
      if (sessionError) throw sessionError;
    } catch (e: any) {
      setSignInError(e?.message || 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  }

  async function signOut() {
    await sb.auth.signOut();
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, authLoading, signInError, signingIn, signInWithGoogle, signOut }),
    [session, authLoading, signInError, signingIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
