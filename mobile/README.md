# TALIN — iOS app

React Native (Expo, TypeScript) rewrite of the TALIN web app. Same Supabase
backend and tables as the web app (`tasks`, `roles`, `notes`), so signing in
here shows the same data you see on the web — changes sync live in both
directions via Supabase Realtime.

## What's implemented

- Google sign-in (Supabase Auth, native OAuth flow)
- Board: Weekly / To Do / Waiting / Complete columns, add/edit/delete tasks,
  action points, notes, due dates, auto-sort, urgent-only filter, clear-completed
- Hiring Manager: role list + detail, action points, updates, strategy doc link
- Notes: note list + detail with dated entries, tag filter
- AI Assistant: same Claude-powered chat, natural-language task actions,
  morning brief
- Dark/light theme (persisted), realtime sync across web + iOS + other devices

**Not carried over from web (follow-ups, not blockers):** cross-column
drag-and-drop (use the Column field in the task modal instead — HTML5 drag
doesn't translate to touch), the confetti animation on task completion,
manual drag-reorder within Weekly/Complete columns.

## One-time setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_ANTHROPIC_KEY` (same key the web app's `VITE_ANTHROPIC_KEY`
uses). Note this ships inside the compiled app bundle — anyone with the IPA
can extract it, the same tradeoff the web app already makes. If that becomes
a concern, move the Anthropic call behind a small server-side proxy later;
out of scope for this pass.

The Supabase URL and anon key are already wired up in `src/supabase.ts` —
same project the web app uses, no action needed.

### 3. Allow the app's OAuth redirect in Supabase

Google sign-in redirects back into the app via the custom URL scheme
`talin://auth-callback`. Add it to the allow-list:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**,
add:
```
talin://auth-callback
```

(No changes needed on the Google Cloud OAuth client — it still only ever
redirects to Supabase's own callback URL; Supabase then redirects to the
scheme above.)

### 4. Generate the native iOS project

This project uses Expo's prebuild workflow, so the `ios/` folder isn't
committed — generate it locally:

```bash
npx expo prebuild -p ios
```

Before building, it's worth running these once on a machine with full
network access (this project was scaffolded in a sandboxed environment that
couldn't reach `api.expo.dev`, so dependency versions were pinned by hand —
worth double-checking):

```bash
npx expo install --fix
npx expo-doctor
```

### 5. Run it

```bash
npx expo run:ios          # builds + launches in the iOS Simulator
```

Or open `ios/TALIN.xcworkspace` in Xcode directly and run on a simulator or
your device (set your Apple Developer team under Signing & Capabilities
first).

## Project layout

```
mobile/
├── App.tsx                  # providers, fonts, navigation root
├── src/
│   ├── theme.ts              # design tokens, column/priority/status colors
│   ├── constants.ts          # option lists, table names, storage keys
│   ├── types.ts              # Task / Role / NoteDoc / ChatMessage
│   ├── utils.ts               # sortTasks, getDueDateStyle, etc — ported 1:1 from web
│   ├── supabase.ts            # RN Supabase client (AsyncStorage session persistence)
│   ├── db.ts                  # load/upsert/delete helpers
│   ├── ai.ts                   # Anthropic call + system prompt + action parsing
│   ├── ThemeContext.tsx / AuthContext.tsx / DataContext.tsx
│   ├── components/            # Chip, Btn, Select, TextField, DateField, TaskCard, Logo
│   ├── screens/                # one screen per web page/panel
│   └── navigation/             # RootNavigator, MainTabs, per-tab stacks
```

## Notes on fidelity to the web app

- Business logic (`sortTasks`, `getDueDateStyle`, the AI system prompt, action
  application) is ported verbatim from `src/App.jsx` so behavior matches.
- Reads/writes go straight to Supabase (no localStorage-style local cache),
  same as the web app once signed in.
- `Select` fields use a custom bottom-sheet list instead of a native `<select>`
  (there's no RN equivalent) — behaves like an iOS action sheet.
