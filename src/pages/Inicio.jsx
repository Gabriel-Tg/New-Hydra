import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, fmtDate, fmtTime } from "../lib/date.jsx";

export default function Inicio(){
  const appts = useStore(s=>s.appts);
  const receivables = useStore(s=>s.receivables);
  const payables = useStore(s=>s.payables);
  const markRecPaid = useStore(s=>s.markRecPaid);
  const markPayPaid = useStore(s=>s.markPayPaid);
  const clients = useStore(s=>s.clients);

  const [scope, setScope] = useState("day"); // "day" | "week"
  const today = new Date();
  const d0 = scope==="day" ? startOfDay(today) : startOfWeek(today);
  const d1 = scope==="day" ? endOfDay(today)   : endOfWeek(today);

  const apptsRange = useMemo(()=> appts
    .filter(a => a.start_at >= d0.getTime() && a.start_at <= d1.getTime())
    .sort((a,b)=>a.start_at-b.start_at), [appts, scope]);

  const recRange = useMemo(()=> receivables
    .filter(r => r.due_date >= d0.getTime() && r.due_date <= d1.getTime() && r.status!=="paid"), [receivables, scope]);

  const payRange = useMemo(()=> payables
    .filter(p => p.due_date >= d0.getTime() && p.due_date <= d1.getTime() && p.status!=="paid"), [payables, scope]);

  const sum = (arr) => arr.reduce((s,x)=> s + Number(x.amount||0), 0);

  return (
    <div className="stack">
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

      {/* Próximos atendimentos */}
      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>Atendimentos {scope==="day"?"de hoje":"da semana"}</div>
        <div className="stack">
          {apptsRange.length===0 && <div className="muted">Sem atendimentos no período.</div>}
          {apptsRange.map(a=>{
            const client = clients.find(c=>c.id===a.client_id);
            return (
              <div key={a.id} className="item">
                <div className="item-head">
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <span className={`badge ${a.status}`}>{a.status}</span>
                    <strong>{client?.name || "Cliente"}</strong>
                  </div>
                  <span className="muted">{fmtDate(a.start_at)} • {fmtTime(a.start_at)}–{fmtTime(a.end_at)}</span>
                </div>
                <div className="muted">{a.service} {a.location?` • ${a.location}`:""}</div>
                <div className="item-actions">
                  <button className="btn">Confirmar</button>
                  <button className="btn">Reagendar</button>
                  <button className="btn primary">Concluir</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financeiro resumido (cartões mobile) */}
      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>A receber no período</div>
        <div className="table-card">
          {recRange.length===0 && <div className="muted">Nada a receber.</div>}
          {recRange.map(r=>(
            <div key={r.id} className="row" style={{justifyContent:"space-between"}}>
              <div>{r.customer}</div>
              <div className="muted">{new Date(r.due_date).toLocaleDateString("pt-BR")}</div>
              <div><strong>R$ {Number(r.amount).toFixed(2)}</strong></div>
              <button className="btn primary" onClick={()=>markRecPaid(r.id)}>Marcar pago</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>A pagar no período</div>
        <div className="table-card">
          {payRange.length===0 && <div className="muted">Nada a pagar.</div>}
          {payRange.map(p=>(
            <div key={p.id} className="row" style={{justifyContent:"space-between"}}>
              <div>{p.description}</div>
              <div className="muted">{new Date(p.due_date).toLocaleDateString("pt-BR")}</div>
              <div><strong>R$ {Number(p.amount).toFixed(2)}</strong></div>
              <button className="btn primary" onClick={()=>markPayPaid(p.id)}>Pagar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
