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
  const markRecPaid = useStore(s=>s.markRecPaid);
  const markPayPaid = useStore(s=>s.markPayPaid);

  const [scope, setScope] = useState("day");
  const [reprog, setReprog] = useState(null); // {id, date, start, end}
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

  const sum = (arr) => arr.reduce((s,x)=> s + Number(x.amount||0), 0);

  return (
    <div className="stack">
      {/* header */}
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

      {/* KPIs */}
      <div className="row">
        <div className="kpi">
          <div className="label">Agendamentos</div>
          <div className="value">{apptsRange.length}</div>
        </div>
        <div className="kpi">
          <div className="label">A receber ({recRange.length})</div>
          <div className="value">R$ {sum(recRange).toFixed(2)}</div>
        </div>
        <div className="kpi">
          <div className="label">A pagar ({payRange.length})</div>
          <div className="value">R$ {sum(payRange).toFixed(2)}</div>
        </div>
        <div className="kpi">
          <div className="label">Saldo previsto</div>
          <div className="value">R$ {(sum(recRange)-sum(payRange)).toFixed(2)}</div>
        </div>
      </div>

      {/* Atendimentos */}
      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>Atendimentos {scope==="day"?"de hoje":"da semana"}</div>
        <div className="stack">
          {apptsRange.length===0 && <div className="muted">Sem atendimentos no período.</div>}
          {apptsRange.map((a, i)=> {
            const c = (clients||[]).find(x=>x.id===a.client_id);
            const sep = i>0 ? <hr style={{border:'none', borderTop:'1px solid var(--border)'}}/> : null;
            return (
              <div key={a.id} className="stack">
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
                    <button className="btn" onClick={()=>confirm(a.id)}>Confirmar</button>
                    <button className="btn" onClick={()=>{
                      // pré-preenche para reagendar
                      const d = new Date(a.start_at);
                      const e = new Date(a.end_at);
                      const pad = (n)=>String(n).padStart(2,'0');
                      setReprog({
                        id: a.id,
                        date: d.toISOString().slice(0,10),
                        start: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
                        end: `${pad(e.getHours())}:${pad(e.getMinutes())}`
                      });
                    }}>Reagendar</button>
                    <button className="btn primary" onClick={()=>complete(a.id)}>Concluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financeiro resumido */}
      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>A receber no período</div>
        <div className="table-card">
          {recRange.length===0 && <div className="muted">Nada a receber.</div>}
          {recRange.map((r,i)=>(
            <div key={r.id} className="row" style={{justifyContent:"space-between", borderTop:i? '1px solid var(--border)': 'none', paddingTop:i?8:0}}>
              <div>{r.customer}</div>
              <div className="muted">{new Date(r.due_date).toLocaleDateString("pt-BR")}</div>
              <div><strong>R$ {Number(r.amount).toFixed(2)}</strong></div>
              <button className="btn primary" onClick={()=>useStore.getState().markRecPaid(r.id)}>Marcar pago</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>A pagar no período</div>
        <div className="table-card">
          {payRange.length===0 && <div className="muted">Nada a pagar.</div>}
          {payRange.map((p,i)=>(
            <div key={p.id} className="row" style={{justifyContent:"space-between", borderTop:i? '1px solid var(--border)': 'none', paddingTop:i?8:0}}>
              <div>{p.description}</div>
              <div className="muted">{new Date(p.due_date).toLocaleDateString("pt-BR")}</div>
              <div><strong>R$ {Number(p.amount).toFixed(2)}</strong></div>
              <button className="btn primary" onClick={()=>useStore.getState().markPayPaid(p.id)}>Pagar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal simples para reagendar */}
      {reprog && (
        <div className="card" style={{position:"fixed", inset:"auto 12px 90px 12px", zIndex:60}}>
          <div style={{fontWeight:700, marginBottom:8}}>Reagendar</div>
          <div className="row">
            <input className="input" type="date" value={reprog.date} onChange={e=>setReprog({...reprog, date:e.target.value})}/>
            <input className="input" type="time" value={reprog.start} onChange={e=>setReprog({...reprog, start:e.target.value})}/>
            <input className="input" type="time" value={reprog.end} onChange={e=>setReprog({...reprog, end:e.target.value})}/>
          </div>
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:8}}>
            <button className="btn" onClick={()=>setReprog(null)}>Cancelar</button>
            <button className="btn primary" onClick={()=>{
              reschedule(reprog.id, { date: reprog.date, start: reprog.start, end: reprog.end });
              setReprog(null);
            }}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
