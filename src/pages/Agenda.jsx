import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import {
  pad, toDate, addDays, startOfDay, endOfDay,
  startOfWeek, endOfWeek, fmtDate, fmtTime, isSameMonth, rangeDays
} from "../lib/date.jsx";

export default function Agenda() {
  const appts = useStore(s => s.appts);
  const clients = useStore(s => s.clients);
  const [view, setView] = useState("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));

  
  const next = () => {
    if (view === "day") setCursor(addDays(cursor, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else { const x = toDate(cursor); x.setMonth(x.getMonth() + 1); setCursor(startOfDay(x)); }
  };
  const prev = () => {
    if (view === "day") setCursor(addDays(cursor, -1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else { const x = toDate(cursor); x.setMonth(x.getMonth() - 1); setCursor(startOfDay(x)); }
  };

  const d0 = view === "day"  ? startOfDay(cursor)
           : view === "week" ? startOfWeek(cursor)
           : new Date(toDate(cursor).getFullYear(), toDate(cursor).getMonth(), 1);

  const d1 = view === "day"  ? endOfDay(cursor)
           : view === "week" ? endOfWeek(cursor)
           : new Date(toDate(d0).getFullYear(), toDate(d0).getMonth() + 1, 0, 23, 59, 59, 999);

  const apptsRange = useMemo(() => {
    const a = appts || [];
    const t0 = d0.getTime(), t1 = d1.getTime();
    return a.filter(x => x.start_at >= t0 && x.start_at <= t1).sort((A,B)=>A.start_at-B.start_at);
  }, [appts, d0, d1]);

  return (
    <div className="stack fade-in">
      <div className="card">
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

        <div className="row" style={{marginTop:8}}>
          <button className={`btn ${view==="day"?"primary":""}`} onClick={()=>setView("day")}>Dia</button>
          <button className={`btn ${view==="week"?"primary":""}`} onClick={()=>setView("week")}>Semana</button>
          <button className={`btn ${view==="month"?"primary":""}`} onClick={()=>setView("month")}>Mês</button>
        </div>
      </div>

      {view==="month" && <MonthGrid monthDate={cursor} appts={appts} clients={clients} />}

      {(view==="week" || view==="day") && (
        <div className="card slide-up">
          <div style={{fontWeight:700, marginBottom:8}}>
            {view==="day" ? "Atendimentos do dia" : "Atendimentos da semana"}
          </div>
          <div className="stack">
            {apptsRange.length===0 && <div className="muted">Sem atendimentos.</div>}
            {apptsRange.map((a,i)=>{
              const c = clients.find(x=>x.id===a.client_id);
              return (
                <div key={a.id} className="fade-in" style={{paddingTop:i?8:0, borderTop:i? '1px solid var(--border)' : 'none'}}>
                  <div className="item-head">
                    <div style={{display:"flex", gap:8, alignItems:"center"}}>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                      <strong>{c?.name || "Cliente"}</strong>
                    </div>
                    <span className="muted">
                      {fmtDate(a.start_at)} • {new Date(a.start_at).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})}
                      –
                      {new Date(a.end_at).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})}
                    </span>
                  </div>
                  <div className="muted">{a.service}{a.location?` • ${a.location}`:""}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({ monthDate, appts, clients }) {
  const firstOfMonth = new Date(toDate(monthDate).getFullYear(), toDate(monthDate).getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  const days = rangeDays(start, addDays(start, 41));

  const byDay = new Map();
  for (const a of appts || []) {
    const key = startOfDay(a.start_at).getTime();
    const arr = byDay.get(key) || [];
    arr.push(a);
    byDay.set(key, arr);
  }

  return (
    <div className="card slide-up">
      <div className="muted" style={{marginBottom:8}}>Seg • Ter • Qua • Qui • Sex • Sáb • Dom</div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:8}}>
        {days.map((d) => {
          const t = startOfDay(d).getTime();
          const items = byDay.get(t) || [];
          const faded = !isSameMonth(d, firstOfMonth);
          return (
            <div key={t} className="card fade-in" style={{padding:10, opacity: faded ? .55 : 1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", marginBottom:6}}>
                <div style={{fontWeight:700}}>{toDate(d).getDate()}</div>
                {items.length>0 && <span className="badge">{items.length}</span>}
              </div>
              <div className="stack">
                {items.slice(0,3).map(a=>{
                  const c = (clients||[]).find(x=>x.id===a.client_id);
                  return (
                    <div key={a.id} className="muted" style={{fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                      {new Date(a.start_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} • {c?.name || "Cliente"}
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
