import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://cxgtrhjtvrkvrmojqvtz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z3RyaGp0dnJrdnJtb2pxdnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTgxOTcsImV4cCI6MjA5MTEzNDE5N30.DMMDWEDYzEMcToT3sSzCQ6eL_VkD2o4UtBGzS4A4zq4";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const DARK = {
  bg:       "#0f1117",
  surface:  "#181c27",
  card:     "#1e2333",
  cardHov:  "#242a3d",
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

const LIGHT = {
  bg:       "#f4f6fb",
  surface:  "#ffffff",
  card:     "#ffffff",
  cardHov:  "#eef1f8",
  border:   "#dde2f0",
  borderHi: "#b8c2dc",
  muted:    "#8a96b8",
  dim:      "#5a6785",
  text:     "#1e2640",
  textSoft: "#4a5578",
  white:    "#1e2640",
  font:     "'DM Sans', sans-serif",
  mono:     "'DM Mono', monospace",
};

let T = DARK;

function getTheme() {
  try { return localStorage.getItem("talin_theme") || "light"; } catch { return "light"; }
}
function setThemeStorage(v) {
  try { localStorage.setItem("talin_theme", v); } catch {}
}

// Initialise T from storage immediately so first render is correct
T = getTheme() === "light" ? LIGHT : DARK;

function useTheme() {
  const [theme, setThemeState] = useState(getTheme);
  T = theme === "light" ? LIGHT : DARK;
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    T = next === "light" ? LIGHT : DARK;
    setThemeState(next);
    setThemeStorage(next);
  }
  return { theme, toggleTheme };
}

function NavIconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:"1.86rem", height:"1.86rem", borderRadius:"0.43rem",
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"none", border:`1px solid ${T.border}`,
      cursor:"pointer", color:T.dim, transition:"all .12s", flexShrink:0,
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.color=T.text;e.currentTarget.style.background=T.card;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;e.currentTarget.style.background="none";}}
    >{children}</button>
  );
}
function ThemeToggle({ theme, toggleTheme, style = {} }) {
  const isDark = theme === "dark";
  return (
    <button onClick={toggleTheme} title="Toggle theme" style={{
      fontSize:"0.72rem", fontWeight:600, lineHeight:1,
      background:"none", border:`1px solid ${T.border}`,
      borderRadius:"0.5rem", padding:"0.29rem 0.65rem",
      cursor:"pointer", color:T.dim, fontFamily:T.mono,
      letterSpacing:"0.06em", textTransform:"uppercase",
      transition:"all .15s", ...style
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.color=T.text;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
    >{isDark ? "Light" : "Dark"}</button>
  );
}

const COL = {
  Weekly:   { accent:"#4f8ef7", light:"rgba(79,142,247,0.12)",  glow:"rgba(79,142,247,0.25)"  },
  "To Do":  { accent:"#f5a623", light:"rgba(245,166,35,0.12)",  glow:"rgba(245,166,35,0.25)"  },
  Waiting:  { accent:"#f06292", light:"rgba(240,98,146,0.12)",  glow:"rgba(240,98,146,0.25)"  },
  Complete: { accent:"#4caf86", light:"rgba(76,175,134,0.12)",  glow:"rgba(76,175,134,0.25)"  },
};

const PRIO = {
  Low:    { color:"#4caf86", bg:"rgba(76,175,134,0.15)"  },
  Med: { color:"#f5a623", bg:"rgba(245,166,35,0.15)"  },
  High:   { color:"#f06292", bg:"rgba(240,98,146,0.15)"  },
};
const TIME_C = { color:"#4f8ef7", bg:"rgba(79,142,247,0.15)" };

const WAIT_STATUS = ["Waiting on Candidate","Waiting on Stakeholder"];
const COLUMNS     = ["Weekly","To Do","Waiting","Complete"];
const TIME_OPTS   = ["15m","30m","1h","2h","4h"];
const STATUS_OPTS = ["Me","Waiting on Candidate","Waiting on Stakeholder"];
const PRIO_OPTS   = ["Low","Med","High"];

function uid() { return Math.random().toString(36).slice(2,9); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
}
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

const PRIO_RANK = { High:0, Med:1, Low:2, "":3 };
const TIME_RANK = { "15m":0, "30m":1, "1h":2, "2h":3, "4h":4, "":5 };
const SORT_COLS = ["To Do","Waiting"];
function sortTasks(tasks, col) {
  if(!SORT_COLS.includes(col)) return tasks;
  return [...tasks].sort((a,b)=>{
    // Due date first — overdue/soonest first, no date goes last
    const aHas = !!a.dueDate, bHas = !!b.dueDate;
    if (aHas && bHas) {
      const dateDiff = new Date(a.dueDate) - new Date(b.dueDate);
      if (dateDiff !== 0) return dateDiff;
    } else if (aHas) return -1;
    else if (bHas) return 1;
    // Then priority
    const pd = (PRIO_RANK[a.prio]??3) - (PRIO_RANK[b.prio]??3);
    if(pd!==0) return pd;
    return (TIME_RANK[a.time]??5) - (TIME_RANK[b.time]??5);
  });
}

function Chip({ label, color, bg, small, sz }) {
  if (!label) return null;
  const fontSize = sz || (small ? 10 : 11);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", flexShrink:0,
      fontSize:fontSize, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase",
      padding: small?"2px 6px":"3px 9px", borderRadius:"0.29rem",
      background:bg, color:color, fontFamily:T.mono,
      border:`1px solid ${color}33`,
    }}>{label}</span>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <label style={{ display:"flex", flexDirection:"column", gap:"0.36rem" }}>
      <span style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono }}>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        background:T.bg, border:`1px solid ${T.border}`, borderRadius:"0.43rem",
        color:T.text, fontSize:"0.93rem", padding:"0.57rem 0.71rem", fontFamily:T.font,
        outline:"none", cursor:"pointer", appearance:"auto",
      }}>
        {options.map(o=><option key={o} value={o} style={{background:T.bg}}>{o||"None"}</option>)}
      </select>
    </label>
  );
}

function Btn({ children, onClick, accent, danger, ghost, small, disabled }) {
  const bg   = danger ? "#f0629222" : accent ? accent : ghost ? "transparent" : T.card;
  const col  = danger ? "#f06292" : accent ? T.bg : T.textSoft;
  const bord = danger ? "#f0629255" : accent ? "transparent" : T.border;
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      background:bg, color:col, border:`1px solid ${bord}`,
      borderRadius:"0.43rem", padding: small?"5px 12px":"8px 18px",
      fontSize: small?12:13, fontWeight:500, fontFamily:T.font,
      cursor: disabled?"not-allowed":"pointer", opacity: disabled?0.4:1,
      transition:"all .15s", whiteSpace:"nowrap",
      ...(accent ? {backgroundImage:`linear-gradient(135deg, ${accent}ee, ${accent}99)`} : {}),
    }}
    onMouseEnter={e=>{if(!disabled) e.currentTarget.style.opacity="0.85";}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}
    >{children}</button>
  );
}

function inputStyle() { return {
  background:T.surface, border:`1px solid ${T.border}`, borderRadius:"0.43rem",
  color:T.text, fontSize:"0.93rem", padding:"0.65rem 0.86rem", fontFamily:T.font,
  outline:"none", width:"100%", boxSizing:"border-box",
  transition:"border-color .15s",
}; }

function Overlay({ onDismiss, children }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(8,10,18,0.82)",
      display:"flex", justifyContent:"center", alignItems:"flex-start",
      padding:"2.86rem 1.43rem 4.29rem",
      backdropFilter:"blur(2px)",
    }} onClick={e=>{ if(e.target===e.currentTarget) onDismiss(); }}>
      {children}
    </div>
  );
}

