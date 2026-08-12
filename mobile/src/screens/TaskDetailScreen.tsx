import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { COL, FONT, FONT_MEDIUM, PRIO, TIME_C } from '../theme';
import { COLUMNS, PRIO_OPTS, STATUS_OPTS, TIME_OPTS, WAIT_STATUS } from '../constants';
import { uid } from '../utils';
import { Select, TextField } from '../components/Field';
import { DateField } from '../components/DateField';
import { Chip } from '../components/Chip';
import { Btn } from '../components/Btn';
import type { RootStackParamList } from '../navigation/types';
import type { ActionPoint, Note } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'TaskDetail'>;

export function TaskDetailScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { tasks, setTasks } = useData();
  const task = tasks.find((t) => t.id === route.params.taskId);

  const [title, setTitle] = useState(task?.title || '');
  const [prio, setPrio] = useState(task?.prio || '');
  const [time, setTime] = useState(task?.time || '');
  const [status, setStatus] = useState(task?.status || 'Me');
  const [column, setColumn] = useState(task?.column || 'To Do');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [notes, setNotes] = useState<Note[]>(task?.notes || []);
  const [actions, setActions] = useState<ActionPoint[]>(task?.actionPoints || []);
  const [noteText, setNoteText] = useState('');
  const [actionText, setActionText] = useState('');

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: T.muted, fontFamily: FONT }}>Task not found</Text>
      </SafeAreaView>
    );
  }

  const ac = COL[column]?.accent || '#4f8ef7';

  function save() {
    let col = column;
    if (WAIT_STATUS.includes(status) && col === 'To Do') col = 'Waiting';
    if (!WAIT_STATUS.includes(status) && col === 'Waiting') col = 'To Do';
    const finalTime = col === 'Waiting' || col === 'Complete' ? '' : time;
    const finalPrio = col === 'Complete' ? '' : prio;
    const finalDue = col === 'Complete' ? '' : dueDate;
    const finalStatus = col === 'Complete' ? 'Me' : status;
    setTasks((prev) =>
      prev.map((x) =>
        x.id === task!.id
          ? { ...x, title, prio: finalPrio as any, time: finalTime as any, status: finalStatus as any, column: col as any, dueDate: finalDue, notes, actionPoints: actions }
          : x
      )
    );
    navigation.goBack();
  }

  function del() {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTasks((prev) => prev.filter((x) => x.id !== task!.id));
          navigation.goBack();
        },
      },
    ]);
  }

  function addNote() {
    if (!noteText.trim()) return;
    setNotes([{ id: uid(), text: noteText.trim(), date: Date.now() }, ...notes]);
    setNoteText('');
  }
  function addAction() {
    if (!actionText.trim()) return;
    setActions([...actions, { id: uid(), text: actionText.trim(), done: false }]);
    setActionText('');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.surface }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.card }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 4, borderRadius: 2, backgroundColor: ac, alignSelf: 'stretch' }} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={{ flex: 1, fontSize: 18, fontWeight: '500', color: T.white, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: T.border, fontFamily: FONT_MEDIUM }}
            multiline
          />
          <Pressable onPress={save}>
            <Text style={{ color: T.muted, fontSize: 20, lineHeight: 22 }}>✕</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10, paddingLeft: 14 }}>
          <View style={{ borderRadius: 4, borderWidth: 1, borderColor: `${ac}44`, backgroundColor: COL[column]?.light, paddingVertical: 3, paddingHorizontal: 10 }}>
            <Text style={{ color: ac, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{column}</Text>
          </View>
          {!!prio && <Chip label={prio} color={PRIO[prio]?.color} bg={PRIO[prio]?.bg} small />}
          {!!time && <Chip label={time} color={TIME_C.color} bg={TIME_C.bg} small />}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Select label="Column" value={column} onChange={(v) => setColumn(v as any)} options={COLUMNS} accent={ac} />
          <Select label="Priority" value={prio} onChange={(v) => setPrio(v as any)} options={['', ...PRIO_OPTS]} accent={ac} />
          <Select label="Time estimate" value={time} onChange={(v) => setTime(v as any)} options={['', ...TIME_OPTS]} accent={ac} />
          <Select label="Status / Waiting" value={status} onChange={(v) => setStatus(v as any)} options={STATUS_OPTS} accent={ac} />
        </View>
        <DateField value={dueDate} onChange={setDueDate} accent={ac} />

        <View>
          <SectionLabel>Action Points</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextField value={actionText} onChangeText={setActionText} placeholder="Add action point…" onSubmitEditing={addAction} />
            <Btn onPress={addAction} small>Add</Btn>
          </View>
          <View style={{ gap: 8 }}>
            {actions.length === 0 && <EmptyHint>No action points yet.</EmptyHint>}
            {actions.map((a) => (
              <View
                key={a.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: a.done ? T.bg : T.card, borderWidth: 1, borderColor: a.done ? T.border : T.borderHi, borderRadius: 8, padding: 12 }}
              >
                <Pressable
                  onPress={() => setActions(actions.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)))}
                  style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: ac, backgroundColor: a.done ? ac : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                >
                  {a.done && <Text style={{ color: T.bg, fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </Pressable>
                <Text style={{ flex: 1, fontSize: 14, color: a.done ? T.muted : T.text, textDecorationLine: a.done ? 'line-through' : 'none', fontFamily: FONT }}>{a.text}</Text>
                <Pressable onPress={() => setActions(actions.filter((x) => x.id !== a.id))}>
                  <Text style={{ color: T.muted, fontSize: 15 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel>Notes &amp; Updates</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
            <TextField value={noteText} onChangeText={setNoteText} placeholder="Add a note or update…" multiline />
            <Btn onPress={addNote} small>Add</Btn>
          </View>
          <View style={{ gap: 8 }}>
            {notes.length === 0 && <EmptyHint>No notes yet.</EmptyHint>}
            {notes.map((n) => (
              <View key={n.id} style={{ backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border, borderLeftWidth: 3, borderLeftColor: ac, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: T.muted }}>{new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Pressable onPress={() => setNotes(notes.filter((x) => x.id !== n.id))}>
                    <Text style={{ color: T.muted, fontSize: 13 }}>✕</Text>
                  </Pressable>
                </View>
                <Text style={{ fontSize: 14, color: T.textSoft, lineHeight: 20, fontFamily: FONT }}>{n.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.bg }}>
        <Btn onPress={del} danger small>Delete task</Btn>
        <Btn onPress={save} accent={ac}>Save &amp; close</Btn>
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { T } = useTheme();
  return <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>{children}</Text>;
}
function EmptyHint({ children }: { children: React.ReactNode }) {
  const { T } = useTheme();
  return <Text style={{ fontSize: 13, color: T.muted, fontStyle: 'italic', fontFamily: FONT }}>{children}</Text>;
}
