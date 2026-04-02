import { useState, useRef, useEffect } from "react";

const T = {
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

const PRIO_RANK = { High:0, Med:1, Low:2, "":3 };
const TIME_RANK = { "15m":0, "30m":1, "1h":2, "2h":3, "4h":4, "":5 };
const SORT_COLS = ["To Do","Waiting"];
function sortTasks(tasks, col) {
  if(!SORT_COLS.includes(col)) return tasks;
  return [...tasks].sort((a,b)=>{
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

const inputStyle = {
  background:T.bg, border:`1px solid ${T.border}`, borderRadius:"0.43rem",
  color:T.text, fontSize:"0.93rem", padding:"0.65rem 0.86rem", fontFamily:T.font,
  outline:"none", width:"100%", boxSizing:"border-box",
  transition:"border-color .15s",
};

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
    const finalTime = col==="Waiting" ? "" : time;
    onUpdate({...task, title, prio, time:finalTime, status, column:col, dueDate, notes, actionPoints:actions});
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
              style={{...inputStyle, background:"transparent", border:"none", borderBottom:`1px solid ${T.border}`,
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
                style={{...inputStyle, colorScheme:"dark"}}
                onFocus={e=>e.target.style.borderColor=ac}
                onBlur={e=>e.target.style.borderColor=T.border}/>
            </label>
          </div>

          <div>
            <div style={{ fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:T.mono, marginBottom:"0.86rem" }}>Action Points</div>
            <div style={{ display:"flex", gap:"0.57rem", marginBottom:"0.71rem" }}>
              <input value={actionText} onChange={e=>setActionText(e.target.value)}
                placeholder="Add action point…" style={{...inputStyle, flex:1}}
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
                style={{...inputStyle, flex:1, minHeight:"5.14rem", resize:"vertical"}}
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
            placeholder="What needs doing?" style={{...inputStyle, fontSize:"1rem"}}
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
                style={{...inputStyle, colorScheme:"dark"}}
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
    setTasks(p => p.map(t => t.id===task.id ? {...t, column:c, time: c==="Waiting" ? "" : t.time} : t));
  }

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", gap:"0.86rem", overflowX:"auto", paddingBottom:12, alignItems:"flex-start" }}>
        {COLUMNS.map(col=>{
          const colTasks = sortTasks(tasks.filter(t=>t.column===col), col);
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
                  onDragEnd={()=>{dragging.current=null;}}
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

function AiPage({ tasks, setTasks, roles }) {
  const [msgs, setMsgs] = useState([{role:"assistant", text:"Hi! I can help manage your board.\n\n• List all tasks\n• What's waiting?\n• Add a task\n• HM action points"}]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  async function send() {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput("");
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
        "CURRENT BOARD TASKS (use ONLY these):",
        summary,
        "HIRING MANAGER — OUTSTANDING ACTION POINTS (use ONLY these):",
        hmSummary,
        "Valid columns: Weekly, To Do, Waiting, Complete",
        "Valid priorities: Low, Med, High | Valid times: 15m, 30m, 1h, 2h, 4h",
        "Due dates are in YYYY-MM-DD format. When mentioning due dates in responses, describe them naturally e.g. 'due 14 Apr' or 'overdue'.",
        "Valid statuses: Me, Waiting on Candidate, Waiting on Stakeholder",
        "Action types: {type:add,task:{title,column,prio,time,status}} | {type:move,id,column} | {type:update,id,fields} | {type:delete,id}",
        "Defaults: column=To Do, prio=Med, time=30m, status=Me. If status is Waiting on Candidate or Waiting on Stakeholder, set column=Waiting.",
        "Only include actions array entries when the user actually wants to change something. For questions or listings, actions should be [].",
      ].join("\n");

      const orKey = import.meta.env.VITE_OPENROUTER_KEY;
      const models = [
        "stepfun/step-3.5-flash:free",
        "nvidia/llama-3.1-nemotron-nano-8b-instruct:free",
        "meta-llama/llama-4-scout:free",
      ];
      let raw = "";
      for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) await new Promise(r => setTimeout(r, 1500));
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {"Content-Type": "application/json", "Authorization": `Bearer ${orKey}`},
              body: JSON.stringify({
                model,
                messages: [
                  {role:"system", content: sys},
                  {role:"user", content: msg},
                ],
                max_tokens: 2048,
              }),
            });
            const data = await res.json();
            raw = data?.choices?.[0]?.message?.content || "";
            if (raw) break;
          } catch(_) { continue; }
        }
        if (raw) break;
      }
      if (!raw) throw new Error("All providers failed, please try again.");
      let result = {message: raw, actions:[]};
      try {
        const cleaned = raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
        const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
        if (s>-1 && e>-1) {
          const parsed = JSON.parse(cleaned.slice(s, e+1));
          if (parsed.message) parsed.message = parsed.message.replace(/\\n/g, "\n");
          result = parsed;
        } else if (s>-1) {
          // JSON was truncated — try to extract just the message field
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
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.86rem"}}>
        {["Good morning","List all tasks","What's waiting?","HM action points"].map(c=>(
          <button key={c} onClick={()=>setInput(c)} style={{fontSize:"0.79rem",padding:"0.36rem 0.86rem",borderRadius:20,background:T.card,border:`1px solid ${T.border}`,color:T.dim,cursor:"pointer",fontFamily:T.font}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#4f8ef7";e.currentTarget.style.color="#4f8ef7";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dim;}}
          >{c}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:"0.71rem"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask me about your tasks..." disabled={busy}
          style={{...inputStyle,flex:1,fontSize:"0.93rem"}}
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

function RoleDetail({ role, onUpdate, onDelete }) {
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
          <button onClick={()=>onDelete(role.id)} style={{fontSize:"0.86rem",color:"#f06292",background:"transparent",border:"1px solid #f0629244",borderRadius:"0.5rem",padding:"0.36rem 0.86rem",cursor:"pointer",fontFamily:T.font,flexShrink:0}}>Delete</button>
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
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
              fontSize:"0.72rem", background:T.card, border:`1px solid ${T.border}`,
              borderRadius:"0.36rem", color:T.dim, padding:"2px 6px",
              fontFamily:T.mono, cursor:"pointer", outline:"none",
            }}>
              <option value="hm">HM</option>
              <option value="job">Job</option>
              <option value="prio">Priority</option>
            </select>
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
                    <span style={{fontSize:"0.79rem",color:T.muted}}>{role.hiringManager||"No HM"}</span>
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
const ROLES_KEY = "talin_roles";

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

function loadFromStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function App() {
  const [page,    setPage]    = useState("board");
  const [showAdd, setShowAdd] = useState(false);
  const [tasks,   setTasks]   = useState(() => loadFromStorage(TASKS_KEY, DEFAULT_TASKS));
  const [roles,   setRoles]   = useState(() => loadFromStorage(ROLES_KEY, DEFAULT_ROLES));

  useEffect(() => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch {} }, [tasks]);
  useEffect(() => { try { localStorage.setItem(ROLES_KEY, JSON.stringify(roles)); } catch {} }, [roles]);

  const safeTasks = tasks.filter(Boolean);
  const stats = [
    {label:"Total",    val:safeTasks.length},
    {label:"To Do",    val:safeTasks.filter(t=>t.column==="To Do").length},
    {label:"Waiting",  val:safeTasks.filter(t=>t.column==="Waiting").length},
    {label:"Complete", val:safeTasks.filter(t=>t.column==="Complete").length},
  ];

  return (
    <div style={{ fontFamily:T.font, height:"100vh", background:T.bg, color:T.text, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } :root { font-size: clamp(10px, 1.05vw, 14px); } select, input, textarea, button { font-size: inherit; }`}</style>

      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 1.4rem", height:"3.4rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.43rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.57rem" }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:"#4f8ef7",boxShadow:"0 0 8px #4f8ef7" }}/>
            <span style={{ fontSize:"1rem", fontWeight:600, color:T.white, letterSpacing:"-0.02em" }}>TALIN</span>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {[["board","Board"],["hiring","Hiring Manager"],["ai","AI Assistant"]].map(([k,l])=>(
              <button key={k} onClick={()=>setPage(k)} style={{ fontSize:"0.86rem", fontWeight: page===k?600:400, color: page===k?"#4f8ef7":T.dim, background: page===k?"rgba(79,142,247,0.12)":"none", border: page===k?"1px solid rgba(79,142,247,0.3)":"1px solid transparent", borderRadius:"0.5rem", padding:"0.36rem 1rem", cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.86rem" }}>
          <div style={{ display:"flex", gap:0, background:T.card, border:`1px solid ${T.border}`, borderRadius:"0.57rem", overflow:"hidden" }}>
            {stats.map((s,i)=>(
              <div key={s.label} style={{ padding:"0.36rem 0.86rem", borderRight: i<stats.length-1?`1px solid ${T.border}`:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                <span style={{ fontSize:"1rem", fontWeight:600, color:T.white, fontFamily:T.mono, lineHeight:1 }}>{s.val}</span>
                <span style={{ fontSize:"0.65rem", color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {page==="board" && (
            <button onClick={()=>setShowAdd(true)} style={{ fontSize:"0.86rem", fontWeight:600, padding:"0.5rem 1.14rem", background:"linear-gradient(135deg,#4f8ef7dd,#4f8ef799)", color:T.bg, border:"none", borderRadius:"0.5rem", cursor:"pointer", fontFamily:T.font, letterSpacing:"0.02em", transition:"opacity .15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.8"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}
            >+ Add task</button>
          )}
        </div>
      </div>

      <div style={{ flex:1, minHeight:0, overflowY:"auto", position:"relative", padding: page==="hiring" ? 0 : page==="ai" ? "1.43rem" : "1.43rem" }}>
        {page==="board" && <BoardPage tasks={safeTasks} setTasks={setTasks}/>}
        {page==="hiring" && <HiringPage roles={roles} setRoles={setRoles}/>}
        {page==="ai" && <AiPage tasks={safeTasks} setTasks={setTasks} roles={roles}/>}
        {showAdd && page==="board" && (
          <AddModal onClose={()=>setShowAdd(false)} onAdd={t=>{setTasks(p=>[...p,t]);setShowAdd(false);}}/>
        )}
      </div>
    </div>
  );
}