function TaskModal({ task, onClose, onUpdate, onDelete }) {
  const [title,   setTitle]   = useState(task.title);
  const [prio,    setPrio]    = useState(task.prio||"");
  const [time,    setTime]    = useState(task.time||"");
  const [status,  setStatus]  = useState(task.status||"Me");
  const [column,  setColumn]  = useState(task.column);
  const [dueDate, setDueDate] = useState(task.dueDate||"");
  const [noteText,   setNoteText]   = useState("");
  const [actionText, setActionText] = useState("");
  const [notes,  setNotes]  = useState(task.notes||[]);
  const [actions,setActions]= useState(task.actionPoints||[]);
  const ac = COL[column]?.accent || "#4f8ef7";

  function save() {
    let col = column;
    if (WAIT_STATUS.includes(status) && col==="To Do") col="Waiting";
    if (!WAIT_STATUS.includes(status) && col==="Waiting") col="To Do";
    const finalTime   = col==="Waiting" || col==="Complete" ? "" : time;
    const finalPrio   = col==="Complete" ? "" : prio;
    const finalDue    = col==="Complete" ? "" : dueDate;
    const finalStatus = col==="Complete" ? "Me" : status;
    onUpdate({...task, title, prio:finalPrio, time:finalTime, status:finalStatus, column:col, dueDate:finalDue, notes, actionPoints:actions});
    onClose();
  }
  function addNote() {
    if(!noteText.trim()) return;
    setNotes([{id:uid(),text:noteText,date:Date.now()},...notes]);
    setNoteText("");
  }
  function addAction() {
    if(!actionText.trim()) return;
    setActions([...actions,{id:uid(),text:actionText,done:false}]);
    setActionText("");
  }

  return (
    <Overlay onDismiss={save}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:560,
        background:T.surface, borderRadius:"1rem",
        border:`1px solid ${T.border}`,
        boxShadow:`0 0 0 1px ${ac}22, 0 32px 64px rgba(0,0,0,0.6)`,
        overflow:"hidden", display:"flex", flexDirection:"column",
      }}>
        <div style={{
          padding:"1.43rem 1.71rem 1.14rem",
          borderBottom:`1px solid ${T.border}`,
          background:`linear-gradient(135deg, ${T.card} 0%, ${COL[column]?.light||"transparent"} 100%)`,
        }}>
          <div style={{ display:"flex", gap:"0.86rem", alignItems:"flex-start" }}>
            <div style={{ width:4, borderRadius:"0.29rem", flexShrink:0, alignSelf:"stretch", background:ac, minHeight:"1.71rem" }}/>
            <input value={title} onChange={e=>setTitle(e.target.value)}
              style={{...inputStyle(), background:"transparent", border:"none", borderBottom:`1px solid ${T.border}`,
                borderRadius:0, fontSize:"1.21rem", fontWeight:500, padding:"0 0 8px", flex:1, color:T.white,
              }}
              onFocus={e=>e.target.style.borderBottomColor=ac}
              onBlur={e=>e.target.style.borderBottomColor=T.border}
            />
            <button onClick={save} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:"1.29rem", lineHeight:1, padding:4, flexShrink:0 }}>✕</button>
          </div>
          <div style={{ marginTop:12, display:"flex", gap:"0.57rem", flexWrap:"wrap", paddingLeft:16 }}>
            <span style={{ fontSize:"0.79rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase",
              color:ac, background:COL[column]?.light, border:`1px solid ${ac}44`,
              padding:"3px 10px", borderRadius:"0.29rem", fontFamily:T.mono,
            }}>{column}</span>
            {prio && <Chip label={prio} color={PRIO[prio]?.color} bg={PRIO[prio]?.bg} small />}
            {time && <Chip label={time} color={TIME_C.color} bg={TIME_C.bg} small />}
          </div>
        </div>

        <div style={{ padding:"1.43rem 1.71rem", overflowY:"auto", maxHeight:"58vh", display:"flex", flexDirection:"column", gap:"1.71rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 16px" }}>
            <Sel label="Column"            value={column} onChange={setColumn} options={COLUMNS} />
            <Sel label="Priority"          value={prio}   onChange={setPrio}   options={["", ...PRIO_OPTS]} />
            <Sel label="Time estimate"     value={time}   onChange={setTime}   options={["", ...TIME_OPTS]} />
            <Sel label="Status / Waiting"  value={status} onChange={setStatus} options={STATUS_OPTS} />
            <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <span style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono }}>Due date</span>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                style={{...inputStyle(), cursor:"pointer", colorScheme: "light"}}
                onFocus={e=>e.target.style.borderColor=ac}
                onBlur={e=>e.target.style.borderColor=T.border}/>
            </label>
          </div>

          <div>
            <div style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono, marginBottom:"0.86rem" }}>Action Points</div>
            <div style={{ display:"flex", gap:"0.57rem", marginBottom:"0.71rem" }}>
              <input value={actionText} onChange={e=>setActionText(e.target.value)}
                placeholder="Add action point…" style={{...inputStyle(), flex:1}}
                onFocus={e=>e.target.style.borderColor=ac}
                onBlur={e=>e.target.style.borderColor=T.border}
                onKeyDown={e=>e.key==="Enter"&&addAction()} />
              <Btn onClick={addAction} small>Add</Btn>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.43rem" }}>
              {actions.length===0 && <div style={{ fontSize:"0.86rem", color:T.muted, fontStyle:"italic" }}>No action points yet.</div>}
              {actions.map(a=>(
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:"0.71rem", background: a.done ? T.bg : T.card, border:`1px solid ${a.done ? T.border : T.borderHi}`, borderRadius:"0.5rem", padding:"0.65rem 0.86rem", transition:"all .15s" }}>
                  <input type="checkbox" checked={a.done}
                    onChange={()=>setActions(actions.map(x=>x.id===a.id?{...x,done:!x.done}:x))}
                    style={{ accentColor:ac, cursor:"pointer", width:15, height:15, flexShrink:0 }} />
                  <span style={{ fontSize:"0.93rem", flex:1, color:a.done?T.muted:T.text, textDecoration:a.done?"line-through":"none", transition:"color .15s" }}>{a.text}</span>
                  <button onClick={()=>setActions(actions.filter(x=>x.id!==a.id))}
                    style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:"0.93rem", padding:0, lineHeight:1 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono, marginBottom:"0.86rem" }}>Notes &amp; Updates</div>
            <div style={{ display:"flex", gap:"0.57rem", marginBottom:"0.86rem", alignItems:"flex-start" }}>
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                placeholder="Add a note or update…"
                style={{...inputStyle(), flex:1, minHeight:"5.14rem", resize:"vertical"}}
                onFocus={e=>e.target.style.borderColor=ac}
                onBlur={e=>e.target.style.borderColor=T.border} />
              <Btn onClick={addNote} small>Add</Btn>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.57rem" }}>
              {notes.length===0 && <div style={{ fontSize:"0.86rem", color:T.muted, fontStyle:"italic" }}>No notes yet.</div>}
              {notes.map(n=>(
                <div key={n.id} style={{ background:T.bg, borderRadius:"0.57rem", border:`1px solid ${T.border}`, borderLeft:`3px solid ${ac}`, padding:"0.79rem 1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.43rem" }}>
                    <span style={{ fontSize:"0.72rem", color:T.muted, fontFamily:T.mono }}>{fmtDate(n.date)}</span>
                    <button onClick={()=>setNotes(notes.filter(x=>x.id!==n.id))}
                      style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:"0.86rem", padding:0 }}>✕</button>
                  </div>
                  <div style={{ fontSize:"0.93rem", color:T.textSoft, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem 1.71rem", borderTop:`1px solid ${T.border}`, background:T.bg }}>
          <Btn onClick={()=>{onDelete(task.id);onClose();}} danger small>Delete task</Btn>
          <Btn onClick={save} accent={ac}>Save &amp; close</Btn>
        </div>
      </div>
    </Overlay>
  );
}

function AddModal({ onClose, onAdd, defaultCol }) {
  const [title,  setTitle]  = useState("");
  const [col,    setCol]    = useState(defaultCol||"To Do");
  const [prio,   setPrio]   = useState("Med");
  const [time,   setTime]   = useState("30m");
  const [status, setStatus] = useState("Me");
  const [dueDate,setDueDate]= useState("");
  const ref = useRef();
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(),60); },[]);

  function add() {
    if(!title.trim()) return;
    let c = col;
    if(WAIT_STATUS.includes(status) && c==="To Do") c="Waiting";
    onAdd({id:uid(),title,column:c,prio,time,status,dueDate,notes:[],actionPoints:[],createdAt:Date.now()});
    onClose();
  }

  const ac = COL[col]?.accent||"#4f8ef7";

  return (
    <Overlay onDismiss={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:420, background:T.surface, borderRadius:"1rem", border:`1px solid ${T.border}`, boxShadow:`0 0 0 1px ${ac}22, 0 24px 48px rgba(0,0,0,0.55)`, overflow:"hidden" }}>
        <div style={{ padding:"1.29rem 1.57rem 1.14rem", borderBottom:`1px solid ${T.border}`, background:`linear-gradient(135deg,${T.card},${COL[col]?.light||"transparent"})` }}>
          <div style={{ fontSize:"1.07rem", fontWeight:600, color:T.white }}>New task</div>
        </div>
        <div style={{ padding:"1.29rem 1.57rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="What needs doing?" style={{...inputStyle(), fontSize:"1rem"}}
            onFocus={e=>e.target.style.borderColor=ac}
            onBlur={e=>e.target.style.borderColor=T.border}
            onKeyDown={e=>e.key==="Enter"&&add()} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px" }}>
            <Sel label="Column"        value={col}    onChange={setCol}    options={COLUMNS} />
            <Sel label="Priority"      value={prio}   onChange={setPrio}   options={PRIO_OPTS} />
            <Sel label="Time estimate" value={time}   onChange={setTime}   options={TIME_OPTS} />
            <Sel label="Status"        value={status} onChange={setStatus} options={STATUS_OPTS} />
            <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <span style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono }}>Due date</span>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                style={{...inputStyle(), cursor:"pointer", colorScheme:"light"}}
                onFocus={e=>e.target.style.borderColor=ac}
                onBlur={e=>e.target.style.borderColor=T.border}/>
            </label>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.71rem", padding:"0.86rem 1.57rem 1.29rem", borderTop:`1px solid ${T.border}`, background:T.bg }}>
          <Btn onClick={onClose} ghost small>Cancel</Btn>
          <Btn onClick={add} accent={ac} small>Add task</Btn>
        </div>
      </div>
    </Overlay>
  );
}

function ChipRow({ task, due, done, total }) {
  const containerRef = useRef();
  const [fontSize, setFontSize] = useState(11);

  const chips = [
    task.prio,
    task.time,
    task.status && task.status !== "Me" ? (task.status === "Waiting on Candidate" ? "Candidate" : "Stakeholder") : null,
    due ? due.label : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const containerW = containerRef.current?.offsetWidth || 200;
      // Estimate chip widths at base font size 11px (approx 7px per char + 12px padding)
      const totalChipW = chips.reduce((sum, c) => sum + c.length * 7 + 12, 0) + (chips.length - 1) * 5;
      const counterW = total > 0 ? 28 : 0;
      const available = containerW - counterW;
      if (totalChipW <= available) { setFontSize(11); return; }
      // Scale down proportionally, min 8px
      const scale = available / totalChipW;
      setFontSize(Math.max(8, Math.floor(11 * scale)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [chips.join(","), total]);

  return (
    <div ref={containerRef} style={{ display:"flex", flexWrap:"nowrap", gap:"0.3rem", alignItems:"center", overflow:"hidden" }}>
      {task.prio && <Chip label={task.prio} color={PRIO[task.prio]?.color} bg={PRIO[task.prio]?.bg} small sz={fontSize} />}
      {task.time && <Chip label={task.time} color={TIME_C.color} bg={TIME_C.bg} small sz={fontSize} />}
      {task.status && task.status !== "Me" && (
        <Chip label={task.status === "Waiting on Candidate" ? "Candidate" : "Stakeholder"} color="#c084fc" bg="rgba(192,132,252,0.15)" small sz={fontSize} />
      )}
      {due && <Chip label={due.label} color={due.color} bg={due.bg} small sz={fontSize} />}
      {total > 0 && (
        <span style={{ marginLeft:"auto", fontSize:"0.72rem", color:T.muted, fontFamily:T.mono, letterSpacing:"0.05em", flexShrink:0 }}>{done}/{total}</span>
      )}
    </div>
  );
}

function getDueDateStyle(dueDate) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  due.setHours(0,0,0,0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { color:"#f06292", bg:"rgba(240,98,146,0.15)", label:"Overdue" };
  if (diff === 0) return { color:"#f5a623", bg:"rgba(245,166,35,0.15)", label:"Today" };
  if (diff === 1) return { color:"#f5a623", bg:"rgba(245,166,35,0.12)", label:"Tomorrow" };
  // Get start of this week (Monday)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  const nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
  const nextFriday = new Date(monday); nextFriday.setDate(monday.getDate() + 11);
  if (due >= monday && due <= friday) return { color:"#4f8ef7", bg:"rgba(79,142,247,0.15)", label:"This Week" };
  if (due >= nextMonday && due <= nextFriday) return { color:"#4f8ef7", bg:"rgba(79,142,247,0.10)", label:"Next Week" };
  return null;
}

function TaskCard({ task, onClick }) {
  const ac = COL[task.column]?.accent || "#4f8ef7";
  const done  = (task.actionPoints||[]).filter(a=>a.done).length;
  const total = (task.actionPoints||[]).length;
  const [hov, setHov] = useState(false);
  const due = getDueDateStyle(task.dueDate);

  return (
    <div onClick={()=>onClick(task)}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? T.cardHov : T.card,
        border:`1px solid ${hov ? T.borderHi : T.border}`,
        borderRadius:"0.65rem", padding:"0.86rem 1rem", cursor:"pointer",
        marginBottom:"0.5rem", transition:"all .15s",
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.3)` : "none",
      }}>
      <div style={{ fontSize:"0.93rem", fontWeight:500, color:T.white, lineHeight:1.45, marginBottom:"0.65rem" }}>{task.title}</div>
      <ChipRow task={task} due={due} done={done} total={total} />
    </div>
  );
}

function BoardPage({ tasks, setTasks }) {
  const [selected,    setSelected]    = useState(null);
  const [addingCol,   setAddingCol]   = useState(null);
  const [dragOver,    setDragOver]    = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const dragging = useRef(null);
  const dragCounters = useRef({});

  function upd(t) { setTasks(p=>p.map(x=>x.id===t.id?t:x)); }
  function del(id){ setTasks(p=>p.filter(x=>x.id!==id)); }
  function add(t) { setTasks(p=>[...p,t]); }

  function onDragEnter(col) {
    dragCounters.current[col] = (dragCounters.current[col] || 0) + 1;
    setDragOver(col);
  }
  function onDragLeave(col) {
    dragCounters.current[col] = (dragCounters.current[col] || 1) - 1;
    if (dragCounters.current[col] <= 0) {
      dragCounters.current[col] = 0;
      setDragOver(null);
    }
  }
  function drop(col) {
    const task = dragging.current;
    if(!task) return;
    dragging.current = null;
    dragCounters.current = {};
    setDragOver(null);
    let c = col;
    if(WAIT_STATUS.includes(task.status) && c==="To Do") c="Waiting";
    setTasks(p => p.map(t => t.id===task.id ? {
      ...t,
      column: c,
      time: c==="Waiting" ? "" : t.time,
      prio: c==="Complete" ? "" : t.prio,
      dueDate: c==="Complete" ? "" : t.dueDate,
      status: c==="Complete" ? "Me" : t.status,
    } : t));
  }

  const dragOverTask = useRef(null);

  function dropOnTask(targetTask) {
    const srcTask = dragging.current;
    if (!srcTask || srcTask.id === targetTask.id || srcTask.column !== targetTask.column) return;
    setTasks(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(t => t.id === srcTask.id);
      const toIdx = next.findIndex(t => t.id === targetTask.id);
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", gap:"0.86rem", overflowX:"auto", paddingBottom:12, alignItems:"flex-start" }}>
        {COLUMNS.map(col=>{
          const colTasks = tasks.filter(t=>t.column===col);
          const ac = COL[col].accent;
          const isOver = dragOver===col;
          return (
            <div key={col}
              onDragOver={e=>{e.preventDefault();}}
              onDragEnter={()=>onDragEnter(col)}
              onDrop={()=>drop(col)}
              onDragLeave={()=>onDragLeave(col)}
              onDragEnd={()=>{dragging.current=null;dragCounters.current={};setDragOver(null);}}
              style={{
                flex:"0 0 230px", minWidth:200,
                background: isOver ? COL[col].light : T.surface,
                borderRadius:"0.86rem",
                border:`1px solid ${isOver ? ac : T.border}`,
                padding:"1rem 0.86rem",
                transition:"all .15s",
                boxShadow: isOver ? `0 0 0 1px ${ac}55, inset 0 0 30px ${COL[col].glow}` : "none",
              }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.57rem" }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:ac,display:"inline-block", boxShadow:`0 0 6px ${ac}` }} />
                  <span style={{ fontSize:"0.86rem", fontWeight:600, color:T.white, letterSpacing:"0.03em" }}>{col}</span>
                  <span style={{ fontSize:"0.72rem", fontFamily:T.mono, fontWeight:600, background:COL[col].light, color:ac, border:`1px solid ${ac}44`, borderRadius:"0.29rem", padding:"1px 7px" }}>{colTasks.length}</span>
                </div>
                <div style={{display:"flex",gap:"0.36rem"}}>
                  {col==="Complete" && colTasks.length>0 && (
                    <button onClick={()=>setConfirmClear(true)}
                      style={{ background:"none", border:`1px solid ${T.border}`, color:"#f06292", width:22, height:22, borderRadius:"0.36rem", cursor:"pointer", fontSize:"0.86rem", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="#f06292";e.currentTarget.style.background="rgba(240,98,146,0.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="none";}}
                      title="Clear completed tasks"
                    >🗑</button>
                  )}
                  {col!=="Complete" && (
                    <button onClick={()=>setAddingCol(col)} style={{ background:"none", border:`1px solid ${T.border}`, color:T.dim, width:22, height:22, borderRadius:"0.36rem", cursor:"pointer", fontSize:"1.07rem", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.color=ac;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
                    >+</button>
                  )}
                </div>
              </div>
              {colTasks.map(task=>(
                <div key={task.id} draggable
                  onDragStart={e=>{e.stopPropagation();dragging.current=task;}}
                  onDragEnd={()=>{dragging.current=null;dragOverTask.current=null;}}
                  onDragOver={e=>{e.preventDefault();e.stopPropagation();dragOverTask.current=task;}}
                  onDrop={e=>{e.stopPropagation();dropOnTask(task);}}
                  onClick={e=>{if(dragging.current)e.stopPropagation();}}>
                  <TaskCard task={task} onClick={t=>setSelected({...t})} />
                </div>
              ))}
              {colTasks.length===0 && (
                <div style={{ textAlign:"center", padding:"1.71rem 0 1.14rem", fontSize:"0.86rem", color:T.muted, fontStyle:"italic" }}>Drop tasks here</div>
              )}
              {col!=="Complete" && (
                <button onClick={()=>setAddingCol(col)} style={{ width:"100%", marginTop:6, fontSize:"0.86rem", color:T.muted, background:"none", border:`1px dashed ${T.border}`, borderRadius:"0.5rem", padding:"0.57rem 0", cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=ac;e.currentTarget.style.color=ac;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}
                >+ Add task</button>
              )}
            </div>
          );
        })}
      </div>
      {confirmClear && (
        <Overlay onDismiss={()=>setConfirmClear(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:360,
            background:T.surface, borderRadius:"1rem",
            border:`1px solid ${T.border}`,
            boxShadow:`0 0 0 1px #f0629222, 0 24px 48px rgba(0,0,0,0.55)`,
            overflow:"hidden",
          }}>
            <div style={{padding:"1.43rem 1.57rem 1rem", borderBottom:`1px solid ${T.border}`, background:`linear-gradient(135deg,${T.card},rgba(240,98,146,0.08))`}}>
              <div style={{fontSize:"1rem", fontWeight:600, color:T.white, marginBottom:"0.43rem"}}>Clear completed tasks?</div>
              <div style={{fontSize:"0.86rem", color:T.textSoft}}>
                This will permanently delete all {tasks.filter(t=>t.column==="Complete").length} completed task{tasks.filter(t=>t.column==="Complete").length>1?"s":""}. This cannot be undone.
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:"0.57rem", padding:"1rem 1.57rem", background:T.bg}}>
              <Btn onClick={()=>setConfirmClear(false)} ghost small>Cancel</Btn>
              <Btn onClick={()=>{ setTasks(p=>p.filter(t=>t.column!=="Complete")); setConfirmClear(false); }} danger small>Clear all</Btn>
            </div>
          </div>
        </Overlay>
      )}
      {selected && (
        <TaskModal task={selected}
          onClose={()=>setSelected(null)}
          onUpdate={t=>{upd(t);setSelected(null);}}
          onDelete={id=>{del(id);setSelected(null);}} />
      )}
      {addingCol && (
        <AddModal defaultCol={addingCol}
          onClose={()=>setAddingCol(null)}
          onAdd={t=>{add(t);setAddingCol(null);}} />
      )}
    </div>
  );
}

