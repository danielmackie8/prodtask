import React, { useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { COL, FONT, FONT_MEDIUM, MONO } from '../theme';
import { COLUMNS } from '../constants';
import { columnTimeLabel, getDueDateStyle, sortTasks } from '../utils';
import { TaskCard } from '../components/TaskCard';
import type { RootStackParamList } from '../navigation/types';
import type { ColumnKey } from '../theme';
import type { Task } from '../types';

const DEFAULT_COL_IDX = COLUMNS.indexOf('To Do');

export function BoardScreen() {
  const { T } = useTheme();
  const { tasks, setTasks } = useData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [colIdx, setColIdx] = useState(DEFAULT_COL_IDX);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const col = COLUMNS[colIdx];
  const completedCount = tasks.filter((t) => t.column === 'Complete').length;

  function goToIndex(i: number) {
    setColIdx(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== colIdx) setColIdx(i);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: T.white, fontFamily: FONT_MEDIUM }}>Board</Text>
        {col !== 'Complete' && (
          <Pressable
            onPress={() => navigation.navigate('AddTask', { defaultColumn: col })}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COL[col].accent, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: T.bg, fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}>
        {COLUMNS.map((c, i) => {
          const cc = COL[c];
          const count = tasks.filter((t) => t.column === c).length;
          const active = i === colIdx;
          return (
            <Pressable
              key={c}
              onPress={() => goToIndex(i)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: active ? cc.accent : T.border,
                backgroundColor: active ? cc.light : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? cc.accent : T.dim, fontFamily: MONO }} numberOfLines={1}>
                {c} {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: DEFAULT_COL_IDX * width, y: 0 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ flex: 1 }}
      >
        {COLUMNS.map((c) => (
          <View key={c} style={{ width }}>
            <BoardColumnPage
              col={c}
              tasks={tasks}
              urgentOnly={urgentOnly}
              onToggleUrgent={() => setUrgentOnly((v) => !v)}
              onClearCompleted={() => setConfirmClear(true)}
              onTaskPress={(id) => navigation.navigate('TaskDetail', { taskId: id })}
            />
          </View>
        ))}
      </ScrollView>

      {confirmClear && (
        <ConfirmClearSheet
          count={completedCount}
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setTasks((p) => p.filter((t) => t.column !== 'Complete'));
            setConfirmClear(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function BoardColumnPage({
  col,
  tasks,
  urgentOnly,
  onToggleUrgent,
  onClearCompleted,
  onTaskPress,
}: {
  col: ColumnKey;
  tasks: Task[];
  urgentOnly: boolean;
  onToggleUrgent: () => void;
  onClearCompleted: () => void;
  onTaskPress: (id: string) => void;
}) {
  const { T } = useTheme();
  const ac = COL[col].accent;
  let colTasks = sortTasks(
    tasks.filter((t) => t.column === col),
    col
  );
  if (col === 'To Do' && urgentOnly) {
    colTasks = colTasks.filter((t) => {
      const d = getDueDateStyle(t.dueDate);
      return d && (d.label === 'Overdue' || d.label === 'Today');
    });
  }
  const timeLabel = columnTimeLabel(colTasks);
  const completedCount = tasks.filter((t) => t.column === 'Complete').length;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ac }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: T.white, fontFamily: FONT_MEDIUM }}>{col}</Text>
          {!!timeLabel && <Text style={{ fontSize: 11, color: T.muted, fontFamily: MONO }}>{timeLabel}</Text>}
        </View>
        {col === 'To Do' && (
          <Pressable
            onPress={onToggleUrgent}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: urgentOnly ? ac : T.border,
              backgroundColor: urgentOnly ? COL[col].light : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: urgentOnly ? ac : T.dim, fontWeight: '700' }}>!</Text>
          </Pressable>
        )}
        {col === 'Complete' && completedCount > 0 && (
          <Pressable
            onPress={onClearCompleted}
            style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13 }}>🗑</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={colTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <TaskCard task={item} onPress={() => onTaskPress(item.id)} />}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 13, color: T.muted, fontStyle: 'italic', fontFamily: FONT }}>
            {col === 'To Do' && urgentOnly ? 'Nothing overdue or due today' : 'Drop tasks here'}
          </Text>
        }
      />
    </View>
  );
}

function ConfirmClearSheet({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) {
  const { T } = useTheme();
  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,10,18,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 340, backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: T.border }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.white, marginBottom: 6, fontFamily: FONT_MEDIUM }}>Clear completed tasks?</Text>
          <Text style={{ fontSize: 13, color: T.textSoft, fontFamily: FONT }}>
            This will permanently delete all {count} completed task{count > 1 ? 's' : ''}. This cannot be undone.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 14 }}>
          <Pressable onPress={onCancel} style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: T.dim, fontFamily: FONT_MEDIUM }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f0629222', borderRadius: 8, borderWidth: 1, borderColor: '#f0629255' }}>
            <Text style={{ color: '#f06292', fontFamily: FONT_MEDIUM }}>Clear all</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
