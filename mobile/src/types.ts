import type { ColumnKey } from './theme';

export type Note = {
  id: string;
  text: string;
  date: number;
};

export type ActionPoint = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  column: ColumnKey;
  prio: 'Low' | 'Med' | 'High' | '';
  time: '15m' | '30m' | '1h' | '2h' | '4h' | '';
  status: 'Me' | 'Waiting on Candidate' | 'Waiting on Stakeholder' | '';
  dueDate: string;
  notes: Note[];
  actionPoints: ActionPoint[];
  createdAt: number;
};

export type RoleUpdate = {
  id: string;
  text: string;
  date: number;
};

export type Role = {
  id: string;
  title: string;
  status: 'Open' | 'Interviewing' | 'Offer Out' | 'Closed';
  hiringManager: string;
  prio: 'Low' | 'Med' | 'High' | '';
  strategyDoc: string;
  actionPoints: ActionPoint[];
  updates: RoleUpdate[];
};

export type NoteEntry = {
  id: string;
  text: string;
  date: number;
};

export type NoteDoc = {
  id: string;
  title: string;
  tag: string;
  entries: NoteEntry[];
  createdAt: number;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  retry?: boolean;
  retryMsg?: string;
};
