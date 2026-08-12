export type ThemeTokens = {
  bg: string;
  surface: string;
  card: string;
  cardHov: string;
  border: string;
  borderHi: string;
  muted: string;
  dim: string;
  text: string;
  textSoft: string;
  white: string;
};

export const DARK: ThemeTokens = {
  bg: '#0f1117',
  surface: '#181c27',
  card: '#1e2333',
  cardHov: '#242a3d',
  border: '#2a3045',
  borderHi: '#3d4a6a',
  muted: '#4a5578',
  dim: '#6b7aa1',
  text: '#dce3f5',
  textSoft: '#9ba8c9',
  white: '#f0f4ff',
};

export const LIGHT: ThemeTokens = {
  bg: '#f4f6fb',
  surface: '#ffffff',
  card: '#ffffff',
  cardHov: '#eef1f8',
  border: '#dde2f0',
  borderHi: '#b8c2dc',
  muted: '#8a96b8',
  dim: '#5a6785',
  text: '#1e2640',
  textSoft: '#4a5578',
  white: '#1e2640',
};

export type ColumnKey = 'Weekly' | 'To Do' | 'Waiting' | 'Complete';

export const COL: Record<ColumnKey, { accent: string; light: string; glow: string }> = {
  Weekly: { accent: '#4f8ef7', light: 'rgba(79,142,247,0.12)', glow: 'rgba(79,142,247,0.25)' },
  'To Do': { accent: '#f5a623', light: 'rgba(245,166,35,0.12)', glow: 'rgba(245,166,35,0.25)' },
  Waiting: { accent: '#f06292', light: 'rgba(240,98,146,0.12)', glow: 'rgba(240,98,146,0.25)' },
  Complete: { accent: '#4caf86', light: 'rgba(76,175,134,0.12)', glow: 'rgba(76,175,134,0.25)' },
};

export const PRIO: Record<string, { color: string; bg: string }> = {
  Low: { color: '#4caf86', bg: 'rgba(76,175,134,0.15)' },
  Med: { color: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
  High: { color: '#f06292', bg: 'rgba(240,98,146,0.15)' },
};

export const TIME_C = { color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' };

export const ROLE_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Open: { color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' },
  Interviewing: { color: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
  'Offer Out': { color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  Closed: { color: '#4caf86', bg: 'rgba(76,175,134,0.15)' },
};

export const NOTE_TAG_COLORS: Record<string, { color: string; bg: string }> = {
  'Team Sync': { color: '#4f8ef7', bg: 'rgba(79,142,247,0.15)' },
  Onboarding: { color: '#f5a623', bg: 'rgba(245,166,35,0.15)' },
  'Business Updates': { color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  Training: { color: '#4caf86', bg: 'rgba(76,175,134,0.15)' },
  Other: { color: '#6b7aa1', bg: 'rgba(107,122,161,0.15)' },
};

export const FONT = 'DMSans_400Regular';
export const FONT_MEDIUM = 'DMSans_500Medium';
export const FONT_SEMIBOLD = 'DMSans_600SemiBold';
export const MONO = 'DMMono_500Medium';
