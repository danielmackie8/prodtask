import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { FONT, FONT_MEDIUM, PRIO, ROLE_STATUS_COLORS } from '../theme';
import { ROLE_STATUSES } from '../constants';
import { uid, openLink } from '../utils';
import { Select, TextField } from '../components/Field';
import { Btn } from '../components/Btn';
import type { HiringStackParamList } from '../navigation/types';
import type { ActionPoint, Role, RoleUpdate } from '../types';

type Nav = NativeStackNavigationProp<HiringStackParamList>;
type Rt = RouteProp<HiringStackParamList, 'RoleDetail'>;

export function RoleDetailScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { roles, setRoles } = useData();
  const role = roles.find((r) => r.id === route.params.roleId);

  const [title, setTitle] = useState(role?.title || '');
  const [status, setStatus] = useState<Role['status']>(role?.status || 'Open');
  const [hm, setHm] = useState(role?.hiringManager || '');
  const [prio, setPrio] = useState<Role['prio']>(role?.prio || '');
  const [strategyDoc, setStrategyDoc] = useState(role?.strategyDoc || '');
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>(role?.actionPoints || []);
  const [updates, setUpdates] = useState<RoleUpdate[]>(role?.updates || []);
  const [newAction, setNewAction] = useState('');
  const [newUpdate, setNewUpdate] = useState('');

  if (!role) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: T.muted, fontFamily: FONT }}>Role not found</Text>
      </SafeAreaView>
    );
  }

  const sc = ROLE_STATUS_COLORS[status] || { color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' };

  function save(patch: Partial<typeof role>) {
    setRoles((prev) => prev.map((r) => (r.id === role!.id ? { ...r, title, status, hiringManager: hm, prio, strategyDoc, actionPoints, updates, ...patch } : r)));
  }

  function addAction() {
    if (!newAction.trim()) return;
    const next = [...actionPoints, { id: uid(), text: newAction.trim(), done: false }];
    setActionPoints(next);
    setNewAction('');
    save({ actionPoints: next } as any);
  }
  function addUpdate() {
    if (!newUpdate.trim()) return;
    const next = [{ id: uid(), text: newUpdate.trim(), date: Date.now() }, ...updates];
    setUpdates(next);
    setNewUpdate('');
    save({ updates: next } as any);
  }
  function del() {
    Alert.alert('Delete role?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setRoles((prev) => prev.filter((r) => r.id !== role!.id)); navigation.goBack(); } },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.surface }} edges={['bottom']}>
      <View style={{ padding: 16, borderBottomWidth: 2, borderBottomColor: sc.color, backgroundColor: T.card }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TextField value={title} onChangeText={(v) => { setTitle(v); }} placeholder="Role title" />
          <Pressable onPress={() => save({ title } as any)} style={{ marginLeft: 8 }}>
            <Text style={{ color: '#4f8ef7', fontFamily: FONT_MEDIUM, fontSize: 13 }}>Save</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Select label="Status" value={status} onChange={(v) => { setStatus(v as any); save({ status: v } as any); }} options={ROLE_STATUSES} accent={sc.color} />
          <Select label="Priority" value={prio} onChange={(v) => { setPrio(v as any); save({ prio: v } as any); }} options={['', 'Low', 'Med', 'High']} accent={sc.color} />
          <View style={{ flexGrow: 1, minWidth: 150 }}>
            <TextField label="Hiring Manager" value={hm} onChangeText={setHm} placeholder="Name…" onSubmitEditing={() => save({ hiringManager: hm } as any)} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
          <SectionLabel>Strategy Doc</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextField value={strategyDoc} onChangeText={setStrategyDoc} placeholder="Paste link…" onSubmitEditing={() => save({ strategyDoc } as any)} />
            {!!strategyDoc && (
              <Pressable onPress={() => Linking.openURL(openLink(strategyDoc))} style={{ justifyContent: 'center', paddingHorizontal: 14, backgroundColor: 'rgba(79,142,247,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(79,142,247,0.4)' }}>
                <Text style={{ color: '#4f8ef7', fontFamily: FONT_MEDIUM, fontSize: 13 }}>Open</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View>
          <SectionLabel>Action Points</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextField value={newAction} onChangeText={setNewAction} placeholder="Add action point…" onSubmitEditing={addAction} />
            <Btn onPress={addAction} small>Add</Btn>
          </View>
          <View style={{ gap: 8 }}>
            {actionPoints.length === 0 && <EmptyHint>No action points yet.</EmptyHint>}
            {actionPoints.map((a) => (
              <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: a.done ? T.bg : T.card, borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 12 }}>
                <Pressable
                  onPress={() => { const next = actionPoints.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)); setActionPoints(next); save({ actionPoints: next } as any); }}
                  style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#4caf86', backgroundColor: a.done ? '#4caf86' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                >
                  {a.done && <Text style={{ color: T.bg, fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </Pressable>
                <Text style={{ flex: 1, fontSize: 14, color: a.done ? T.muted : T.text, textDecorationLine: a.done ? 'line-through' : 'none', fontFamily: FONT }}>{a.text}</Text>
                <Pressable onPress={() => { const next = actionPoints.filter((x) => x.id !== a.id); setActionPoints(next); save({ actionPoints: next } as any); }}>
                  <Text style={{ color: T.muted, fontSize: 15 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel>Updates</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
            <TextField value={newUpdate} onChangeText={setNewUpdate} placeholder="Add an update or note…" multiline />
            <Btn onPress={addUpdate} small>Add</Btn>
          </View>
          <View style={{ gap: 8 }}>
            {updates.length === 0 && <EmptyHint>No updates yet.</EmptyHint>}
            {updates.map((u) => (
              <View key={u.id} style={{ backgroundColor: T.bg, borderRadius: 8, borderWidth: 1, borderColor: T.border, borderLeftWidth: 3, borderLeftColor: sc.color, padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: T.muted }}>{new Date(u.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Pressable onPress={() => { const next = updates.filter((x) => x.id !== u.id); setUpdates(next); save({ updates: next } as any); }}>
                    <Text style={{ color: T.muted, fontSize: 13 }}>✕</Text>
                  </Pressable>
                </View>
                <Text style={{ fontSize: 14, color: T.textSoft, lineHeight: 20, fontFamily: FONT }}>{u.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Btn onPress={del} danger small>Delete role</Btn>
      </ScrollView>
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
