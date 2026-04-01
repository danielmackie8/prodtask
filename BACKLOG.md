# TALIN — Feature Backlog & Notes

## Immediate Next (picked up from Claude.ai chat)

### 1. Board Filtering
Filter tasks on the Kanban board by priority and/or status.

**Plan:**
- Add a filter bar above the board columns (below the nav)
- Filter options: Priority (All / Low / Med / High) and Status (All / Me / Waiting on Candidate / Waiting on Stakeholder)
- Non-matching cards should be hidden (not just dimmed) for clarity
- Active filters should be visually indicated
- Keep it compact — small pill/toggle style buttons, not a big form

### 2. UI Polish
Areas identified for improvement:
- Column and card sizing
- Fonts and spacing consistency
- Animations / transitions
- Nav bar refinements

---

## Future Ideas (not yet scoped)

- **Due date filtering** — show only tasks due this week / overdue
- **Search** — filter tasks by title text
- **Bulk actions** — select multiple tasks and move/delete
- **Export** — download board as CSV or PDF
- **Notifications** — highlight overdue tasks more prominently
- **Weekly column logic** — auto-populate from recurring templates
- **HM tab filtering** — filter roles by status or hiring manager
- **Keyboard shortcuts** — e.g. `N` to add task, `Esc` to close modal
- **Collapse columns** — minimise a column to save space
- **Task comments** — threaded notes vs flat notes

---

## Decisions Made & Rationale

| Decision | Rationale |
|---|---|
| Single `App.jsx` file | Simplicity, easy to download and paste into VS Code |
| Inline styles only | No build-time CSS dependencies, easier to iterate |
| OpenRouter (free) for AI | Gemini free tier not available in UK; Anthropic API requires billing |
| `stepfun/step-3.5-flash:free` model | Most usage on OpenRouter free tier at time of setup |
| `clamp(10px, 1.05vw, 14px)` root font | Fluid scaling without media queries |
| ResizeObserver for chip scaling | Accurate pixel-level measurement vs guessing from chip count |
| localStorage for persistence | No backend needed for personal use |
| Roles state lifted to App | Required to share with AiPage for HM action point queries |

---

## Bugs Fixed in This Session

- Drag and drop blanking page — fixed by capturing task ref before clearing, adding null guard on safeTasks
- `borderLeft` + `border` conflict on task cards causing layout shift on hover — removed borderLeft entirely
- AI returning raw JSON — improved system prompt, added JSON fallback parser
- Gemini rate limit / region restriction — switched to OpenRouter
- `window.confirm` for clear complete — replaced with styled modal
- `dragLeave` firing on child elements — fixed with `dragCounters` ref pattern
