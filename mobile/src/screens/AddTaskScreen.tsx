import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { COL, FONT_MEDIUM } from '../theme';
import { COLUMNS, PRIO_OPTS, STATUS_OPTS, TIME_OPTS, WAIT_STATUS } from '../constants';
import { uid } from '../utils';
import { Select, TextField } from '../components/Field';
import { DateField } from '../components/DateField';
import { Btn } from '../components/Btn';
import type { RootStackParamList } from '../navigation/types';
import type { ColumnKey } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AddTask'>;

export function AddTaskScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { setTasks } = useData();

  const [title, setTitle] = useState('');
  const [col, setCol] = useState<ColumnKey>(route.params?.defaultColumn || 'To Do');
  const [prio, setPrio] = useState('Med');
  const [time, setTime] = useState('30m');
  const [status, setStatus] = useState('Me');
  const [dueDate, setDueDate] = useState('');

  const ac = COL[col]?.accent || '#4f8ef7';

  function add() {
    if (!title.trim()) return;
    let c = col;
    if (WAIT_STATUS.includes(status) && c === 'To Do') c = 'Waiting';
    setTasks((p) => [
      ...p,
      { id: uid(), title: title.trim(), column: c, prio: prio as any, time: time as any, status: status as any, dueDate, notes: [], actionPoints: [], createdAt: Date.now() },
    ]);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.surface }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: T.white, fontFamily: FONT_MEDIUM }}>New task</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: T.muted, fontSize: 20, lineHeight: 22 }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <TextField value={title} onChangeText={setTitle} placeholder="What needs doing?" autoFocus onSubmitEditing={add} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Select label="Column" value={col} onChange={(v) => setCol(v as ColumnKey)} options={COLUMNS} accent={ac} />
          <Select label="Priority" value={prio} onChange={setPrio} options={PRIO_OPTS} accent={ac} />
          <Select label="Time estimate" value={time} onChange={setTime} options={TIME_OPTS} accent={ac} />
          <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTS} accent={ac} />
        </View>
        <DateField value={dueDate} onChange={setDueDate} accent={ac} />
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.bg }}>
        <Btn onPress={() => navigation.goBack()} ghost small>Cancel</Btn>
        <Btn onPress={add} accent={ac} small>Add task</Btn>
      </View>
    </SafeAreaView>
  );
}
