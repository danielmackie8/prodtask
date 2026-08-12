import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { sb } from './supabase';
import { dbLoad, dbUpsert, dbDelete } from './db';
import { TASKS_TABLE, ROLES_TABLE, NOTES_TABLE } from './constants';
import type { Task, Role, NoteDoc } from './types';
import { useAuth } from './AuthContext';

type Updater<T> = T[] | ((prev: T[]) => T[]);

type DataContextValue = {
  tasks: Task[];
  roles: Role[];
  notes: NoteDoc[];
  setTasks: (u: Updater<Task>) => void;
  setRoles: (u: Updater<Role>) => void;
  setNotes: (u: Updater<NoteDoc>) => void;
  dataLoading: boolean;
};

const DataContext = createContext<DataContextValue | null>(null);

function makeSyncedSetter<T extends { id: string }>(
  table: string,
  userId: string | undefined,
  setRaw: React.Dispatch<React.SetStateAction<T[]>>
) {
  return (updater: Updater<T>) => {
    setRaw((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: T[]) => T[])(prev) : updater;
      if (userId) {
        const prevIds = new Set(prev.map((x) => x.id));
        const nextIds = new Set(next.map((x) => x.id));
        next.forEach((item) => {
          const prevItem = prev.find((p) => p.id === item.id);
          if (!prevIds.has(item.id) || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            dbUpsert(table, userId, item);
          }
        });
        prev.forEach((item) => {
          if (!nextIds.has(item.id)) dbDelete(table, item.id);
        });
      }
      return next;
    });
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [tasks, setTasksRaw] = useState<Task[]>([]);
  const [roles, setRolesRaw] = useState<Role[]>([]);
  const [notes, setNotesRaw] = useState<NoteDoc[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTasksRaw([]);
      setRolesRaw([]);
      setNotesRaw([]);
      return;
    }
    setDataLoading(true);
    Promise.all([
      dbLoad<Task>(TASKS_TABLE, userId),
      dbLoad<Role>(ROLES_TABLE, userId),
      dbLoad<NoteDoc>(NOTES_TABLE, userId),
    ])
      .then(([t, r, n]) => {
        setTasksRaw(t);
        setRolesRaw(r);
        setNotesRaw(n);
      })
      .finally(() => setDataLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const handle =
      <T extends { id: string }>(setRaw: React.Dispatch<React.SetStateAction<T[]>>) =>
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (newRow?.user_id && newRow.user_id !== userId) return;
        if (oldRow?.user_id && oldRow.user_id !== userId) return;
        setRaw((prev) => {
          if (eventType === 'INSERT') {
            if (prev.find((r) => r.id === newRow.id)) return prev;
            return [...prev, newRow.data];
          }
          if (eventType === 'UPDATE') {
            return prev.map((r) => (r.id === newRow.id ? newRow.data : r));
          }
          if (eventType === 'DELETE') {
            return prev.filter((r) => r.id !== oldRow.id);
          }
          return prev;
        });
      };

    const channel = sb
      .channel(`talin-mobile-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TASKS_TABLE }, handle<Task>(setTasksRaw))
      .on('postgres_changes', { event: '*', schema: 'public', table: ROLES_TABLE }, handle<Role>(setRolesRaw))
      .on('postgres_changes', { event: '*', schema: 'public', table: NOTES_TABLE }, handle<NoteDoc>(setNotesRaw))
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [userId]);

  const setTasks = useMemo(() => makeSyncedSetter<Task>(TASKS_TABLE, userId, setTasksRaw), [userId]);
  const setRoles = useMemo(() => makeSyncedSetter<Role>(ROLES_TABLE, userId, setRolesRaw), [userId]);
  const setNotes = useMemo(() => makeSyncedSetter<NoteDoc>(NOTES_TABLE, userId, setNotesRaw), [userId]);

  const value = useMemo<DataContextValue>(
    () => ({ tasks, roles, notes, setTasks, setRoles, setNotes, dataLoading }),
    [tasks, roles, notes, setTasks, setRoles, setNotes, dataLoading]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
