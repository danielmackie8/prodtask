import crypto from "node:crypto";

// Not secret — the same project URL already shipped in src/App.jsx.
const SUPABASE_URL = "https://cxgtrhjtvrkvrmojqvtz.supabase.co";

const DURATION_MINUTES = { "15m": 15, "30m": 30, "1h": 60, "2h": 120, "4h": 240 };

function singleParam(v) {
  return Array.isArray(v) ? v[0] : v;
}

// Hash both sides to a fixed-length digest first so timingSafeEqual never
// throws on a length mismatch, and the comparison stays constant-time
// regardless of how long the supplied token is.
function tokensMatch(provided, expected) {
  const a = crypto.createHash("sha256").update(String(provided)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

// Titles follow "<Candidate> - <action>" (e.g. "Troy - Internal, book finals
// and RFC review"); there's no dedicated candidate field, so this is a
// best-effort split on the first " - " / " – " and null when it doesn't match.
function deriveCandidate(title) {
  if (!title) return null;
  const m = String(title).match(/^(.+?)\s[-–]\s(.+)$/);
  return m ? m[1].trim() : null;
}

function todayInLondon() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

function mapTask(row) {
  const t = row.data || {};
  return {
    id: t.id ?? row.id,
    title: t.title ?? null,
    candidate: deriveCandidate(t.title),
    priority: t.prio || null,
    status: t.column || null, // board column (Weekly/To Do/Waiting/Complete) — the lifecycle state
    dueDate: t.dueDate || null,
    durationMinutes: DURATION_MINUTES[t.time] ?? null,
    notes: Array.isArray(t.notes) ? t.notes.map(n => n && n.text).filter(Boolean) : [],
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const expectedToken = process.env.TASKS_TOKEN;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.TASKS_USER_ID;

  if (!expectedToken || !serviceKey || !userId) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const token = singleParam(req.query.token) || "";
  if (!token || !tokensMatch(token, expectedToken)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let rows;
  try {
    const url = `${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${encodeURIComponent(userId)}&select=id,data`;
    const r = await fetch(url, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!r.ok) throw new Error(`Supabase responded ${r.status}`);
    rows = await r.json();
  } catch (err) {
    console.error("GET /api/tasks: failed to load tasks —", err.message);
    res.status(502).json({ error: "Failed to load tasks" });
    return;
  }

  let tasks = rows.map(mapTask);

  const due = singleParam(req.query.due);
  if (due === "today") {
    const today = todayInLondon();
    tasks = tasks.filter(t => t.dueDate === today);
  }

  tasks.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  res.status(200).json(tasks);
}
