import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, fmtDate, fmtTime } from "../lib/date.jsx";

export default function Inicio(){
  const appts = useStore(s=>s.appts);
  const receivables = useStore(s=>s.receivables);
  const payables = useStore(s=>s.payables);
  const clients = useStore(s=>s.clients);
  const confirm = useStore(s=>s.confirmAppointment);
  const complete = useStore(s=>s.completeAppointment);
  const reschedule = useStore(s=>s.rescheduleAppointment);
  const [scope, setScope] = useState("day");
  const [reprog, setReprog] = useState(null);
  const today = new Date();

  const d0 = scope==="day" ? startOfDay(today) : startOfWeek(today);
  const d1 = scope==="day" ? endOfDay(today)   : endOfWeek(today);

  const apptsRange = useMemo(()=> (appts||[])
    .filter(a => a.start_at >= d0.getTime() && a.start_at <= d1.getTime())
    .sort((a,b)=>a.start_at-b.start_at), [appts, scope]);

  const recRange = useMemo(()=> (receivables||[])
    .filter(r => r.due_date >= d0.getTime() && r.due_date <= d1.getTime() && r.status!=="paid"), [receivables, scope]);

  const payRange = useMemo(()=> (payables||[])
    .filter(p => p.due_date >= d0.getTime() && p.due_date <= d1.getTime() && p.status!=="paid"), [payables, scope]);

  const sum = (arr) => arr.reduce((s,x)=> s + Number(x.amount_cents||0), 0);

  return (
    <div className="stack">
      <div className="card fade-in">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{fontWeight:800, fontSize:18}}>Início</div>
            <div className="muted" style={{fontSize:12}}>
              {scope==="day" ? `Hoje • ${fmtDate(today)}` : `Semana • ${fmtDate(d0)} – ${fmtDate(d1)}`}
            </div>
          </div>
          <div className="row">
            <button className={`btn ${scope==="day"?"primary":""}`} onClick={()=>setScope("day")}>Dia</button>
            <button className={`btn ${scope==="week"?"primary":""}`} onClick={()=>setScope("week")}>Semana</button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="kpi slide-up">
          <div className="label">Agendamentos</div>
          <div className="value">{apptsRange.length}</div>
        </div>
        <div className="kpi slide-up">
          <div className="label">A receber ({recRange.length})</div>
          <div className="value">{(sum(recRange)/100).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })}</div>
        </div>
        <div className="kpi slide-up">
          <div className="label">A pagar ({payRange.length})</div>
          <div className="value">{(sum(payRange)/100).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })}</div>
        </div>
        <div className="kpi slide-up">
          <div className="label">Saldo previsto</div>
          <div className="value">{((sum(recRange)-sum(payRange))/100).toLocaleString("pt-BR", { style:"currency", currency:"BRL" })}</div>
        </div>
      </div>

      <div className="card slide-up">
        <div style={{fontWeight:700, marginBottom:8}}>Atendimentos {scope==="day"?"de hoje":"da semana"}</div>
        <div className="stack">
          {apptsRange.length===0 && <div className="muted">Sem atendimentos no período.</div>}
          {apptsRange.map((a, i)=> {
            const c = (clients||[]).find(x=>x.id===a.client_id);
            const sep = i>0 ? <hr style={{border:'none', borderTop:'1px solid var(--border)'}}/> : null;
            return (
              <div key={a.id} className="stack fade-in">
                {sep}
                <div className="item">
                  <div className="item-head">
                    <div style={{display:"flex", gap:8, alignItems:"center"}}>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                      <strong>{c?.name || "Cliente"}</strong>
                    </div>
                    <span className="muted">{fmtDate(a.start_at)} • {fmtTime(a.start_at)}–{fmtTime(a.end_at)}</span>
                  </div>
                  <div className="muted">{a.service}{a.location?` • ${a.location}`:""}</div>
                  <div className="item-actions">
                    <button className="btn ripple" onClick={()=>useStore.getState().confirmAppointment(a.id)}>Confirmar</button>
                    <button className="btn ripple" onClick={()=>{
                      const d = new Date(a.start_at);
                      const e = new Date(a.end_at);
                      const pad = (n)=>String(n).padStart(2,'0');
                      setReprog({ id:a.id, date:d.toISOString().slice(0,10), start:`${pad(d.getHours())}:${pad(d.getMinutes())}`, end:`${pad(e.getHours())}:${pad(e.getMinutes())}` });
                    }}>Reagendar</button>
                    <button className="btn primary ripple" onClick={()=>useStore.getState().completeAppointment(a.id)}>Concluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {reprog && (
        <div className="card modal-panel" style={{position:"fixed", inset:"auto 16px 90px 16px", zIndex:60}}>
          <div style={{fontWeight:700, marginBottom:8}}>Reagendar</div>
          <div className="row">
            <input className="input" type="date" value={reprog.date} onChange={e=>setReprog({...reprog, date:e.target.value})}/>
            <input className="input" type="time" value={reprog.start} onChange={e=>setReprog({...reprog, start:e.target.value})}/>
            <input className="input" type="time" value={reprog.end} onChange={e=>setReprog({...reprog, end:e.target.value})}/>
          </div>
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:8}}>
            <button className="btn" onClick={()=>setReprog(null)}>Cancelar</button>
            <button className="btn primary" onClick={()=>{
              useStore.getState().rescheduleAppointment(reprog.id, { date: reprog.date, start: reprog.start, end: reprog.end });
              setReprog(null);
            }}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
