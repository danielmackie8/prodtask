import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../ThemeContext';
import { COL, FONT_MEDIUM, PRIO, TIME_C } from '../theme';
import type { Task } from '../types';
import { getDueDateStyle } from '../utils';
import { Chip } from './Chip';

export function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const { T } = useTheme();
  const done = (task.actionPoints || []).filter((a) => a.done).length;
  const total = (task.actionPoints || []).length;
  const due = getDueDateStyle(task.dueDate);
  const statusChip = task.status && task.status !== 'Me' ? (task.status === 'Waiting on Candidate' ? 'Candidate' : 'Stakeholder') : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? T.cardHov : T.card,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: '500', color: T.white, lineHeight: 19, marginBottom: 8, fontFamily: FONT_MEDIUM }}>{task.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        {!!task.prio && <Chip label={task.prio} color={PRIO[task.prio]?.color} bg={PRIO[task.prio]?.bg} small />}
        {!!task.time && <Chip label={task.time} color={TIME_C.color} bg={TIME_C.bg} small />}
        {!!statusChip && <Chip label={statusChip} color="#c084fc" bg="rgba(192,132,252,0.15)" small />}
        {!!due && <Chip label={due.label} color={due.color} bg={due.bg} small />}
        {total > 0 && (
          <Text style={{ marginLeft: 'auto', fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>
            {done}/{total}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
