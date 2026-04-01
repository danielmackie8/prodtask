# TALIN — Claude Code Project Context

## What is TALIN?

TALIN is a React/Vite productivity dashboard built for a UK-based recruiter/hiring manager. It is a single-file React app (`src/App.jsx`) running on Vite. The name stands for Task and LinkedIn (informal). It was built iteratively in Claude.ai chat and is now being continued in Claude Code.

## Tech Stack

- **Framework:** React 18 (Vite, `npm create vite@latest -- --template react`)
- **Styling:** Inline styles only — no Tailwind, no CSS modules, no styled-components
- **Fonts:** DM Sans + DM Mono (loaded via Google Fonts inline `<style>` tag)
- **Persistence:** localStorage (`talin_tasks`, `talin_roles`)
- **AI Assistant:** OpenRouter API (free tier) — model `stepfun/step-3.5-flash:free`
- **No external UI libraries** — everything is hand-built

## Project Structure

```
taskboard/
├── src/
│   └── App.jsx          ← entire app lives here (single file)
├── .env                 ← VITE_OPENROUTER_KEY=sk-or-...
├── package.json
└── vite.config.js
```

## Running the Project

```bash
npm install
npm run dev              # http://localhost:5173
```

The `.env` file must contain:
```
VITE_OPENROUTER_KEY=sk-or-your-key-here
```

---

## Design System

All design tokens live in the `T` object at the top of `App.jsx`:

```js
const T = {
  bg:       "#0f1117",   // page background
  surface:  "#181c27",   // nav / panel background
  card:     "#1e2333",   // card background
  cardHov:  "#242a3d",   // card hover
  border:   "#2a3045",
  borderHi: "#3d4a6a",
  muted:    "#4a5578",
  dim:      "#6b7aa1",
  text:     "#dce3f5",
  textSoft: "#9ba8c9",
  white:    "#f0f4ff",
  font:     "'DM Sans', sans-serif",
  mono:     "'DM Mono', monospace",
};
```

**Responsive scaling:** `:root { font-size: clamp(10px, 1.05vw, 14px) }` — all spacing and font sizes use `rem` so they scale with viewport width.

**Column accent colours:**
- Weekly → `#4f8ef7` (blue)
- To Do → `#f5a623` (amber)
- Waiting → `#f06292` (pink)
- Complete → `#4caf86` (green)

---

## App Architecture

### Pages (tabs in nav)
1. **Board** — Kanban board
2. **Hiring Manager** — Role pipeline tracker
3. **AI Assistant** — Chat interface powered by OpenRouter

### Key Components

| Component | Purpose |
|---|---|
| `App` | Root — holds `tasks` and `roles` state, nav, localStorage sync |
| `BoardPage` | Kanban board with drag and drop |
| `TaskCard` | Individual task card with chips |
| `ChipRow` | Chip row with ResizeObserver-based font scaling |
| `TaskModal` | Task detail/edit modal |
| `AddModal` | New task modal |
| `HiringPage` | Role list + detail panel |
| `RoleDetail` | Role detail with action points and updates |
| `AiPage` | AI chat interface |
| `Chip` | Reusable badge/tag component |
| `Sel` | Styled select dropdown |
| `Btn` | Styled button |
| `Overlay` | Modal backdrop (fixed position) |

### State Shape

**Task object:**
```js
{
  id: string,
  title: string,
  column: "Weekly" | "To Do" | "Waiting" | "Complete",
  prio: "Low" | "Med" | "High" | "",
  time: "15m" | "30m" | "1h" | "2h" | "4h" | "",
  status: "Me" | "Waiting on Candidate" | "Waiting on Stakeholder",
  dueDate: string,         // ISO date string e.g. "2026-04-15", or ""
  notes: [{id, text, date}],
  actionPoints: [{id, text, done}],
  createdAt: number        // timestamp
}
```

**Role object (Hiring Manager):**
```js
{
  id: string,
  title: string,
  status: "Open" | "Interviewing" | "Offer Out" | "Closed",
  hiringManager: string,
  prio: "Low" | "Med" | "High" | "",
  strategyDoc: string,     // URL or ""
  actionPoints: [{id, text, done}],
  updates: [{id, text, date}]
}
```

---

## Business Logic

### Auto-behaviours
- Tasks moved to **Waiting** column automatically have `time` cleared to `""`
- Tasks with `status` of "Waiting on Candidate" or "Waiting on Stakeholder" auto-route to the **Waiting** column
- **To Do** and **Waiting** columns are auto-sorted: High → Med → Low priority, then by time estimate

### Complete column
- No "+ Add task" button (can't add directly to Complete)
- 🗑 bin icon appears in header when tasks exist — clicking shows a styled confirm modal to clear all

### Drag and drop
- Uses HTML5 drag API with `dragCounters` ref to prevent child element `dragLeave` firing incorrectly
- Captures task reference before clearing ref to avoid null crashes

---

## AI Assistant

- Powered by **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`)
- Current model: `stepfun/step-3.5-flash:free`
- API key from `import.meta.env.VITE_OPENROUTER_KEY`
- Responds in JSON: `{ message: string, actions: [] }`
- Actions can: `add`, `move`, `update`, `delete` tasks on the board
- Has full visibility of both board tasks AND Hiring Manager outstanding action points
- System prompt enforces structured, sectioned responses with emoji headers

**Quick action buttons:** List all tasks | What's waiting? | Add a task | HM action points

---

## What Was Done (completed features)

- [x] Kanban board — Weekly, To Do, Waiting, Complete columns
- [x] Drag and drop between columns
- [x] Task cards with priority, time, status, due date chips
- [x] Task detail modal — edit title, priority, time, status, column, due date, action points, notes
- [x] Add task modal
- [x] Auto-sort To Do and Waiting by priority + time
- [x] Hiring Manager tab — role pipeline with action points and updates
- [x] AI Assistant tab — OpenRouter powered, reads board + HM data
- [x] localStorage persistence (tasks + roles)
- [x] Due dates with colour indicators (Overdue/Today/date)
- [x] ChipRow ResizeObserver scaling — chips always fit on one line
- [x] Complete column — bin to clear, no add button
- [x] Responsive scaling via clamp root font size
- [x] Styled confirm modal (replaced browser `window.confirm`)
- [x] Stats bar in nav (Total / To Do / Waiting / Complete counts)

---

## What's Left To Do (planned next)

- [ ] **Board filtering** — filter by priority and/or status above the columns
- [ ] **UI polish** — column/card sizing, spacing, animations, nav refinements

---

## Known Patterns & Preferences

- Dan builds and tests locally in VS Code, reports errors verbatim
- Prefers clean, minimal dark UI — no excessive decoration
- Single file app — keep everything in `App.jsx`, do not split into multiple files unless asked
- No external component libraries — hand-build everything
- Inline styles only — no CSS files
- When making changes, produce a downloadable updated `App.jsx` file
- Priority labels: `Low`, `Med`, `High` (not "Medium")
- Time labels: `15m`, `30m`, `1h`, `2h`, `4h` (not "15min"/"30min")
