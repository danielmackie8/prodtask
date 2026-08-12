import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { FONT, FONT_MEDIUM } from '../theme';
import { AI_BRIEF_KEY, AI_MSGS_KEY } from '../constants';
import { sendAiMessage } from '../ai';
import type { ChatMessage } from '../types';

const DEFAULT_MSGS: ChatMessage[] = [
  { role: 'assistant', text: "Hi! I can help manage your board.\n\n• Good morning\n• List all tasks\n• What's waiting?\n• HM action points" },
];

const QUICK = ['Good morning', 'List all tasks', "What's waiting?", 'HM action points', 'How did my week go?'];

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY || '';

export function AiScreen() {
  const { T } = useTheme();
  const { tasks, roles, notes, setTasks } = useData();
  const [msgs, setMsgs] = useState<ChatMessage[]>(DEFAULT_MSGS);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);
  const didBrief = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(AI_MSGS_KEY).then((v) => {
      if (v) {
        try {
          setMsgs(JSON.parse(v));
        } catch {}
      }
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(AI_MSGS_KEY, JSON.stringify(msgs.slice(-50)));
  }, [msgs]);

  useEffect(() => {
    if (didBrief.current || busy || tasks.length === 0 || !loaded.current) return;
    AsyncStorage.getItem(AI_BRIEF_KEY).then((lastBrief) => {
      const today = new Date().toDateString();
      if (lastBrief === today) return;
      didBrief.current = true;
      AsyncStorage.setItem(AI_BRIEF_KEY, today);
      setTimeout(() => sendMsg('Good morning'), 800);
    });
  }, [tasks.length, loaded.current]);

  async function sendMsg(msg: string) {
    if (!msg || busy) return;
    if (!ANTHROPIC_KEY) {
      setMsgs((p) => [...p, { role: 'user', text: msg }, { role: 'assistant', text: '⚠️ AI Assistant is not configured — missing EXPO_PUBLIC_ANTHROPIC_KEY.' }]);
      return;
    }
    setBusy(true);
    setMsgs((p) => [...p, { role: 'user', text: msg }]);
    try {
      const reply = await sendAiMessage({ msg, tasks, roles, notes, setTasks, apiKey: ANTHROPIC_KEY });
      setMsgs((p) => [...p, { role: 'assistant', text: reply }]);
    } catch (e: any) {
      setMsgs((p) => [...p, { role: 'assistant', text: '⚠️ ' + (e?.message || 'Something went wrong'), retry: true, retryMsg: msg }]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    await sendMsg(msg);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: T.white, fontFamily: FONT_MEDIUM }}>AI Assistant</Text>
        </View>

        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: m }) => (
            <View
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                backgroundColor: m.role === 'user' ? '#4f8ef7cc' : T.card,
                borderRadius: 14,
                borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                padding: 12,
                borderWidth: 1,
                borderColor: m.role === 'user' ? '#4f8ef733' : T.border,
              }}
            >
              <Text style={{ color: T.text, fontSize: 14, lineHeight: 20, fontFamily: FONT }}>{m.text}</Text>
              {m.retry && (
                <Pressable onPress={() => setInput(m.retryMsg || '')} style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(79,142,247,0.15)', borderWidth: 1, borderColor: 'rgba(79,142,247,0.4)' }}>
                  <Text style={{ color: '#4f8ef7', fontSize: 12 }}>↺ Retry</Text>
                </Pressable>
              )}
            </View>
          )}
          ListFooterComponent={
            busy ? (
              <View style={{ alignSelf: 'flex-start', backgroundColor: T.card, borderWidth: 1, borderColor: T.borderHi, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: T.dim, fontSize: 12 }}>Thinking…</Text>
              </View>
            ) : null
          }
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 10 }}>
          {QUICK.map((c) => (
            <Pressable key={c} onPress={() => setInput(c)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: T.card, borderWidth: 1, borderColor: T.border }}>
              <Text style={{ fontSize: 12, color: T.dim, fontFamily: FONT }}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me about your tasks…"
            placeholderTextColor={T.muted}
            editable={!busy}
            onSubmitEditing={send}
            style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 8, color: T.text, paddingVertical: 10, paddingHorizontal: 12, fontFamily: FONT }}
          />
          <Pressable
            onPress={send}
            disabled={busy || !input.trim()}
            style={{ backgroundColor: '#4f8ef7', borderRadius: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.4 : 1 }}
          >
            <Text style={{ color: T.bg, fontFamily: FONT_MEDIUM }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
