import type { NoteDoc, Role, Task } from './types';
import { uid } from './utils';

type SetTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => void;

function buildSystemPrompt(tasks: Task[], roles: Role[], notes: NoteDoc[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary =
    tasks
      .map((t) => {
        const apDone = (t.actionPoints || []).filter((a) => a.done).length;
        const apTotal = (t.actionPoints || []).length;
        const notesCount = (t.notes || []).length;
        const daysOld = Math.round((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24));
        const dueStr = t.dueDate
          ? (() => {
              const due = new Date(t.dueDate);
              due.setHours(0, 0, 0, 0);
              const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diff < 0) return `OVERDUE by ${Math.abs(diff)}d`;
              if (diff === 0) return 'due TODAY';
              if (diff === 1) return 'due TOMORROW';
              return `due in ${diff}d`;
            })()
          : 'no due date';
        return `- "${t.title}" | Column: ${t.column} | Priority: ${t.prio || 'None'} | Time: ${t.time || 'None'} | Status: ${t.status || 'Me'} | Due: ${dueStr} | Actions: ${apDone}/${apTotal} done | Notes: ${notesCount} | Age: ${daysOld}d | ID: ${t.id}`;
      })
      .join('\n') || 'No tasks yet.';

  const hmSummary =
    (roles || [])
      .map((r) => {
        const open = (r.actionPoints || []).filter((a) => !a.done);
        if (!open.length) return null;
        return `Role: ${r.title} (${r.status}, HM: ${r.hiringManager || 'None'})\n` + open.map((a) => `  - ${a.text}`).join('\n');
      })
      .filter(Boolean)
      .join('\n\n') || 'No outstanding HM action points.';

  const notesSummary =
    (notes || [])
      .map((n) => {
        if (!(n.entries || []).length) return null;
        const entriesText = n.entries
          .map((e) => `  [${new Date(e.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}]\n  ${e.text}`)
          .join('\n\n');
        return `Note: "${n.title}" | Tag: ${n.tag || 'None'}\n${entriesText}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n') || 'No notes yet.';

  return [
    "You are a helpful assistant managing a Kanban task board and hiring pipeline. Always respond in valid JSON: {message:string, actions:[]}",
    "The 'message' field must be friendly, clear, and well-formatted plain text. Never use pipe characters or raw data formats.",
    'FORMATTING RULES:',
    "- GOOD MORNING GREETING: If the user says 'good morning', 'goodmorning', 'morning' or similar, respond with a warm personalised greeting, then structure your response exactly as follows:",
    '  1. A 2-3 sentence summary of where to focus today — mention overdue/today tasks, high priority items, and anything stale.',
    "  2. '📋 Due Today' section — list all To Do tasks with due date TODAY or OVERDUE. If none, say 'Nothing due today in To Do.'",
    "  3. '⏳ Waiting' section — list ALL tasks in the Waiting column grouped by '⏳ Waiting on Candidate' and '⏳ Waiting on Stakeholder'. Show each task with priority.",
    "  4. '👤 HM Action Points' section — list all outstanding HM action points grouped by role. If none, say 'No outstanding HM actions.'",
    "- WEEKLY SUMMARY: If the user asks 'how did my week go', 'weekly summary', 'week review' or similar, respond with a structured weekly review as follows:",
    "  1. '✅ Completed this week' — list all tasks in the Complete column. If none, say 'Nothing completed yet this week.'",
    "  2. '📋 Still in To Do' — list To Do tasks, flagging any that are overdue (Age > 5d) as stale with ⚠️",
    "  3. '⏳ Still Waiting' — list all Waiting tasks with who they're waiting on",
    "  4. '📊 Summary' — one paragraph: X tasks completed, Y carried over, Z waiting. Call out anything that needs attention. Be honest if the week was light or heavy.",
    "- When listing all tasks: group them by column using headers like '📋 To Do', '⏳ Waiting', '📅 Weekly', '✅ Complete'. Under each header list the tasks as a numbered list. e.g: '1. Review Q2 candidates — High priority, 1h'",
    "- When listing waiting tasks: show two sections — '⏳ Waiting on Candidate' and '⏳ Waiting on Stakeholder', each with their tasks listed underneath. If a section is empty, omit it.",
    "- When asked about Hiring Manager action points: group by role using headers like '👤 Senior Engineer', list each outstanding action point underneath as a numbered list. End with a summary e.g. '3 outstanding action points across 2 roles.'",
    '- Always end list responses with a short summary line.',
    '- For simple confirmations (add/move/delete), keep the message to one short sentence.',
    "- Use the Age field to flag tasks that have been in To Do or Waiting for more than 7 days.",
    '- Use the Due field to highlight overdue tasks or tasks due today/tomorrow.',
    '- Use Actions (done/total) to flag tasks with incomplete action points.',
    "NATURAL LANGUAGE TASK CREATION: When the user says something like 'add a task to follow up with Sarah', 'remind me to send the offer letter', 'create a task for X', extract a clean task title and add it. Use context clues for priority (urgent/asap = High, etc). Default column is To Do unless they say waiting/weekly.",
    "- When asked about notes or meetings (e.g. 'what happened in my last weekly meeting', 'what did we discuss in my last 121'), find the most recent relevant entry from ALL NOTES and summarise it clearly with the date.",
    '- When asked about notes, always mention which note title and date the entry is from.',
    'CURRENT BOARD TASKS (use ONLY these):',
    summary,
    'HIRING MANAGER — OUTSTANDING ACTION POINTS (use ONLY these):',
    hmSummary,
    'ALL NOTES (meeting logs, 121s, team syncs etc — use ONLY these):',
    notesSummary,
    'Valid columns: Weekly, To Do, Waiting, Complete',
    'Valid priorities: Low, Med, High | Valid times: 15m, 30m, 1h, 2h, 4h',
    "Due dates are in YYYY-MM-DD format. When mentioning due dates in responses, describe them naturally e.g. 'due 14 Apr' or 'overdue'.",
    'Valid statuses: Me, Waiting on Candidate, Waiting on Stakeholder',
    'Action types: {type:add,task:{title,column,prio,time,status}} | {type:move,id,column} | {type:update,id,fields} | {type:delete,id}',
    'Defaults: column=To Do, prio=Med, time=30m, status=Me. If status is Waiting on Candidate or Waiting on Stakeholder, set column=Waiting.',
    'Only include actions array entries when the user actually wants to change something. For questions or listings, actions should be [].',
  ].join('\n');
}

export async function sendAiMessage(opts: {
  msg: string;
  tasks: Task[];
  roles: Role[];
  notes: NoteDoc[];
  setTasks: SetTasks;
  apiKey: string;
}): Promise<string> {
  const { msg, tasks, roles, notes, setTasks, apiKey } = opts;
  const sys = buildSystemPrompt(tasks, roles, notes);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: sys,
      messages: [{ role: 'user', content: msg }],
    }),
  });
  const data = await res.json();
  const raw = data?.content?.[0]?.text || '';
  if (!raw) throw new Error(data?.error?.message || 'Empty response');

  let result: { message: string; actions: any[] } = { message: raw, actions: [] };
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s > -1 && e > -1) {
      const parsed = JSON.parse(cleaned.slice(s, e + 1));
      if (parsed.message) parsed.message = parsed.message.replace(/\\n/g, '\n');
      result = parsed;
    } else if (s > -1) {
      const msgMatch = cleaned.match(/"message"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\s*}|$)/);
      if (msgMatch) {
        result.message = msgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else {
        result.message = cleaned.replace(/^[^a-zA-Z]+/, '').slice(0, 1000);
      }
    }
  } catch {
    // fall through to raw
  }
  if (!result.message || result.message.trim().startsWith('{')) {
    result.message = 'Sorry, I had trouble formatting that response. Please try again.';
  }

  const actions = Array.isArray(result.actions) ? result.actions : [];
  if (actions.length) {
    setTasks((prev) => {
      let next = [...prev];
      actions.forEach((a) => {
        if (a.type === 'add') {
          const t = Object.assign({ column: 'To Do', prio: 'Med', time: '30m', status: 'Me' }, a.task);
          if (t.status === 'Waiting on Candidate' || t.status === 'Waiting on Stakeholder') t.column = 'Waiting';
          next.push({ id: uid(), notes: [], actionPoints: [], createdAt: Date.now(), ...t });
        } else if (a.type === 'move') {
          next = next.map((x) => (x.id === a.id ? { ...x, column: a.column } : x));
        } else if (a.type === 'update') {
          next = next.map((x) => (x.id === a.id ? { ...x, ...a.fields } : x));
        } else if (a.type === 'delete') {
          next = next.filter((x) => x.id !== a.id);
        }
      });
      return next;
    });
  }

  return result.message || 'Done.';
}
