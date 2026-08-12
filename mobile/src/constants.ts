import type { ColumnKey } from './theme';

export const WAIT_STATUS = ['Waiting on Candidate', 'Waiting on Stakeholder'];
export const COLUMNS: ColumnKey[] = ['Weekly', 'To Do', 'Waiting', 'Complete'];
export const TIME_OPTS = ['15m', '30m', '1h', '2h', '4h'];
export const STATUS_OPTS = ['Me', 'Waiting on Candidate', 'Waiting on Stakeholder'];
export const PRIO_OPTS = ['Low', 'Med', 'High'];

export const ROLE_STATUSES = ['Open', 'Interviewing', 'Offer Out', 'Closed'];

export const NOTE_TAGS = ['Team Sync', 'Onboarding', 'Business Updates', 'Training', 'Other'];

export const TASKS_TABLE = 'tasks';
export const ROLES_TABLE = 'roles';
export const NOTES_TABLE = 'notes';

export const AI_MSGS_KEY = 'talin_ai_msgs';
export const AI_BRIEF_KEY = 'talin_last_brief';
export const THEME_KEY = 'talin_theme';
