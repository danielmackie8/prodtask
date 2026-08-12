import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import { useData } from '../DataContext';
import { FONT, FONT_MEDIUM, MONO, PRIO, ROLE_STATUS_COLORS } from '../theme';
import { uid } from '../utils';
import { Chip } from '../components/Chip';
import type { HiringStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HiringStackParamList>;

export function RoleListScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<Nav>();
  const { roles, setRoles } = useData();
  const [sortBy, setSortBy] = useState<'prio' | 'hm' | 'job'>('prio');

  const PRIO_SORT: Record<string, number> = { High: 0, Med: 1, Low: 2, '': 3 };
  const sorted = [...roles].sort((a, b) => {
    if (sortBy === 'hm') return (a.hiringManager || '').localeCompare(b.hiringManager || '');
    if (sortBy === 'job') return a.title.localeCompare(b.title);
    return (PRIO_SORT[a.prio] ?? 3) - (PRIO_SORT[b.prio] ?? 3);
  });

  function addRole() {
    const nr = { id: uid(), title: 'New Role', status: 'Open' as const, hiringManager: '', prio: 'Med' as const, strategyDoc: '', actionPoints: [], updates: [] };
    setRoles((p) => [...p, nr]);
    navigation.navigate('RoleDetail', { roleId: nr.id });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: T.white, fontFamily: FONT_MEDIUM }}>Hiring Manager</Text>
        <Pressable onPress={addRole} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#4f8ef7', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.bg, fontSize: 18, fontWeight: '700', lineHeight: 20 }}>+</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingBottom: 10 }}>
        {(['prio', 'hm', 'job'] as const).map((val) => (
          <Pressable
            key={val}
            onPress={() => setSortBy(val)}
            style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14, backgroundColor: sortBy === val ? '#4f8ef7' : T.card, borderWidth: 1, borderColor: sortBy === val ? '#4f8ef7' : T.border }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: sortBy === val ? T.bg : T.dim, fontFamily: MONO }}>
              {val === 'prio' ? 'Priority' : val === 'hm' ? 'HM' : 'Job title'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: role }) => {
          const sc = ROLE_STATUS_COLORS[role.status] || { color: T.dim, bg: 'transparent' };
          return (
            <Pressable
              onPress={() => navigation.navigate('RoleDetail', { roleId: role.id })}
              style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: T.white, marginBottom: 4, fontFamily: FONT_MEDIUM }}>{role.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc.color }} />
                  <Text style={{ fontSize: 13, color: T.textSoft, fontFamily: FONT }}>{role.hiringManager || 'No HM'}</Text>
                  <Text style={{ fontSize: 11, color: T.muted, fontFamily: MONO }}>{role.status}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!!role.prio && <Chip label={role.prio} color={PRIO[role.prio]?.color} bg={PRIO[role.prio]?.bg} small />}
                <Text style={{ fontSize: 18, color: T.border }}>›</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', paddingVertical: 32, fontSize: 13, color: T.muted, fontStyle: 'italic', fontFamily: FONT }}>No roles yet — tap + to add one</Text>
        }
      />
    </SafeAreaView>
  );
}
