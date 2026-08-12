import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { FONT, FONT_MEDIUM, NOTE_TAG_COLORS } from '../theme';
import { NOTE_TAGS } from '../constants';
import { uid } from '../utils';
import type { NotesStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<NotesStackParamList>;

export function NoteListScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const { notes, setNotes } = useData();
  const [filterTag, setFilterTag] = useState('');

  const filtered = notes.filter((n) => !filterTag || n.tag === filterTag);

  function addNote() {
    const n = { id: uid(), title: '', tag: '', entries: [], createdAt: Date.now() };
    setNotes((p) => [n, ...p]);
    navigation.navigate('NoteDetail', { noteId: n.id });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: T.white, fontFamily: FONT_MEDIUM }}>Notes</Text>
        <Pressable onPress={addNote} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#4f8ef7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.bg, fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}>
        {['', ...NOTE_TAGS].map((tag) => (
          <Pressable
            key={tag || 'all'}
            onPress={() => setFilterTag(tag)}
            style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14, backgroundColor: filterTag === tag ? '#4f8ef7' : T.card, borderWidth: 1, borderColor: filterTag === tag ? '#4f8ef7' : T.border }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: filterTag === tag ? T.bg : T.dim }}>{tag || 'All'}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: note }) => {
          const tc = NOTE_TAG_COLORS[note.tag] || null;
          return (
            <Pressable
              onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
              style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: T.white, marginBottom: 4, fontFamily: FONT_MEDIUM }}>{note.title || 'Untitled'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {tc && (
                    <View style={{ paddingVertical: 1, paddingHorizontal: 7, borderRadius: 8, backgroundColor: tc.bg }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: tc.color, textTransform: 'uppercase' }}>{note.tag}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: T.muted }}>{(note.entries || []).length} entries</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, color: T.border }}>›</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 13, color: T.muted, fontStyle: 'italic', fontFamily: FONT }}>No notes yet — tap + to add one</Text>}
      />
    </SafeAreaView>
  );
}
