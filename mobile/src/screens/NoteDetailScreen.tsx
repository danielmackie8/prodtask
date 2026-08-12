import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { FONT, FONT_MEDIUM, NOTE_TAG_COLORS } from '../theme';
import { NOTE_TAGS } from '../constants';
import { uid } from '../utils';
import { Select, TextField } from '../components/Field';
import { Btn } from '../components/Btn';
import type { NotesStackParamList } from '../navigation/types';
import type { NoteEntry } from '../types';

type Nav = NativeStackNavigationProp<NotesStackParamList>;
type Rt = RouteProp<NotesStackParamList, 'NoteDetail'>;

export function NoteDetailScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { notes, setNotes } = useData();
  const note = notes.find((n) => n.id === route.params.noteId);

  const [title, setTitle] = useState(note?.title || '');
  const [tag, setTag] = useState(note?.tag || '');
  const [entries, setEntries] = useState<NoteEntry[]>(note?.entries || []);
  const [newEntry, setNewEntry] = useState('');

  if (!note) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: T.muted, fontFamily: FONT }}>Note not found</Text>
      </SafeAreaView>
    );
  }

  const tc = NOTE_TAG_COLORS[tag] || { color: '#6b7aa1', bg: 'rgba(107,122,161,0.15)' };

  function save(patch: Partial<typeof note>) {
    setNotes((prev) => prev.map((n) => (n.id === note!.id ? { ...n, title, tag, entries, ...patch } : n)));
  }

  function addEntry() {
    if (!newEntry.trim()) return;
    const next = [{ id: uid(), text: newEntry.trim(), date: Date.now() }, ...entries];
    setEntries(next);
    setNewEntry('');
    save({ entries: next } as any);
  }

  function del() {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setNotes((prev) => prev.filter((n) => n.id !== note!.id)); navigation.goBack(); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.surface }} edges={['bottom']}>
      <View style={{ padding: 16, borderBottomWidth: 2, borderBottomColor: tc.color, backgroundColor: T.card, gap: 12 }}>
        <TextField value={title} onChangeText={setTitle} placeholder="Note title" onSubmitEditing={() => save({ title } as any)} />
        <Select label="Tag" value={tag} onChange={(v) => { setTag(v); save({ tag: v } as any); }} options={['', ...NOTE_TAGS]} accent={tc.color} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <TextField value={newEntry} onChangeText={setNewEntry} placeholder="Add an entry…" multiline />
          <Btn onPress={addEntry} small>Add</Btn>
        </View>
        <View style={{ gap: 8 }}>
          {entries.length === 0 && <Text style={{ fontSize: 13, color: T.muted, fontStyle: 'italic', fontFamily: FONT }}>No entries yet.</Text>}
          {entries.map((e) => (
            <View key={e.id} style={{ backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border, borderLeftWidth: 3, borderLeftColor: tc.color, padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: T.muted }}>
                  {new Date(e.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Pressable onPress={() => { const next = entries.filter((x) => x.id !== e.id); setEntries(next); save({ entries: next } as any); }}>
                  <Text style={{ color: T.muted, fontSize: 13 }}>✕</Text>
                </Pressable>
              </View>
              <Text style={{ fontSize: 14, color: T.textSoft, lineHeight: 20, fontFamily: FONT }}>{e.text}</Text>
            </View>
          ))}
        </View>
        <Btn onPress={del} danger small>Delete note</Btn>
      </ScrollView>
    </SafeAreaView>
  );
}
