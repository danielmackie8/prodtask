# AI Assistant — Implementation Notes

## Overview

The AI Assistant is a chat interface that allows natural language interaction with the board. It lives in `AiPage` component and is accessible via the "AI Assistant" tab in the nav.

## API Setup

**Provider:** OpenRouter (free tier)
**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
**Model:** `stepfun/step-3.5-flash:free`
**Key:** `import.meta.env.VITE_OPENROUTER_KEY` (from `.env` file)

```js
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${orKey}`
  },
  body: JSON.stringify({
    model: "stepfun/step-3.5-flash:free",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: msg }
    ],
    max_tokens: 1024,
  }),
});
const data = await res.json();
const raw = data?.choices?.[0]?.message?.content || "";
```

## Response Format

The model is instructed to always respond with valid JSON:

```json
{
  "message": "Human-readable response text",
  "actions": []
}
```

### Action types

```js
{ type: "add",    task: { title, column, prio, time, status } }
{ type: "move",   id, column }
{ type: "update", id, fields }
{ type: "delete", id }
```

## Data Passed to AI

The AI receives two data summaries in the system prompt:

1. **Board tasks** — all current tasks with id, title, column, priority, time, status
2. **HM action points** — outstanding (unchecked) action points from Hiring Manager tab, grouped by role

## Response Parsing

The raw response is cleaned of markdown fences then parsed:

```js
const cleaned = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
if (s>-1 && e>-1) {
  const parsed = JSON.parse(cleaned.slice(s, e+1));
  if (parsed.message) parsed.message = parsed.message.replace(/\\n/g, "\n");
  result = parsed;
}
// Fallback if message looks like raw JSON
if (result.message.trim().startsWith("{")) {
  result.message = "Sorry, I had trouble formatting that response. Please try again.";
}
```

## Formatting Rules in System Prompt

- List all tasks → group by column with emoji headers (📋 To Do, ⏳ Waiting, 📅 Weekly, ✅ Complete)
- Waiting tasks → two sections: ⏳ Waiting on Candidate / ⏳ Waiting on Stakeholder
- HM action points → group by role with 👤 Role Name headers
- End list responses with a summary line
- Simple confirmations → one short sentence

## Switching Models

If the current free model stops working, check available free models at:
`https://openrouter.ai/models` — filter by Free

Update the model string in `AiPage`:
```js
model: "stepfun/step-3.5-flash:free",  // ← change this
```
