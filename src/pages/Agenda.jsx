import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import {
  pad, toDate, addDays, startOfDay, endOfDay,
  startOfWeek, endOfWeek, fmtDate, fmtTime, isSameDay, isSameMonth, rangeDays
} from "../lib/date.jsx";

export default function Agenda() {
  const appts = useStore(s => s.appts);
  const clients = useStore(s => s.clients);
  const [view, setView] = useState("month"); // "month" | "week" | "day"
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));

  // Helpers
  const next = () => {
    if (view === "day") setCursor(addDays(cursor, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else { // month
      const x = toDate(cursor); x.setMonth(x.getMonth() + 1); setCursor(startOfDay(x));
    }
  };
  const prev = () => {
    if (view === "day") setCursor(addDays(cursor, -1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else { const x = toDate(cursor); x.setMonth(x.getMonth() - 1); setCursor(startOfDay(x)); }
  };

  // Ranges
  const d0 = view === "day"  ? startOfDay(cursor)
           : view === "week" ? startOfWeek(cursor)
           : new Date(toDate(cursor).getFullYear(), toDate(cursor).getMonth(), 1);

  const d1 = view === "day"  ? endOfDay(cursor)
           : view === "week" ? endOfWeek(cursor)
           : new Date(toDate(d0).getFullYear(), toDate(d0).getMonth() + 1, 0, 23, 59, 59, 999);

  // Eventos no range
  const apptsRange = useMemo(() => {
    const a = appts || [];
    const t0 = d0.getTime(), t1 = d1.getTime();
    return a.filter(x => x.start_at >= t0 && x.start_at <= t1).sort((A,B)=>A.start_at-B.start_at);
  }, [appts, d0, d1]);

  return (
    <div className="stack">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:800, fontSize:18}}>Agenda</div>
          <div className="muted" style={{fontSize:12}}>
            {view==="day" && fmtDate(cursor)}
            {view==="week" && `${fmtDate(d0)} – ${fmtDate(d1)}`}
            {view==="month" && `${pad(toDate(cursor).getMonth()+1)}/${toDate(cursor).getFullYear()}`}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={prev}>◀</button>
          <button className="btn" onClick={()=>setCursor(startOfDay(new Date()))}>Hoje</button>
          <button className="btn" onClick={next}>▶</button>
        </div>
      </div>

      <div className="row">
        <button className={`btn ${view==="day"?"primary":""}`} onClick={()=>setView("day")}>Dia</button>
        <button className={`btn ${view==="week"?"primary":""}`} onClick={()=>setView("week")}>Semana</button>
        <button className={`btn ${view==="month"?"primary":""}`} onClick={()=>setView("month")}>Mês</button>
      </div>

      {/* Views */}
      {view==="month" && <MonthGrid monthDate={cursor} appts={appts} clients={clients} />}
      {view==="week"  && <ListRange title="Atendimentos da semana" appts={apptsRange} clients={clients} />}
      {view==="day"   && <ListRange title="Atendimentos do dia" appts={apptsRange} clients={clients} />}
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function MonthGrid({ monthDate, appts, clients }) {
  const firstOfMonth = new Date(toDate(monthDate).getFullYear(), toDate(monthDate).getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  const days = rangeDays(start, addDays(start, 41)); // 6 semanas (6*7 = 42)

  // agrupa por dia
  const byDay = new Map();
  for (const a of appts || []) {
    const key = startOfDay(a.start_at).getTime();
    const arr = byDay.get(key) || [];
    arr.push(a);
    byDay.set(key, arr);
  }

  return (
    <div className="card">
      <div className="muted" style={{marginBottom:8}}>Seg • Ter • Qua • Qui • Sex • Sáb • Dom</div>
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(7, 1fr)",
        gap:8
      }}>
        {days.map((d) => {
          const t = startOfDay(d).getTime();
          const items = byDay.get(t) || [];
          const faded = !isSameMonth(d, firstOfMonth);
          return (
            <div key={t} className="card" style={{padding:10, opacity: faded ? .55 : 1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", marginBottom:6}}>
                <div style={{fontWeight:700}}>{toDate(d).getDate()}</div>
                {items.length>0 && <span className="badge">{items.length}</span>}
              </div>
              <div className="stack">
                {items.slice(0,3).map(a=>{
                  const c = (clients||[]).find(x=>x.id===a.client_id);
                  return (
                    <div key={a.id} className="muted" style={{fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                      {fmtTime(a.start_at)} • {c?.name || "Cliente"}
                    </div>
                  );
                })}
                {items.length>3 && <div className="muted" style={{fontSize:12}}>+{items.length-3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListRange({ title, appts, clients }) {
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:8}}>{title}</div>
      <div className="stack">
        {(appts||[]).length===0 && <div className="muted">Sem atendimentos.</div>}
        {(appts||[]).map(a=>{
          const c = (clients||[]).find(x=>x.id===a.client_id);
          return (
            <div key={a.id} className="item">
              <div className="item-head">
                <div style={{display:"flex", gap:8, alignItems:"center"}}>
                  <span className={`badge ${a.status}`}>{a.status}</span>
                  <strong>{c?.name || "Cliente"}</strong>
                </div>
                <span className="muted">{fmtDate(a.start_at)} • {fmtTime(a.start_at)}–{fmtTime(a.end_at)}</span>
              </div>
              <div className="muted">{a.service}{a.location?` • ${a.location}`:""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