const AI_MSGS_KEY = "talin_ai_msgs";
const AI_BRIEF_KEY = "talin_last_brief";
const DEFAULT_AI_MSGS = [{role:"assistant", text:"Hi! I can help manage your board.\n\n• Good morning\n• List all tasks\n• What's waiting?\n• HM action points"}];

function AiPage({ tasks, setTasks, roles, notes }) {
  const [msgs, setMsgs] = useState(() => {
    try { const v = localStorage.getItem(AI_MSGS_KEY); return v ? JSON.parse(v) : DEFAULT_AI_MSGS; } catch { return DEFAULT_AI_MSGS; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef();
  const didBrief = useRef(false);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  useEffect(() => { try { localStorage.setItem(AI_MSGS_KEY, JSON.stringify(msgs.slice(-50))); } catch {} }, [msgs]);

  // Auto morning brief — once per day on first open
  useEffect(() => {
    if (didBrief.current || busy || tasks.length === 0) return;
    const today = new Date().toDateString();
    const lastBrief = localStorage.getItem(AI_BRIEF_KEY);
    if (lastBrief === today) return;
    didBrief.current = true;
    localStorage.setItem(AI_BRIEF_KEY, today);
    setTimeout(() => sendMsg("Good morning"), 800);
  }, [tasks.length]);

  async function sendMsg(msg) {
    if (!msg || busy) return;
    setBusy(true);
    setMsgs(p => [...p, {role:"user", text:msg}]);
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const summary = tasks.map(t => {
        const apDone = (t.actionPoints||[]).filter(a=>a.done).length;
        const apTotal = (t.actionPoints||[]).length;
        const notesCount = (t.notes||[]).length;
        const daysOld = Math.round((Date.now() - t.createdAt) / (1000*60*60*24));
        const dueStr = t.dueDate ? (() => {
          const due = new Date(t.dueDate); due.setHours(0,0,0,0);
          const diff = Math.round((due - today) / (1000*60*60*24));
          if (diff < 0) return `OVERDUE by ${Math.abs(diff)}d`;
          if (diff === 0) return "due TODAY";
          if (diff === 1) return "due TOMORROW";
          return `due in ${diff}d`;
        })() : "no due date";
        return `- "${t.title}" | Column: ${t.column} | Priority: ${t.prio||"None"} | Time: ${t.time||"None"} | Status: ${t.status||"Me"} | Due: ${dueStr} | Actions: ${apDone}/${apTotal} done | Notes: ${notesCount} | Age: ${daysOld}d | ID: ${t.id}`;
      }).join("\n") || "No tasks yet.";
      const hmSummary = (roles||[]).map(r => {
        const open = (r.actionPoints||[]).filter(a=>!a.done);
        if (!open.length) return null;
        return `Role: ${r.title} (${r.status}, HM: ${r.hiringManager||"None"})\n` + open.map(a=>`  - ${a.text}`).join("\n");
      }).filter(Boolean).join("\n\n") || "No outstanding HM action points.";
      const notesSummary = (notes||[]).map(n => {
        if (!(n.entries||[]).length) return null;
        const entriesText = n.entries.map(e =>
          `  [${new Date(e.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}]\n  ${e.text}`
        ).join("\n\n");
        return `Note: "${n.title}" | Tag: ${n.tag||"None"}\n${entriesText}`;
      }).filter(Boolean).join("\n\n---\n\n") || "No notes yet.";
      const sys = [
        "You are a helpful assistant managing a Kanban task board and hiring pipeline. Always respond in valid JSON: {message:string, actions:[]}",
        "The 'message' field must be friendly, clear, and well-formatted plain text. Never use pipe characters or raw data formats.",
        "FORMATTING RULES:",
        "- GOOD MORNING GREETING: If the user says 'good morning', 'goodmorning', 'morning' or similar, respond with a warm personalised greeting, then structure your response exactly as follows:",
        "  1. A 2-3 sentence summary of where to focus today — mention overdue/today tasks, high priority items, and anything stale.",
        "  2. '📋 Due Today' section — list all To Do tasks with due date TODAY or OVERDUE. If none, say 'Nothing due today in To Do.'",
        "  3. '⏳ Waiting' section — list ALL tasks in the Waiting column grouped by '⏳ Waiting on Candidate' and '⏳ Waiting on Stakeholder'. Show each task with priority.",
        "  4. '👤 HM Action Points' section — list all outstanding HM action points grouped by role. If none, say 'No outstanding HM actions.'",
        "- When listing all tasks: group them by column using headers like '📋 To Do', '⏳ Waiting', '📅 Weekly', '✅ Complete'. Under each header list the tasks as a numbered list. e.g: '1. Review Q2 candidates — High priority, 1h'",
        "- When listing waiting tasks: show two sections — '⏳ Waiting on Candidate' and '⏳ Waiting on Stakeholder', each with their tasks listed underneath. If a section is empty, omit it.",
        "- When asked about Hiring Manager action points: group by role using headers like '👤 Senior Engineer', list each outstanding action point underneath as a numbered list. End with a summary e.g. '3 outstanding action points across 2 roles.'",
        "- Always end list responses with a short summary line.",
        "- For simple confirmations (add/move/delete), keep the message to one short sentence.",
        "- Use the Age field to flag tasks that have been in To Do or Waiting for more than 7 days.",
        "- Use the Due field to highlight overdue tasks or tasks due today/tomorrow.",
        "- Use Actions (done/total) to flag tasks with incomplete action points.",
        "NATURAL LANGUAGE TASK CREATION: When the user says something like 'add a task to follow up with Sarah', 'remind me to send the offer letter', 'create a task for X', extract a clean task title and add it. Use context clues for priority (urgent/asap = High, etc). Default column is To Do unless they say waiting/weekly.",
        "- When asked about notes or meetings (e.g. 'what happened in my last weekly meeting', 'what did we discuss in my last 121'), find the most recent relevant entry from ALL NOTES and summarise it clearly with the date.",
        "- When asked about notes, always mention which note title and date the entry is from.",
        "CURRENT BOARD TASKS (use ONLY these):",
        summary,
        "HIRING MANAGER — OUTSTANDING ACTION POINTS (use ONLY these):",
        hmSummary,
        "ALL NOTES (meeting logs, 121s, team syncs etc — use ONLY these):",
        notesSummary,
        "Valid columns: Weekly, To Do, Waiting, Complete",
        "Valid priorities: Low, Med, High | Valid times: 15m, 30m, 1h, 2h, 4h",
        "Due dates are in YYYY-MM-DD format. When mentioning due dates in responses, describe them naturally e.g. 'due 14 Apr' or 'overdue'.",
        "Valid statuses: Me, Waiting on Candidate, Waiting on Stakeholder",
        "Action types: {type:add,task:{title,column,prio,time,status}} | {type:move,id,column} | {type:update,id,fields} | {type:delete,id}",
        "Defaults: column=To Do, prio=Med, time=30m, status=Me. If status is Waiting on Candidate or Waiting on Stakeholder, set column=Waiting.",
        "Only include actions array entries when the user actually wants to change something. For questions or listings, actions should be [].",
      ].join("\n");

      const anthropicKey = import.meta.env.VITE_ANTHROPIC_KEY;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: sys,
          messages: [{ role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      const raw = data?.content?.[0]?.text || "";
      if (!raw) throw new Error(data?.error?.message || "Empty response");
      let result = {message: raw, actions:[]};
      try {
        const cleaned = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
        const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
        if (s>-1 && e>-1) {
          const parsed = JSON.parse(cleaned.slice(s, e+1));
          if (parsed.message) parsed.message = parsed.message.replace(/\\n/g, "\n");
          result = parsed;
        } else if (s>-1) {
          const msgMatch = cleaned.match(/"message"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\s*}|$)/);
          if (msgMatch) {
            result.message = msgMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
          } else {
            result.message = cleaned.replace(/^[^a-zA-Z]+/, "").slice(0, 1000);
          }
        }
      } catch(_){}
      if (!result.message || result.message.trim().startsWith("{")) {
        result.message = "Sorry, I had trouble formatting that response. Please try again.";
      }
      const actions = Array.isArray(result.actions) ? result.actions : [];
      if (actions.length) {
        setTasks(prev => {
          let next=[...prev];
          actions.forEach(a => {
            if (a.type==="add") {
              const t=Object.assign({column:"To Do",prio:"Med",time:"30m",status:"Me"},a.task);
              if(t.status==="Waiting on Candidate"||t.status==="Waiting on Stakeholder") t.column="Waiting";
              next.push({id:uid(),notes:[],actionPoints:[],createdAt:Date.now(),...t});
            } else if(a.type==="move") next=next.map(x=>x.id===a.id?{...x,column:a.column}:x);
            else if(a.type==="update") next=next.map(x=>x.id===a.id?{...x,...a.fields}:x);
            else if(a.type==="delete") next=next.filter(x=>x.id!==a.id);
          });
          return next;
        });
      }
      setMsgs(p => [...p, {role:"assistant", text:result.message||"Done."}]);
    } catch(e) {
      console.error("AI error:", e);
      setMsgs(p => [...p, {role:"assistant", text:"⚠️ "+e.message, retry:true, retryMsg:msg}]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
    await sendMsg(msg);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 3.4rem - 2.86rem)",gap:0,maxWidth:"56rem",margin:"0 auto"}}>
      <div style={{display:"flex",flexDirection:"column",gap:"0.57rem",marginBottom:"0.71rem",flex:1,overflowY:"auto"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"84%",
            background:m.role==="user"?"linear-gradient(135deg,#4f8ef7cc,#4f8ef799)":T.card,
            color:T.text,borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
            padding:"0.86rem 1.14rem",fontSize:"0.93rem",lineHeight:1.65,
            border:`1px solid ${m.role==="user"?"#4f8ef733":T.border}`,
            whiteSpace:"pre-wrap",fontFamily:T.font}}>
            {m.text}
            {m.retry && (
              <div style={{marginTop:"0.57rem"}}>
                <button onClick={()=>{ setInput(m.retryMsg); }}
                  style={{fontSize:"0.79rem",padding:"0.29rem 0.71rem",borderRadius:20,background:"rgba(79,142,247,0.15)",border:"1px solid rgba(79,142,247,0.4)",color:"#4f8ef7",cursor:"pointer",fontFamily:T.font}}>
                  ↺ Retry
                </button>
              </div>
            )}
          </div>
        ))}
        {busy&&<div style={{alignSelf:"flex-start",background:T.card,border:`1px solid ${T.borderHi}`,borderRadius:"14px 14px 14px 4px",padding:"0.86rem 1.14rem",display:"flex",alignItems:"center",gap:"0.57rem"}}>
          <span style={{display:"flex",gap:4}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"#4f8ef7",display:"inline-block",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</span>
          <span style={{fontSize:"0.86rem",color:T.dim,fontFamily:T.mono}}>Thinking...</span>
          <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}`}</style>
        </div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.86rem",alignItems:"center"}}>
        {["Good morning","List all tasks","What's waiting?","HM action points"].map(c=>(
          <button key={c} onClick={()=>setInput(c)} style={{fontSize:"0.79rem",padding:"0.36rem 0.86rem",borderRadius:20,background:T.card,border:`1px solid ${T.border}`,color:T.dim,cursor:"pointer",fontFamily:T.font}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f8ef7";e.currentTarget.style.color="#4f8ef7";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
          >{c}</button>
        ))}
        <button onClick={()=>setMsgs(DEFAULT_AI_MSGS)} style={{fontSize:"0.79rem",padding:"0.36rem 0.86rem",borderRadius:20,background:"none",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontFamily:T.font,marginLeft:"auto"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#f06292";e.currentTarget.style.color="#f06292";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}
        >Clear chat</button>
      </div>
      <div style={{display:"flex",gap:"0.71rem"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask me about your tasks..." disabled={busy}
          style={{...inputStyle(),flex:1,fontSize:"0.93rem"}}
          onFocus={e=>e.target.style.borderColor="#4f8ef7"} onBlur={e=>e.target.style.borderColor=T.border}/>
        <Btn onClick={send} accent="#4f8ef7" disabled={busy||!input.trim()}>Send</Btn>
      </div>
    </div>
  );
}

const ROLE_STATUSES = ["Open","Interviewing","Offer Out","Closed"];
const ROLE_STATUS_COLORS = {
  "Open":         { color:"#4f8ef7", bg:"rgba(79,142,247,0.15)"  },
  "Interviewing": { color:"#f5a623", bg:"rgba(245,166,35,0.15)"  },
  "Offer Out":    { color:"#c084fc", bg:"rgba(192,132,252,0.15)" },
  "Closed":       { color:"#4caf86", bg:"rgba(76,175,134,0.15)"  },
};

function openLink(url) {
  try { window.open(url.startsWith("http")?url:"https://"+url,"_blank"); } catch(_){}
}

function RoleDetail({ role, onUpdate, onDelete, onClose }) {
  const [title,       setTitle]       = useState(role.title);
  const [status,      setStatus]      = useState(role.status);
  const [hm,          setHm]          = useState(role.hiringManager);
  const [prio,        setPrio]        = useState(role.prio);
  const [strategyDoc, setStrategyDoc] = useState(role.strategyDoc || "");
  const [editingDoc,  setEditingDoc]  = useState(false);
  const [docInput,    setDocInput]    = useState(role.strategyDoc || "");
  const [actionPoints,setActionPoints]= useState(role.actionPoints || []);
  const [updates,     setUpdates]     = useState(role.updates || []);
  const [newAction,   setNewAction]   = useState("");
  const [newUpdate,   setNewUpdate]   = useState("");

  function save(patch) {
    onUpdate({...role, title, status, hiringManager:hm, prio, strategyDoc, actionPoints, updates, ...patch});
  }
  function blur(patch) { save(patch); }

  function addAction() {
    if (!newAction.trim()) return;
    const next = [...actionPoints, {id:uid(), text:newAction.trim(), done:false}];
    setActionPoints(next); setNewAction(""); save({actionPoints:next});
  }
  function toggleAction(id) {
    const next = actionPoints.map(a => a.id===id ? {...a,done:!a.done} : a);
    setActionPoints(next); save({actionPoints:next});
  }
  function deleteAction(id) {
    const next = actionPoints.filter(a => a.id!==id);
    setActionPoints(next); save({actionPoints:next});
  }
  function addUpdate() {
    if (!newUpdate.trim()) return;
    const next = [{id:uid(), text:newUpdate.trim(), date:Date.now()}, ...updates];
    setUpdates(next); setNewUpdate(""); save({updates:next});
  }
  function saveDoc() {
    setStrategyDoc(docInput); setEditingDoc(false); save({strategyDoc:docInput});
  }

  const sc = ROLE_STATUS_COLORS[status] || {color:"#4f8ef7",bg:"rgba(79,142,247,0.15)"};

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
      <div style={{ padding:"1rem 1.71rem", background:`linear-gradient(135deg,${T.card},${sc.bg})`, borderBottom:`2px solid ${sc.color}`, flexShrink:0 }}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.86rem",marginBottom:"0.86rem"}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>blur({title})}
            style={{fontSize:"1.29rem",fontWeight:600,background:"transparent",border:"none",color:T.white,flex:1,outline:"none",padding:0,fontFamily:T.font}}/>
          <div style={{display:"flex",gap:"0.43rem",flexShrink:0}}>
            <button onClick={()=>onDelete(role.id)} style={{fontSize:"0.86rem",color:"#f06292",background:"transparent",border:"1px solid #f0629244",borderRadius:"0.5rem",padding:"0.36rem 0.86rem",cursor:"pointer",fontFamily:T.font}}>Delete</button>
            <button onClick={onClose} style={{fontSize:"1rem",color:T.muted,background:"transparent",border:`1px solid ${T.border}`,borderRadius:"0.5rem",padding:"0.36rem 0.57rem",cursor:"pointer",lineHeight:1}}>✕</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"0.86rem",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Status</div>
            <select value={status} onChange={e=>{setStatus(e.target.value);blur({status:e.target.value});}}
              style={{fontSize:"0.86rem",background:sc.bg,border:`1px solid ${sc.color}55`,borderRadius:20,color:sc.color,padding:"0.29rem 0.86rem",fontFamily:T.mono,fontWeight:600,cursor:"pointer",outline:"none"}}>
              {ROLE_STATUSES.map(s=><option key={s} value={s} style={{background:T.bg,color:T.text}}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Hiring Manager</div>
            <input value={hm} onChange={e=>setHm(e.target.value)} onBlur={()=>blur({hiringManager:hm})}
              placeholder="Name..." style={{fontSize:"0.93rem",background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,borderRadius:"0.57rem",color:T.white,padding:"0.29rem 0.86rem",fontFamily:T.font,outline:"none",width:"10rem"}}/>
          </div>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Priority</div>
            <select value={prio} onChange={e=>{setPrio(e.target.value);blur({prio:e.target.value});}}
              style={{fontSize:"0.86rem",background:PRIO[prio]?.bg||T.card,border:`1px solid ${PRIO[prio]?.color||T.border}55`,borderRadius:20,color:PRIO[prio]?.color||T.dim,padding:"0.29rem 0.86rem",fontFamily:T.mono,fontWeight:600,cursor:"pointer",outline:"none"}}>
              {["","Low","Med","High"].map(o=><option key={o} value={o} style={{background:T.bg,color:T.text}}>{o||"None"}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Strategy Doc</div>
            <div style={{display:"flex",alignItems:"center",gap:"0.43rem"}}>
              {editingDoc ? (
                <div style={{display:"flex",alignItems:"center",gap:"0.43rem"}}>
                  <input value={docInput} onChange={e=>setDocInput(e.target.value)} autoFocus
                    placeholder="Paste link..." onKeyDown={e=>{if(e.key==="Enter")saveDoc();if(e.key==="Escape")setEditingDoc(false);}}
                    style={{fontSize:"0.86rem",background:"rgba(255,255,255,0.06)",border:`1px solid ${T.borderHi}`,borderRadius:"0.57rem",color:T.white,padding:"0.29rem 0.86rem",fontFamily:T.font,outline:"none",width:"14.3rem"}}/>
                  <button onClick={saveDoc} style={{fontSize:"0.79rem",fontWeight:600,padding:"0.29rem 0.86rem",background:"#185FA5",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:T.font}}>Save</button>
                  <button onClick={()=>setEditingDoc(false)} style={{fontSize:"0.79rem",padding:"4px 10px",background:"none",border:`1px solid ${T.border}`,color:T.dim,borderRadius:"0.5rem",cursor:"pointer",fontFamily:T.font}}>✕</button>
                </div>
              ) : (
                <>
                  {strategyDoc && (
                    <button onClick={()=>openLink(strategyDoc)} style={{fontSize:"0.86rem",fontWeight:600,padding:"4px 14px",background:"rgba(79,142,247,0.15)",border:"1px solid rgba(79,142,247,0.4)",borderRadius:20,color:"#4f8ef7",cursor:"pointer",fontFamily:T.mono,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"0.43rem"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(79,142,247,0.25)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(79,142,247,0.15)"}
                    >📄 Open doc</button>
                  )}
                  <button onClick={()=>{setDocInput(strategyDoc);setEditingDoc(true);}} style={{fontSize:"0.86rem",fontWeight:600,width:26,height:26,background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,borderRadius:20,color:T.dim,cursor:"pointer",fontFamily:T.mono,display:"flex",alignItems:"center",justifyContent:"center"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f8ef7";e.currentTarget.style.color="#4f8ef7";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
                  >{strategyDoc ? "✎" : "+"}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"1.43rem 1.71rem",display:"flex",flexDirection:"column",gap:"1.71rem"}}>
        <div>
          <div style={{fontSize:"0.79rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono,marginBottom:"0.71rem"}}>Action Points</div>
          <div style={{display:"flex",gap:"0.57rem",marginBottom:"0.71rem"}}>
            <input value={newAction} onChange={e=>setNewAction(e.target.value)}
              placeholder="Add action point..." onKeyDown={e=>e.key==="Enter"&&addAction()}
              style={{flex:1,fontSize:"0.93rem",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"0.57rem",color:T.text,padding:"0.57rem 0.86rem",fontFamily:T.font,outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#4f8ef7"} onBlur={e=>e.target.style.borderColor=T.border}/>
            <button onClick={addAction} style={{fontSize:"0.93rem",padding:"0.57rem 1.14rem",background:T.card,border:`1px solid ${T.border}`,color:T.textSoft,borderRadius:"0.57rem",cursor:"pointer",fontFamily:T.font}}>Add</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
            {actionPoints.length===0 && <div style={{fontSize:"0.93rem",color:T.muted,fontStyle:"italic"}}>No action points yet.</div>}
            {actionPoints.map(a=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:"0.71rem",background:a.done?T.bg:T.card,border:`1px solid ${T.border}`,borderRadius:"0.57rem",padding:"0.65rem 0.86rem"}}>
                <input type="checkbox" checked={a.done} onChange={()=>toggleAction(a.id)} style={{accentColor:"#4caf86",cursor:"pointer",width:15,height:15,flexShrink:0}}/>
                <span style={{fontSize:"0.93rem",flex:1,color:a.done?T.muted:T.text,textDecoration:a.done?"line-through":"none"}}>{a.text}</span>
                <button onClick={()=>deleteAction(a.id)} style={{fontSize:"0.86rem",background:"none",border:"none",color:T.muted,cursor:"pointer",padding:0,lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize:"0.79rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono,marginBottom:"0.71rem"}}>Updates</div>
          <div style={{display:"flex",gap:"0.57rem",marginBottom:"0.86rem",alignItems:"flex-start"}}>
            <textarea value={newUpdate} onChange={e=>setNewUpdate(e.target.value)}
              placeholder="Add an update or note..." rows={2}
              style={{flex:1,fontSize:"0.93rem",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"0.57rem",color:T.text,padding:"0.57rem 0.86rem",fontFamily:T.font,outline:"none",resize:"vertical"}}
              onFocus={e=>e.target.style.borderColor="#4f8ef7"} onBlur={e=>e.target.style.borderColor=T.border}/>
            <button onClick={addUpdate} style={{fontSize:"0.93rem",padding:"0.57rem 1.14rem",background:T.card,border:`1px solid ${T.border}`,color:T.textSoft,borderRadius:"0.57rem",cursor:"pointer",fontFamily:T.font,flexShrink:0}}>Add</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.57rem"}}>
            {updates.length===0 && <div style={{fontSize:"0.93rem",color:T.muted,fontStyle:"italic"}}>No updates yet.</div>}
            {updates.map(u=>(
              <div key={u.id} style={{background:T.bg,borderRadius:"0.57rem",border:`1px solid ${T.border}`,borderLeft:`3px solid ${sc.color}`,padding:"0.71rem 1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:"0.79rem",color:T.muted,fontFamily:T.mono}}>{fmtDate(u.date)}</span>
                  <button onClick={()=>{const next=updates.filter(x=>x.id!==u.id);setUpdates(next);save({updates:next});}} style={{fontSize:"0.79rem",background:"none",border:"none",color:T.muted,cursor:"pointer",padding:0}}>✕</button>
                </div>
                <div style={{fontSize:"0.93rem",color:T.textSoft,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{u.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HiringPage({ roles, setRoles }) {
  const [activeId,  setActiveId]  = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [newTitle,  setNewTitle]  = useState("");
  const [sortBy,    setSortBy]    = useState("prio");

  const active = roles.find(r => r.id === activeId) || null;

  function updateRole(updated) { setRoles(p => p.map(r => r.id === updated.id ? updated : r)); }
  function deleteRole(id)       { setRoles(p => p.filter(r => r.id !== id)); if (activeId===id) setActiveId(null); }

  function addRole() {
    if (!newTitle.trim()) return;
    const nr = {id:uid(),title:newTitle.trim(),status:"Open",hiringManager:"",prio:"Med",strategyDoc:"",actionPoints:[],updates:[]};
    setRoles(p => [...p, nr]);
    setActiveId(nr.id);
    setNewTitle(""); setShowAdd(false);
  }

  const PRIO_SORT = { High:0, Med:1, Low:2, "":3 };
  const sortedRoles = [...roles].sort((a,b) => {
    if (sortBy === "hm")   return (a.hiringManager||"").localeCompare(b.hiringManager||"");
    if (sortBy === "job")  return a.title.localeCompare(b.title);
    if (sortBy === "prio") return (PRIO_SORT[a.prio]??3) - (PRIO_SORT[b.prio]??3);
    return 0;
  });

  return (
    <div style={{display:"flex",height:"100%",gap:0}}>
      <div style={{width:"15.7rem",flexShrink:0,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100%",background:T.surface}}>
        <div style={{padding:"0.86rem 1rem",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:"0.79rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono}}>Open Roles</span>
          <div style={{display:"flex",gap:"0.36rem",alignItems:"center"}}>
            <div style={{display:"flex",gap:2,background:T.bg,borderRadius:"0.36rem",border:`1px solid ${T.border}`,padding:2}}>
              {[["hm","HM"],["job","Job"],["prio","Prio"]].map(([val,label])=>(
                <button key={val} onClick={()=>setSortBy(val)} style={{
                  fontSize:"0.65rem", fontWeight:600, fontFamily:T.mono,
                  padding:"2px 7px", borderRadius:"0.25rem", border:"none",
                  cursor:"pointer", transition:"all .15s",
                  background: sortBy===val ? "#4f8ef7" : "transparent",
                  color: sortBy===val ? T.bg : T.muted,
                }}>{label}</button>
              ))}
            </div>
            <button onClick={()=>setShowAdd(v=>!v)} style={{fontSize:"1.14rem",lineHeight:1,background:"none",border:`1px solid ${T.border}`,borderRadius:"0.36rem",color:T.dim,cursor:"pointer",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f8ef7";e.currentTarget.style.color="#4f8ef7";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
            >+</button>
          </div>
        </div>
        {showAdd && (
          <div style={{padding:"0.71rem 1rem",borderBottom:`1px solid ${T.border}`}}>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Role title..."
              autoFocus onKeyDown={e=>{if(e.key==="Enter")addRole();if(e.key==="Escape"){setShowAdd(false);setNewTitle("");}}}
              style={{width:"100%",fontSize:"0.93rem",background:T.bg,border:`1px solid ${T.borderHi}`,borderRadius:"0.43rem",color:T.white,padding:"0.5rem 0.71rem",fontFamily:T.font,boxSizing:"border-box",outline:"none"}}/>
            <div style={{display:"flex",gap:"0.43rem",marginTop:8}}>
              <button onClick={addRole} style={{flex:1,fontSize:"0.86rem",fontWeight:600,padding:"5px 0",background:"#185FA5",color:"#fff",border:"none",borderRadius:"0.43rem",cursor:"pointer",fontFamily:T.font}}>Add</button>
              <button onClick={()=>{setShowAdd(false);setNewTitle("");}} style={{flex:1,fontSize:"0.86rem",padding:"5px 0",background:"none",border:`1px solid ${T.border}`,color:T.dim,borderRadius:"0.43rem",cursor:"pointer",fontFamily:T.font}}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto"}}>
          {sortedRoles.map(role => {
            const sc = ROLE_STATUS_COLORS[role.status] || {color:T.dim};
            const isActive = role.id === activeId;
            return (
              <div key={role.id} onClick={()=>setActiveId(role.id)} style={{ padding:"0.79rem 1rem",cursor:"pointer", background: isActive ? "rgba(79,142,247,0.08)" : "none", borderLeft: isActive ? "2px solid #4f8ef7" : "2px solid transparent", borderBottom:`1px solid ${T.border}`, transition:"all .12s" }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="none"; }}
              >
                <div style={{fontSize:"0.93rem",fontWeight:isActive?500:400,color:isActive?T.white:T.text,marginBottom:"0.29rem",lineHeight:1.3}}>{role.title}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"0.43rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.43rem"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:sc.color,display:"inline-block",flexShrink:0}}/>
                    <span style={{fontSize:"0.79rem",color:T.textSoft}}>{role.hiringManager||"No HM"}</span>
                  </div>
                  {role.prio && <Chip label={role.prio} color={PRIO[role.prio]?.color} bg={PRIO[role.prio]?.bg} small sz={9} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {active ? (
        <RoleDetail key={active.id} role={active} onUpdate={updateRole} onDelete={deleteRole}/>
      ) : (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.86rem"}}>
          <div style={{fontSize:"2.3rem",opacity:0.2}}>◈</div>
          <div style={{fontSize:"0.93rem",color:T.muted}}>Select a role to view details</div>
        </div>
      )}
    </div>
  );
}

const TASKS_KEY = "talin_tasks";
const ROLES_KEY  = "talin_roles";
const NOTES_KEY  = "talin_notes";

const NOTE_TAGS = ["Team Sync","Onboarding","Business Updates","Training","Other"];

const DEFAULT_TASKS = [
  {id:"t1",title:"Review Q2 candidates",       column:"To Do",   prio:"High", time:"1h",  status:"Me",                     notes:[],actionPoints:[],createdAt:Date.now()},
  {id:"t2",title:"Send offer letter to Alex",  column:"Waiting", prio:"High", time:"15m", status:"Waiting on Candidate",   notes:[],actionPoints:[],createdAt:Date.now()},
  {id:"t3",title:"Weekly team sync prep",      column:"Weekly",  prio:"Med",  time:"30m", status:"Me",                     notes:[],actionPoints:[],createdAt:Date.now()},
  {id:"t4",title:"Stakeholder update deck",    column:"Waiting", prio:"Med",  time:"2h",  status:"Waiting on Stakeholder", notes:[],actionPoints:[],createdAt:Date.now()},
  {id:"t5",title:"Post new JD senior engineer",column:"Complete",prio:"Low",  time:"30m", status:"Me",                     notes:[],actionPoints:[],createdAt:Date.now()},
];

const DEFAULT_ROLES = [
  {id:uid(),title:"Senior Engineer",    status:"Interviewing",hiringManager:"Sarah Chen",  prio:"High",strategyDoc:"",actionPoints:[],updates:[]},
  {id:uid(),title:"Product Designer",   status:"Open",        hiringManager:"James Moore", prio:"Med", strategyDoc:"",actionPoints:[],updates:[]},
  {id:uid(),title:"Data Analyst",       status:"Offer Out",   hiringManager:"Sarah Chen",  prio:"High",strategyDoc:"",actionPoints:[],updates:[]},
  {id:uid(),title:"Engineering Manager",status:"Open",        hiringManager:"Alex Rivera", prio:"Low", strategyDoc:"",actionPoints:[],updates:[]},
  {id:uid(),title:"Frontend Developer", status:"Closed",      hiringManager:"James Moore", prio:"Med", strategyDoc:"",actionPoints:[],updates:[]},
];

const DEFAULT_NOTES = [];

const NOTE_TAG_COLORS = {
  "Team Sync":        { color:"#4f8ef7", bg:"rgba(79,142,247,0.15)"  },
  "Onboarding":       { color:"#f5a623", bg:"rgba(245,166,35,0.15)"  },
  "Business Updates": { color:"#c084fc", bg:"rgba(192,132,252,0.15)" },
  "Training":         { color:"#4caf86", bg:"rgba(76,175,134,0.15)"  },
  "Other":            { color:"#6b7aa1", bg:"rgba(107,122,161,0.15)" },
};

function NoteDetail({ note, onUpdate, onDelete, onClose }) {
  const [title,    setTitle]    = useState(note.title);
  const [tag,      setTag]      = useState(note.tag||"");
  const [entries,  setEntries]  = useState(note.entries||[]);
  const [newEntry, setNewEntry] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText,  setEditText]  = useState("");
  const tc = NOTE_TAG_COLORS[tag] || { color:"#6b7aa1", bg:"rgba(107,122,161,0.15)" };

  function save(patch) {
    onUpdate({...note, title, tag, entries, ...patch});
  }

  function addEntry() {
    if (!newEntry.trim()) return;
    const next = [{id:uid(), text:newEntry.trim(), date:Date.now()}, ...entries];
    setEntries(next);
    setNewEntry("");
    save({entries:next});
  }

  function saveEdit(id) {
    const next = entries.map(e => e.id===id ? {...e, text:editText} : e);
    setEntries(next);
    setEditingId(null);
    save({entries:next});
  }

  function deleteEntry(id) {
    const next = entries.filter(e => e.id!==id);
    setEntries(next);
    save({entries:next});
  }

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
      <div style={{ padding:"1rem 1.43rem", background:`linear-gradient(135deg,${T.card},${tc.bg})`, borderBottom:`2px solid ${tc.color}`, flexShrink:0 }}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.86rem",marginBottom:"0.86rem"}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>save({title})}
            style={{fontSize:"1.29rem",fontWeight:600,background:"transparent",border:"none",color:T.white,flex:1,outline:"none",padding:0,fontFamily:T.font}}
            placeholder="Note title..."/>
          <div style={{display:"flex",gap:"0.43rem",flexShrink:0}}>
            <button onClick={()=>onDelete(note.id)} style={{fontSize:"0.86rem",color:"#f06292",background:"transparent",border:"1px solid #f0629244",borderRadius:"0.5rem",padding:"0.36rem 0.86rem",cursor:"pointer",fontFamily:T.font}}>Delete</button>
            <button onClick={onClose} style={{fontSize:"1rem",color:T.muted,background:"transparent",border:`1px solid ${T.border}`,borderRadius:"0.5rem",padding:"0.36rem 0.57rem",cursor:"pointer",lineHeight:1}}>✕</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"0.86rem",alignItems:"center",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Tag</div>
            <select value={tag} onChange={e=>{setTag(e.target.value);save({tag:e.target.value});}}
              style={{fontSize:"0.86rem",background:tc.bg,border:`1px solid ${tc.color}55`,borderRadius:20,color:tc.color,padding:"0.29rem 0.86rem",fontFamily:T.mono,fontWeight:600,cursor:"pointer",outline:"none"}}>
              <option value="" style={{background:T.bg,color:T.text}}>No tag</option>
              {NOTE_TAGS.map(t=><option key={t} value={t} style={{background:T.bg,color:T.text}}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:"0.72rem",color:T.muted,marginBottom:"0.29rem",textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.mono}}>Entries</div>
            <div style={{fontSize:"0.86rem",color:T.textSoft,fontFamily:T.mono}}>{entries.length}</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"1.43rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
        {/* Add new entry */}
        <div>
          <div style={{fontSize:"0.72rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono,marginBottom:"0.57rem"}}>
            New entry — {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
          </div>
          <textarea value={newEntry} onChange={e=>setNewEntry(e.target.value)}
            placeholder="Type your notes for this session..."
            rows={4}
            style={{width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"0.57rem",color:T.text,padding:"0.86rem 1rem",fontFamily:T.font,fontSize:"0.93rem",lineHeight:1.7,outline:"none",resize:"vertical",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#4f8ef7"}
            onBlur={e=>e.target.style.borderColor=T.border}
            onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)addEntry();}}
          />
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:"0.43rem"}}>
            <button onClick={addEntry} style={{fontSize:"0.86rem",fontWeight:600,padding:"0.36rem 1rem",background:"linear-gradient(135deg,#4f8ef7dd,#4f8ef799)",color:T.bg,border:"none",borderRadius:"0.43rem",cursor:"pointer",fontFamily:T.font}}>Save entry</button>
          </div>
        </div>

        {/* Past entries */}
        {entries.length>0 && (
          <div>
            <div style={{fontSize:"0.72rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono,marginBottom:"0.57rem"}}>Past entries</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.86rem"}}>
              {entries.map(entry=>(
                <div key={entry.id} style={{background:T.bg,border:`1px solid ${T.border}`,borderLeft:`3px solid ${tc.color}`,borderRadius:"0.57rem",padding:"0.86rem 1rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
                    <span style={{fontSize:"0.72rem",color:T.muted,fontFamily:T.mono}}>{new Date(entry.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
                    <div style={{display:"flex",gap:"0.43rem"}}>
                      <button onClick={()=>{setEditingId(entry.id);setEditText(entry.text);}} style={{fontSize:"0.72rem",color:T.dim,background:"none",border:"none",cursor:"pointer",padding:0}}>Edit</button>
                      <button onClick={()=>deleteEntry(entry.id)} style={{fontSize:"0.72rem",color:"#f06292",background:"none",border:"none",cursor:"pointer",padding:0}}>Delete</button>
                    </div>
                  </div>
                  {editingId===entry.id ? (
                    <div>
                      <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={4}
                        style={{width:"100%",background:T.card,border:`1px solid ${T.borderHi}`,borderRadius:"0.43rem",color:T.text,padding:"0.57rem 0.71rem",fontFamily:T.font,fontSize:"0.93rem",lineHeight:1.7,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
                      <div style={{display:"flex",gap:"0.43rem",marginTop:"0.43rem",justifyContent:"flex-end"}}>
                        <button onClick={()=>setEditingId(null)} style={{fontSize:"0.79rem",padding:"0.25rem 0.71rem",background:"none",border:`1px solid ${T.border}`,borderRadius:"0.36rem",color:T.dim,cursor:"pointer",fontFamily:T.font}}>Cancel</button>
                        <button onClick={()=>saveEdit(entry.id)} style={{fontSize:"0.79rem",padding:"0.25rem 0.71rem",background:"#4f8ef7",border:"none",borderRadius:"0.36rem",color:T.bg,cursor:"pointer",fontFamily:T.font}}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{fontSize:"0.93rem",color:T.textSoft,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{entry.text}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {entries.length===0 && (
          <div style={{fontSize:"0.86rem",color:T.muted,fontStyle:"italic",textAlign:"center",paddingTop:"1rem"}}>No entries yet — add your first note above</div>
        )}
      </div>
    </div>
  );
}

function MobileApp({ tasks, setTasks, roles, setRoles, notes, setNotes, onSignOut, theme, toggleTheme }) {
  const [page, setPage] = useState("board");
  const [colIdx, setColIdx] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteFilterTag, setNoteFilterTag] = useState("");
  const touchStartX = useRef(null);
  const safeTasks = tasks.filter(Boolean);
  const COLS = ["To Do","Waiting","Weekly","Complete"];
  const activeRole = roles.find(r=>r.id===activeRoleId)||null;
  const activeNote = notes.find(n=>n.id===activeNoteId)||null;
  const activeTask = safeTasks.find(t=>t.id===activeTaskId)||null;

  function updateRole(updated) { setRoles(p=>p.map(r=>r.id===updated.id?updated:r)); }
  function deleteRole(id) { setRoles(p=>p.filter(r=>r.id!==id)); setActiveRoleId(null); }
  function updateNote(updated) { setNotes(p=>p.map(n=>n.id===updated.id?updated:n)); }
  function deleteNote(id) { setNotes(p=>p.filter(n=>n.id!==id)); setActiveNoteId(null); }
  function updateTask(updated) { setTasks(p=>p.map(t=>t.id===updated.id?updated:t)); }
  function deleteTask(id) { setTasks(p=>p.filter(t=>t.id!==id)); setActiveTaskId(null); }

  const PRIO_SORT = {High:0,Med:1,Low:2,"":3};
  const sortedRoles = [...roles].sort((a,b)=>(PRIO_SORT[a.prio]??3)-(PRIO_SORT[b.prio]??3));

  const NAV = [
    {id:"board", label:"Board"},
    {id:"roles", label:"Roles"},
    {id:"notes", label:"Notes"},
    {id:"ai",    label:"AI"},
  ];

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setColIdx(i => Math.min(i+1, COLS.length-1));
    else setColIdx(i => Math.max(i-1, 0));
    touchStartX.current = null;
  }

  const COL_COLORS = {
    "To Do":   {accent:"#f5a623", light:"rgba(245,166,35,0.12)"},
    "Waiting": {accent:"#f06292", light:"rgba(240,98,146,0.12)"},
    "Weekly":  {accent:"#4f8ef7", light:"rgba(79,142,247,0.12)"},
    "Complete":{accent:"#4caf86", light:"rgba(76,175,134,0.12)"},
  };

  const colTasks = sortTasks(safeTasks.filter(t=>t.column===COLS[colIdx]), COLS[colIdx]);

  return (
    <div key={theme} style={{fontFamily:T.font,height:"100vh",background:T.bg,color:T.text,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} select,input,textarea,button{font-size:inherit;font-family:inherit;}`}</style>

      {/* Top bar — brand + nav + add button */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 14px 8px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <svg width="16" height="16" viewBox="0 0 40 40">
                <rect x="4" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7"/>
                <rect x="22" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
                <rect x="4" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
                <rect x="22" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.2"/>
              </svg>
              <span style={{fontSize:14,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>TALIN</span>
            </div>
            <div style={{display:"flex",gap:2}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>{setPage(n.id);setActiveRoleId(null);setActiveNoteId(null);setActiveTaskId(null);}}
                  style={{fontSize:11,fontWeight:page===n.id?600:400,padding:"4px 10px",borderRadius:6,border:page===n.id?"1px solid rgba(79,142,247,0.25)":"1px solid transparent",cursor:"pointer",transition:"all .15s",
                    background:page===n.id?"rgba(79,142,247,0.10)":"none",
                    color:page===n.id?"#4f8ef7":T.dim,
                  }}>{n.label}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {page==="board" && (
              <NavIconBtn onClick={()=>setShowAdd(true)} title="Add task">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </NavIconBtn>
            )}
            <NavIconBtn onClick={toggleTheme} title="Toggle theme">
              {theme==="dark"
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </NavIconBtn>
            <NavIconBtn onClick={onSignOut} title="Sign out">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </NavIconBtn>
          </div>
        </div>
      </div>

      {/* BOARD PAGE */}
      {page==="board" && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px 12px 6px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:6,overflowX:"auto",flexShrink:0}}>
            {COLS.map((col,i)=>{
              const cc = COL_COLORS[col];
              const count = safeTasks.filter(t=>t.column===col).length;
              return (
                <button key={col} onClick={()=>setColIdx(i)} style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:12,border:`1px solid ${i===colIdx?cc.accent+"66":"#2a3045"}`,background:i===colIdx?cc.light:"transparent",color:i===colIdx?cc.accent:"#6b7aa1",whiteSpace:"nowrap",cursor:"pointer",flexShrink:0}}>
                  {col} {count}
                </button>
              );
            })}
          </div>

          <div style={{flex:1,display:"flex",gap:6,padding:"10px 12px",overflow:"hidden"}}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div style={{flex:"0 0 78%",background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:COL_COLORS[COLS[colIdx]].accent}}/>
                <span style={{fontSize:12,fontWeight:600,color:T.white}}>{COLS[colIdx]}</span>
                <span style={{fontSize:10,fontFamily:T.mono,fontWeight:600,padding:"1px 5px",borderRadius:3,background:COL_COLORS[COLS[colIdx]].light,color:COL_COLORS[COLS[colIdx]].accent}}>{colTasks.length}</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:8}}>
                {colTasks.map(task=>{
                  const due = getDueDateStyle(task.dueDate);
                  return (
                    <div key={task.id} onClick={()=>setActiveTaskId(task.id)}
                      style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",marginBottom:6,cursor:"pointer",transition:"background .12s"}}
                      onTouchStart={e=>e.currentTarget.style.background=T.cardHov}
                      onTouchEnd={e=>e.currentTarget.style.background=T.card}
                    >
                      <div style={{fontSize:12,fontWeight:500,color:T.white,marginBottom:5,lineHeight:1.3}}>{task.title}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {task.prio && <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:PRIO[task.prio]?.bg,color:PRIO[task.prio]?.color,textTransform:"uppercase",fontFamily:T.mono}}>{task.prio}</span>}
                        {task.time && <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:"rgba(79,142,247,0.15)",color:"#4f8ef7",textTransform:"uppercase",fontFamily:T.mono}}>{task.time}</span>}
                        {due && <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:due.bg,color:due.color,textTransform:"uppercase",fontFamily:T.mono}}>{due.label}</span>}
                      </div>
                    </div>
                  );
                })}
                {COLS[colIdx]!=="Complete" && (
                  <button onClick={()=>setShowAdd(true)} style={{width:"100%",border:"1px dashed #2a3045",borderRadius:8,padding:10,textAlign:"center",fontSize:11,color:"#4a5578",background:"none",cursor:"pointer",marginTop:2}}>+ Add task</button>
                )}
              </div>
            </div>
            {COLS.filter((_,i)=>i!==colIdx).slice(0,2).map(col=>(
              <div key={col} onClick={()=>setColIdx(COLS.indexOf(col))} style={{flex:"0 0 9%",background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",opacity:0.55,cursor:"pointer"}}>
                <span style={{fontSize:8,fontWeight:700,writingMode:"vertical-rl",color:COL_COLORS[col].accent,letterSpacing:"0.06em",textTransform:"uppercase"}}>{col}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROLES PAGE */}
      {page==="roles" && !activeRoleId && (
        <div style={{flex:1,overflowY:"auto"}}>
          {sortedRoles.map(role=>{
            const sc = ROLE_STATUS_COLORS[role.status]||{color:T.dim};
            return (
              <div key={role.id} onClick={()=>setActiveRoleId(role.id)}
                style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
                onTouchStart={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                onTouchEnd={e=>e.currentTarget.style.background="none"}
              >
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:T.white,marginBottom:4}}>{role.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:sc.color,display:"inline-block"}}/>
                    <span style={{fontSize:12,color:T.textSoft}}>{role.hiringManager||"No HM"}</span>
                    <span style={{fontSize:10,color:T.muted,fontFamily:T.mono}}>{role.status}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {role.prio && <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:3,background:PRIO[role.prio]?.bg,color:PRIO[role.prio]?.color,fontFamily:T.mono,textTransform:"uppercase"}}>{role.prio}</span>}
                  <span style={{fontSize:16,color:"#2a3045"}}>›</span>
                </div>
              </div>
            );
          })}
          <div style={{padding:"12px 16px"}}>
            <button onClick={()=>{const nr={id:uid(),title:"New Role",status:"Open",hiringManager:"",prio:"Med",strategyDoc:"",actionPoints:[],updates:[]};setRoles(p=>[...p,nr]);setActiveRoleId(nr.id);}} style={{width:"100%",border:"1px dashed #2a3045",borderRadius:10,padding:12,textAlign:"center",fontSize:13,color:"#4a5578",background:"none",cursor:"pointer"}}>+ Add role</button>
          </div>
        </div>
      )}
      {page==="roles" && activeRoleId && activeRole && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0,background:T.surface}}>
            <button onClick={()=>setActiveRoleId(null)} style={{fontSize:13,color:"#4f8ef7",background:"none",border:"none",cursor:"pointer",padding:0}}>‹ Roles</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            <RoleDetail key={activeRole.id} role={activeRole} onUpdate={updateRole} onDelete={deleteRole} onClose={()=>setActiveRoleId(null)}/>
          </div>
        </div>
      )}

      {/* NOTES PAGE */}
      {page==="notes" && !activeNoteId && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:T.surface}}>
            <select value={noteFilterTag} onChange={e=>setNoteFilterTag(e.target.value)} style={{fontSize:12,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,color:T.text,padding:"4px 8px",cursor:"pointer",outline:"none"}}>
              <option value="">All tags</option>
              {NOTE_TAGS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={()=>{const n={id:uid(),title:"",tag:"",entries:[],createdAt:Date.now()};setNotes(p=>[n,...p]);setActiveNoteId(n.id);}} style={{fontSize:12,fontWeight:600,padding:"5px 12px",background:"linear-gradient(135deg,#4f8ef7dd,#4f8ef799)",color:T.bg,border:"none",borderRadius:8,cursor:"pointer"}}>+ New</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {notes.filter(n=>(!noteFilterTag||n.tag===noteFilterTag)&&(!noteSearch||n.title.toLowerCase().includes(noteSearch.toLowerCase())||(n.entries||[]).some(e=>e.text.toLowerCase().includes(noteSearch.toLowerCase())))).map(note=>{
              const tc = NOTE_TAG_COLORS[note.tag]||null;
              return (
                <div key={note.id} onClick={()=>setActiveNoteId(note.id)}
                  style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:T.white,marginBottom:4}}>{note.title||"Untitled"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {tc && <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:8,background:tc.bg,color:tc.color,fontFamily:T.mono,textTransform:"uppercase"}}>{note.tag}</span>}
                      <span style={{fontSize:11,color:T.muted,fontFamily:T.mono}}>{(note.entries||[]).length} entries</span>
                    </div>
                  </div>
                  <span style={{fontSize:16,color:"#2a3045"}}>›</span>
                </div>
              );
            })}
            {notes.filter(n=>(!noteFilterTag||n.tag===noteFilterTag)&&(!noteSearch||n.title.toLowerCase().includes(noteSearch.toLowerCase())||(n.entries||[]).some(e=>e.text.toLowerCase().includes(noteSearch.toLowerCase())))).length===0 && (
              <div style={{padding:"2rem",textAlign:"center",fontSize:13,color:T.muted,fontStyle:"italic"}}>No notes yet</div>
            )}
          </div>
        </div>
      )}
      {page==="notes" && activeNoteId && activeNote && (
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",flexShrink:0,background:T.surface}}>
            <button onClick={()=>setActiveNoteId(null)} style={{fontSize:13,color:"#4f8ef7",background:"none",border:"none",cursor:"pointer",padding:0}}>‹ Notes</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            <NoteDetail key={activeNote.id} note={activeNote} onUpdate={updateNote} onDelete={deleteNote} onClose={()=>setActiveNoteId(null)}/>
          </div>
        </div>
      )}

      {/* AI PAGE */}
      {page==="ai" && (
        <div style={{flex:1,minHeight:0,overflowY:"auto",padding:"1rem"}}>
          <AiPage tasks={safeTasks} setTasks={setTasks} roles={roles} notes={notes}/>
        </div>
      )}

      {/* Task detail modal */}
      {activeTask && (
        <TaskModal task={activeTask} onClose={()=>setActiveTaskId(null)}
          onUpdate={t=>{updateTask(t);}}
          onDelete={id=>{deleteTask(id);}}/>
      )}

      {/* Add task modal */}
      {showAdd && (
        <AddModal onClose={()=>setShowAdd(false)} onAdd={t=>{setTasks(p=>[...p,t]);setShowAdd(false);}}/>
      )}
    </div>
  );
}

