import type { ColumnKey } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TaskDetail: { taskId: string };
  AddTask: { defaultColumn?: ColumnKey };
};

export type HiringStackParamList = {
  RoleList: undefined;
  RoleDetail: { roleId: string };
};

export type NotesStackParamList = {
  NoteList: undefined;
  NoteDetail: { noteId: string };
};

export type MainTabParamList = {
  Board: undefined;
  Hiring: undefined;
  Notes: undefined;
  Ai: undefined;
};
