import type { ColumnKey } from './theme';
import type { Task } from './types';

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function fmtDate(d: number) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateInputValue(d: Date) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const PRIO_RANK: Record<string, number> = { High: 0, Med: 1, Low: 2, '': 3 };
const TIME_RANK: Record<string, number> = { '15m': 0, '30m': 1, '1h': 2, '2h': 3, '4h': 4, '': 5 };
export const SORT_COLS: ColumnKey[] = ['To Do', 'Waiting'];

export function sortTasks(tasks: Task[], col: ColumnKey) {
  if (!SORT_COLS.includes(col)) return tasks;
  return [...tasks].sort((a, b) => {
    const aHas = !!a.dueDate;
    const bHas = !!b.dueDate;
    if (aHas && bHas) {
      const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (dateDiff !== 0) return dateDiff;
    } else if (aHas) return -1;
    else if (bHas) return 1;
    const pd = (PRIO_RANK[a.prio] ?? 3) - (PRIO_RANK[b.prio] ?? 3);
    if (pd !== 0) return pd;
    return (TIME_RANK[a.time] ?? 5) - (TIME_RANK[b.time] ?? 5);
  });
}

export type DueStyle = { color: string; bg: string; label: string };

export function getDueDateStyle(dueDate?: string): DueStyle | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { color: '#f06292', bg: 'rgba(240,98,146,0.15)', label: 'Overdue' };
  if (diff === 0) return { color: '#f5a623', bg: 'rgba(245,166,35,0.15)', label: 'Today' };
  if (diff === 1) return { color: '#f5a623', bg: 'rgba(245,166,35,0.12)', label: 'Tomorrow' };
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const nextFriday = new Date(monday);
  nextFriday.setDate(monday.getDate() + 11);
  if (due >= monday && due <= friday) return { color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)', label: 'This Week' };
  if (due >= nextMonday && due <= nextFriday) return { color: '#4f8ef7', bg: 'rgba(79,142,247,0.10)', label: 'Next Week' };
  return null;
}

const TIME_MINS: Record<string, number> = { '15m': 15, '30m': 30, '1h': 60, '2h': 120, '4h': 240 };

export function columnTimeLabel(tasks: Task[]) {
  const totalMins = tasks.reduce((sum, t) => sum + (TIME_MINS[t.time] || 0), 0);
  if (totalMins === 0) return null;
  if (totalMins < 60) return `${totalMins}m`;
  if (totalMins % 60 === 0) return `${totalMins / 60}h`;
  return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
}

export function openLink(url: string) {
  const target = url.startsWith('http') ? url : `https://${url}`;
  return target;
}