// ── Supabase helpers ──────────────────────────────────────────────
async function dbLoad(table, userId) {
  const { data } = await sb.from(table).select("id,data").eq("user_id", userId);
  return (data || []).map(r => r.data);
}
async function dbUpsert(table, userId, item) {
  await sb.from(table).upsert({ id: item.id, user_id: userId, data: item, updated_at: new Date().toISOString() });
}
async function dbDelete(table, id) {
  await sb.from(table).delete().eq("id", id);
}

function loadFromStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

// ── Login screen ──────────────────────────────────────────────────
function LoginScreen() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <div style={{fontFamily:T.font,height:"100vh",background:T.bg,color:T.text,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"2rem"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{position:"absolute",top:16,right:16}}>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
        <svg width="32" height="32" viewBox="0 0 40 40">
          <rect x="4" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7"/>
          <rect x="22" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
          <rect x="4" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
          <rect x="22" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.2"/>
        </svg>
        <span style={{fontSize:"2rem",fontWeight:700,color:T.white,letterSpacing:"-0.03em"}}>TALIN</span>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"1rem",padding:"2.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1.5rem",width:320}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"1.1rem",fontWeight:600,color:T.white,marginBottom:"0.5rem"}}>Welcome back</div>
          <div style={{fontSize:"0.875rem",color:T.muted}}>Sign in to access your board</div>
        </div>
        <button onClick={signInWithGoogle} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.75rem",padding:"0.75rem 1.5rem",background:T.card,border:`1px solid ${T.border}`,borderRadius:"0.5rem",cursor:"pointer",fontFamily:T.font,fontSize:"0.93rem",fontWeight:500,color:T.text,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.cardHov;e.currentTarget.style.borderColor=T.borderHi;}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.card;e.currentTarget.style.borderColor=T.border;}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <div style={{fontSize:"0.79rem",color:"#f06292",textAlign:"center"}}>{error}</div>}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  const [page,    setPage]    = useState("board");
  const [showAI,  setShowAI]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [tasks,   setTasksRaw]   = useState([]);
  const [roles,   setRolesRaw]   = useState([]);
  const [notes,   setNotesRaw]   = useState([]);
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [sortBy, setSortBy] = useState("prio");
  const [noteFilterTag, setNoteFilterTag] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const noteDragging = useRef(null);

  const userId = session?.user?.id;

  // Auth listener
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase on login
  useEffect(() => {
    if (!userId) return;
    setDataLoading(true);
    Promise.all([
      dbLoad("tasks", userId),
      dbLoad("roles", userId),
      dbLoad("notes", userId),
    ]).then(([t, r, n]) => {
      // First time login — check for localStorage data to migrate
      if (t.length === 0 && r.length === 0 && n.length === 0) {
        const lsTasks = loadFromStorage(TASKS_KEY, []);
        const lsRoles = loadFromStorage(ROLES_KEY, []);
        const lsNotes = loadFromStorage(NOTES_KEY, []);
        if (lsTasks.length > 0 || lsRoles.length > 0 || lsNotes.length > 0) {
          setMigrating(true);
          Promise.all([
            ...lsTasks.map(item => dbUpsert("tasks", userId, item)),
            ...lsRoles.map(item => dbUpsert("roles", userId, item)),
            ...lsNotes.map(item => dbUpsert("notes", userId, item)),
          ]).then(() => {
            setTasksRaw(lsTasks);
            setRolesRaw(lsRoles);
            setNotesRaw(lsNotes);
            localStorage.removeItem(TASKS_KEY);
            localStorage.removeItem(ROLES_KEY);
            localStorage.removeItem(NOTES_KEY);
            setMigrating(false);
            setDataLoading(false);
          });
          return;
        }
      }
      setTasksRaw(t);
      setRolesRaw(r);
      setNotesRaw(n);
      setDataLoading(false);
    });
  }, [userId]);

  // Realtime subscriptions — live sync across tabs and devices
  useEffect(() => {
    if (!userId) return;

    const handle = (setRaw) => (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      // Only process events for the current user
      if (newRow && newRow.user_id && newRow.user_id !== userId) return;
      if (oldRow && oldRow.user_id && oldRow.user_id !== userId) return;
      setRaw(prev => {
        if (eventType === "INSERT") {
          if (prev.find(r => r.id === newRow.id)) return prev;
          return [...prev, newRow.data];
        }
        if (eventType === "UPDATE") {
          return prev.map(r => r.id === newRow.id ? newRow.data : r);
        }
        if (eventType === "DELETE") {
          return prev.filter(r => r.id !== oldRow.id);
        }
        return prev;
      });
    };

    const channel = sb.channel(`talin-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, handle(setTasksRaw))
      .on("postgres_changes", { event: "*", schema: "public", table: "roles" }, handle(setRolesRaw))
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, handle(setNotesRaw))
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => { sb.removeChannel(channel); };
  }, [userId]);
  function setTasks(updater) {
    setTasksRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (userId) {
        const prevIds = new Set(prev.map(t=>t.id));
        const nextIds = new Set(next.map(t=>t.id));
        next.forEach(t => { if (!prevIds.has(t.id) || JSON.stringify(prev.find(p=>p.id===t.id)) !== JSON.stringify(t)) dbUpsert("tasks", userId, t); });
        prev.forEach(t => { if (!nextIds.has(t.id)) dbDelete("tasks", t.id); });
      }
      return next;
    });
  }
  function setRoles(updater) {
    setRolesRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (userId) {
        const prevIds = new Set(prev.map(r=>r.id));
        const nextIds = new Set(next.map(r=>r.id));
        next.forEach(r => { if (!prevIds.has(r.id) || JSON.stringify(prev.find(p=>p.id===r.id)) !== JSON.stringify(r)) dbUpsert("roles", userId, r); });
        prev.forEach(r => { if (!nextIds.has(r.id)) dbDelete("roles", r.id); });
      }
      return next;
    });
  }
  function setNotes(updater) {
    setNotesRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (userId) {
        const prevIds = new Set(prev.map(n=>n.id));
        const nextIds = new Set(next.map(n=>n.id));
        next.forEach(n => { if (!prevIds.has(n.id) || JSON.stringify(prev.find(p=>p.id===n.id)) !== JSON.stringify(n)) dbUpsert("notes", userId, n); });
        prev.forEach(n => { if (!nextIds.has(n.id)) dbDelete("notes", n.id); });
      }
      return next;
    });
  }

  async function signOut() {
    await sb.auth.signOut();
    setTasksRaw([]); setRolesRaw([]); setNotesRaw([]);
  }

  if (authLoading) return (
    <div style={{height:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:T.muted,fontFamily:T.font,fontSize:"0.93rem"}}>Loading...</div>
    </div>
  );

  if (!session) return <LoginScreen/>;

  if (dataLoading || migrating) return (
    <div style={{height:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:"#4f8ef7",boxShadow:"0 0 8px #4f8ef7",animation:"pulse 1s infinite"}}/>
      <div style={{color:T.muted,fontFamily:T.font,fontSize:"0.93rem"}}>{migrating ? "Migrating your existing data..." : "Loading your board..."}</div>
    </div>
  );

  const safeTasks = tasks.filter(Boolean);
  const stats = [
    {label:"Total",    val:safeTasks.length},
    {label:"To Do",    val:safeTasks.filter(t=>t.column==="To Do").length},
    {label:"Waiting",  val:safeTasks.filter(t=>t.column==="Waiting").length},
    {label:"Complete", val:safeTasks.filter(t=>t.column==="Complete").length},
  ];

  const activeRole = roles.find(r => r.id === activeRoleId) || null;
  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  function updateRole(updated) { setRoles(p => p.map(r => r.id === updated.id ? updated : r)); }
  function deleteRole(id) { setRoles(p => p.filter(r => r.id !== id)); setActiveRoleId(null); }

  function updateNote(updated) { setNotes(p => p.map(n => n.id === updated.id ? updated : n)); }
  function deleteNote(id) { setNotes(p => p.filter(n => n.id !== id)); setActiveNoteId(null); }

  const PRIO_SORT = { High:0, Med:1, Low:2, "":3 };
  const sortedRoles = [...roles].sort((a,b) => {
    if (sortBy === "hm") return (a.hiringManager||"").localeCompare(b.hiringManager||"");
    return (PRIO_SORT[a.prio]??3) - (PRIO_SORT[b.prio]??3);
  });

  if (isMobile) {
    return <MobileApp tasks={tasks} setTasks={setTasks} roles={roles} setRoles={setRoles} notes={notes} setNotes={setNotes} onSignOut={signOut} theme={theme} toggleTheme={toggleTheme}/>;
  }

  return (
    <div key={theme} style={{ fontFamily:T.font, height:"100vh", background:T.bg, color:T.text, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } :root { font-size: clamp(10px, 1.05vw, 14px); } select, input, textarea, button { font-size: inherit; }`}</style>

      {/* Nav */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 1.4rem", height:"3.2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.43rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 40 40">
              <rect x="4" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7"/>
              <rect x="22" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
              <rect x="4" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
              <rect x="22" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.2"/>
            </svg>
            <span style={{ fontSize:"0.93rem", fontWeight:700, color:T.white, letterSpacing:"-0.02em" }}>TALIN</span>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            <button onClick={()=>{setShowAI(false);}} style={{ fontSize:"0.79rem", fontWeight: !showAI?600:400, color: !showAI?"#4f8ef7":T.dim, background: !showAI?"rgba(79,142,247,0.10)":"none", border: !showAI?"1px solid rgba(79,142,247,0.25)":"1px solid transparent", borderRadius:"0.43rem", padding:"0.29rem 0.86rem", cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}>Board</button>
            <button onClick={()=>{setShowAI(v=>!v);setActiveRoleId(null);setActiveNoteId(null);}} style={{ fontSize:"0.79rem", fontWeight: showAI?600:400, color: showAI?"#4f8ef7":T.dim, background: showAI?"rgba(79,142,247,0.10)":"none", border: showAI?"1px solid rgba(79,142,247,0.25)":"1px solid transparent", borderRadius:"0.43rem", padding:"0.29rem 0.86rem", cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}>AI Assistant</button>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.43rem" }}>
          <NavIconBtn onClick={()=>setShowAdd(true)} title="Add task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </NavIconBtn>
          <NavIconBtn onClick={toggleTheme} title={theme==="dark"?"Switch to light":"Switch to dark"}>
            {theme==="dark"
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </NavIconBtn>
          <NavIconBtn onClick={signOut} title="Sign out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </NavIconBtn>
        </div>
      </div>

      {/* Main content — always board */}
      <div style={{ flex:1, minHeight:0, display:"flex", overflow:"hidden" }}>

          {/* Role sidebar */}
          <div style={{ width:"16rem", flexShrink:0, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column" }}>

            {/* All Notes link */}
            <div style={{ borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <div onClick={()=>{setActiveNoteId("__list__");setActiveRoleId(null);}}
                style={{ padding:"0.65rem 0.86rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between",
                  background: activeNoteId ? "rgba(79,142,247,0.08)" : "none",
                  borderLeft: activeNoteId ? "2px solid #4f8ef7" : "2px solid transparent",
                  transition:"all .12s" }}
                onMouseEnter={e=>{ if(!activeNoteId) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                onMouseLeave={e=>{ if(!activeNoteId) e.currentTarget.style.background="none"; }}
              >
                <span style={{ fontSize:"0.65rem", fontWeight:600, color: activeNoteId ? "#4f8ef7" : T.dim, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:T.mono }}>All Notes</span>
                <span style={{ fontSize:"0.65rem", color:T.muted, fontFamily:T.mono }}>{notes.length}</span>
              </div>
            </div>

            {/* Roles section */}
            <div style={{ padding:"0.65rem 0.86rem", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontSize:"0.65rem", fontWeight:600, color:T.dim, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:T.mono }}>Roles</span>
              <div style={{display:"flex",gap:2,background:T.bg,borderRadius:"0.29rem",border:`1px solid ${T.border}`,padding:2}}>
                {[["prio","Prio"],["hm","HM"]].map(([val,label])=>(
                  <button key={val} onClick={()=>setSortBy(val)} style={{ fontSize:"0.57rem", fontWeight:600, fontFamily:T.mono, padding:"2px 6px", borderRadius:"0.2rem", border:"none", cursor:"pointer", transition:"all .15s", background: sortBy===val ? "#4f8ef7" : "transparent", color: sortBy===val ? T.bg : T.muted }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {sortedRoles.map(role => {
                const sc = ROLE_STATUS_COLORS[role.status] || {color:T.dim};
                const isActive = role.id === activeRoleId;
                return (
                  <div key={role.id} onClick={()=>setActiveRoleId(isActive ? null : role.id)}
                    style={{ padding:"0.65rem 0.86rem", borderBottom:`1px solid ${T.border}`, cursor:"pointer", borderLeft: isActive?"2px solid #4f8ef7":"2px solid transparent", background: isActive?"rgba(79,142,247,0.08)":"none", transition:"all .12s" }}
                    onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="none"; }}
                  >
                    <div style={{ fontSize:"0.86rem", fontWeight: isActive?500:400, color: isActive?T.white:T.text, marginBottom:"0.22rem", lineHeight:1.3 }}>{role.title}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.36rem" }}>
                        <span style={{ width:5,height:5,borderRadius:"50%",background:sc.color,display:"inline-block",flexShrink:0 }}/>
                        <span style={{ fontSize:"0.72rem", color:T.textSoft }}>{role.hiringManager||"No HM"}</span>
                      </div>
                      {role.prio && <Chip label={role.prio} color={PRIO[role.prio]?.color} bg={PRIO[role.prio]?.bg} small sz={8} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:"0.65rem 0.86rem", borderTop:`1px solid ${T.border}` }}>
              <button onClick={()=>{
                const nr = {id:uid(),title:"New Role",status:"Open",hiringManager:"",prio:"Med",strategyDoc:"",actionPoints:[],updates:[]};
                setRoles(p=>[...p,nr]);
                setActiveRoleId(nr.id);
              }} style={{ width:"100%", fontSize:"0.79rem", color:T.muted, background:"none", border:`1px dashed ${T.border}`, borderRadius:"0.43rem", padding:"0.5rem 0", cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f8ef7";e.currentTarget.style.color="#4f8ef7";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}
              >+ Add role</button>
            </div>
          </div>

          {/* Board area with slide-over */}
          <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
            <div style={{ height:"100%", overflowY:"auto", padding:"1.43rem", display:"flex", justifyContent:"center" }}>
              <div style={{ width:"100%", maxWidth:"72rem" }}>
                <BoardPage tasks={safeTasks} setTasks={setTasks}/>
              </div>
            </div>

            {/* Slide-over overlay */}
            {(activeRole || activeNoteId) && (
              <div style={{ position:"absolute", inset:0, background:"rgba(8,10,18,0.65)", zIndex:100, display:"flex", justifyContent:"flex-end" }}
                onClick={()=>{setActiveRoleId(null);setActiveNoteId(null);}}>
                <div onClick={e=>e.stopPropagation()} style={{ width:"60%", height:"100%", background:T.surface, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                  {activeRole && <RoleDetail key={activeRole.id} role={activeRole} onUpdate={updateRole} onDelete={deleteRole} onClose={()=>setActiveRoleId(null)}/>}
                  {activeNoteId && activeNoteId!=="__list__" && activeNote && (
                    <NoteDetail key={activeNote.id} note={activeNote} onUpdate={updateNote} onDelete={deleteNote} onClose={()=>setActiveNoteId("__list__")}/>
                  )}
                  {activeNoteId==="__list__" && (
                    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
                      <div style={{padding:"1rem 1.43rem",borderBottom:`1px solid ${T.border}`,background:T.card,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:"1.07rem",fontWeight:600,color:T.white}}>All Notes</span>
                        <div style={{display:"flex",gap:"0.57rem",alignItems:"center"}}>
                          <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search notes..." style={{fontSize:"0.79rem",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"0.36rem",color:T.text,padding:"0.29rem 0.57rem",fontFamily:T.font,outline:"none",width:"10rem"}} onFocus={e=>e.target.style.borderColor="#4f8ef7"} onBlur={e=>e.target.style.borderColor=T.border}/>
                          <select value={noteFilterTag} onChange={e=>setNoteFilterTag(e.target.value)} style={{fontSize:"0.79rem",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"0.36rem",color:T.text,padding:"0.29rem 0.57rem",fontFamily:T.font,cursor:"pointer",outline:"none"}}>
                            <option value="">All tags</option>
                            {NOTE_TAGS.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                          <button onClick={()=>{
                            const n={id:uid(),title:"",tag:"",content:"",entries:[],createdAt:Date.now()};
                            setNotes(p=>[n,...p]);
                            setActiveNoteId(n.id);
                          }} style={{fontSize:"0.86rem",fontWeight:600,padding:"0.29rem 0.86rem",background:"linear-gradient(135deg,#4f8ef7dd,#4f8ef799)",color:T.bg,border:"none",borderRadius:"0.36rem",cursor:"pointer",fontFamily:T.font}}>+ New note</button>
                          <button onClick={()=>setActiveNoteId(null)} style={{fontSize:"1rem",color:T.muted,background:"transparent",border:`1px solid ${T.border}`,borderRadius:"0.5rem",padding:"0.29rem 0.5rem",cursor:"pointer",lineHeight:1}}>✕</button>
                        </div>
                      </div>
                      <div style={{flex:1,overflowY:"auto"}}>
                        <div style={{display:"grid",gridTemplateColumns:"0.3fr 1fr 0.4fr 0.5fr",padding:"0.57rem 1.43rem",borderBottom:`1px solid ${T.border}`,background:T.bg,userSelect:"none"}}>
                          <span/>
                          <span style={{fontSize:"0.72rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono}}>Title</span>
                          <span onClick={()=>setNoteSort(s=>s==="tag"?"manual":"tag")} style={{fontSize:"0.72rem",fontWeight:600,color:noteSort==="tag"?"#4f8ef7":T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                            Tag {noteSort==="tag" ? "↑" : ""}
                          </span>
                          <span style={{fontSize:"0.72rem",fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:T.mono}}>Date</span>
                        </div>
                        {notes.filter(n=>(!noteFilterTag||n.tag===noteFilterTag)&&(!noteSearch||n.title.toLowerCase().includes(noteSearch.toLowerCase())||(n.entries||[]).some(e=>e.text.toLowerCase().includes(noteSearch.toLowerCase())))).length===0 && (
                          <div style={{padding:"2rem 1.43rem",fontSize:"0.93rem",color:T.muted,fontStyle:"italic",textAlign:"center"}}>No notes yet — click "+ New note" to get started</div>
                        )}
                        {(noteSort==="tag"
                          ? [...notes].sort((a,b)=>(a.tag||"").localeCompare(b.tag||""))
                          : notes
                        ).filter(n=>!noteFilterTag||n.tag===noteFilterTag).map((note)=>{
                          const tc = NOTE_TAG_COLORS[note.tag] || null;
                          return (
                            <div key={note.id}
                              draggable={noteSort==="manual"}
                              onDragStart={()=>{ noteDragging.current=note.id; }}
                              onDragOver={e=>{ e.preventDefault(); }}
                              onDrop={()=>{
                                if (!noteDragging.current || noteDragging.current===note.id) return;
                                setNotes(prev => {
                                  const next = [...prev];
                                  const fromIdx = next.findIndex(n=>n.id===noteDragging.current);
                                  const toIdx   = next.findIndex(n=>n.id===note.id);
                                  const [item] = next.splice(fromIdx,1);
                                  next.splice(toIdx,0,item);
                                  return next;
                                });
                                noteDragging.current=null;
                              }}
                              onClick={()=>setActiveNoteId(note.id)}
                              style={{display:"grid",gridTemplateColumns:"0.3fr 1fr 0.4fr 0.5fr",padding:"0.79rem 1.43rem",borderBottom:`1px solid ${T.border}`,cursor:"pointer",transition:"background .12s",alignItems:"center"}}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                              onMouseLeave={e=>e.currentTarget.style.background="none"}
                            >
                              {noteSort==="manual"
                                ? <span style={{color:T.muted,fontSize:"0.86rem",cursor:"grab",textAlign:"center"}}>⠿</span>
                                : <span/>
                              }
                              <span style={{fontSize:"0.93rem",color:T.text,fontWeight:500}}>{note.title||"Untitled"}</span>
                              <span>{tc ? <span style={{fontSize:"0.72rem",fontWeight:600,padding:"2px 8px",borderRadius:10,background:tc.bg,color:tc.color,fontFamily:T.mono,textTransform:"uppercase",letterSpacing:"0.03em"}}>{note.tag}</span> : <span style={{fontSize:"0.79rem",color:T.muted}}>—</span>}</span>
                              <span style={{fontSize:"0.79rem",color:T.muted,fontFamily:T.mono}}>{new Date(note.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showAdd && (
              <AddModal onClose={()=>setShowAdd(false)} onAdd={t=>{setTasks(p=>[...p,t]);setShowAdd(false);}}/>
            )}

            {/* AI Assistant slide-over */}
            {showAI && (
              <div style={{ position:"absolute", inset:0, background:"rgba(30,38,64,0.18)", zIndex:100, display:"flex", justifyContent:"flex-end" }}
                onClick={()=>setShowAI(false)}>
                <div onClick={e=>e.stopPropagation()} style={{ width:"60%", height:"100%", background:T.surface, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                  {/* AI panel header */}
                  <div style={{ padding:"0.86rem 1.14rem", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <svg width="16" height="16" viewBox="0 0 40 40">
                        <rect x="4" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7"/>
                        <rect x="22" y="4" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
                        <rect x="4" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.45"/>
                        <rect x="22" y="22" width="14" height="14" rx="2.5" fill="#4f8ef7" opacity="0.2"/>
                      </svg>
                      <span style={{ fontSize:"0.93rem", fontWeight:600, color:T.white }}>AI Assistant</span>
                    </div>
                    <button onClick={()=>setShowAI(false)} style={{ fontSize:"1rem", color:T.muted, background:"transparent", border:`1px solid ${T.border}`, borderRadius:"0.43rem", padding:"0.22rem 0.5rem", cursor:"pointer", lineHeight:1 }}>✕</button>
                  </div>
                  {/* AI content */}
                  <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column" }}>
                    <AiPage tasks={safeTasks} setTasks={setTasks} roles={roles} notes={notes}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}