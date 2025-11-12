import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";

function ymKey(d){
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`;
}

export default function Financeiro(){
  const receivables = useStore(s=>s.receivables);
  const payables = useStore(s=>s.payables);
  const markRecPaid = useStore(s=>s.markRecPaid);
  const markPayPaid = useStore(s=>s.markPayPaid);
  const cashOpening = useStore(s=>s.cashOpening);
  const setOpening = useStore(s=>s.setCashOpening);

  const [tab, setTab] = useState("rec"); // rec | pay | fluxo
  const [from, setFrom] = useState(()=> new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
  const [to, setTo] = useState(()=> new Date().toISOString().slice(0,10));

  const rInRange = useMemo(()=> (receivables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [receivables, from, to]);

  const pInRange = useMemo(()=> (payables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [payables, from, to]);

  const sum = (arr, filter=()=>true) => arr.filter(filter).reduce((s,x)=> s + Number(x.amount||0), 0);

  // Fluxo de Caixa (mês atual)
  const monthKey = ymKey(from); // usa o mês do início do período
  const opening = cashOpening[monthKey] || 0;
  const entradas = sum(rInRange);
  const saidas = sum(pInRange);
  const saldoPrevisto = opening + entradas - saidas;
  const entradasPagas = sum(rInRange, x=>x.status==="paid");
  const saidasPagas = sum(pInRange, x=>x.status==="paid");
  const saldoReal = opening + entradasPagas - saidasPagas;

  return (
    <div className="stack">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontWeight:800, fontSize:18}}>Financeiro</div>
          <div className="muted" style={{fontSize:12}}>Período</div>
        </div>
        <div className="row">
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
      </div>

      <div className="row">
        <button className={`btn ${tab==="rec"?"primary":""}`} onClick={()=>setTab("rec")}>A Receber</button>
        <button className={`btn ${tab==="pay"?"primary":""}`} onClick={()=>setTab("pay")}>A Pagar</button>
        <button className={`btn ${tab==="fluxo"?"primary":""}`} onClick={()=>setTab("fluxo")}>Fluxo de Caixa</button>
      </div>

      {tab==="rec" && (
        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: R$ {sum(rInRange).toFixed(2)} • Pagos: R$ {entradasPagas.toFixed(2)}</div>
          </div>
          <div className="table-card">
            {rInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {rInRange.map((r,i)=>(
              <div key={r.id} className="row" style={{justifyContent:"space-between", borderTop:i? '1px solid var(--border)':'none', paddingTop:i?8:0}}>
                <div style={{minWidth:80}}>{new Date(r.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{r.customer}</div>
                <div className="muted" style={{minWidth:90}}>{r.method}</div>
                <div style={{minWidth:120}}><strong>R$ {Number(r.amount).toFixed(2)}</strong></div>
                <button className="btn" onClick={()=>markRecPaid(r.id)} disabled={r.status==="paid"}>
                  {r.status==="paid" ? "Pago" : "Marcar pago"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="pay" && (
        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: R$ {sum(pInRange).toFixed(2)} • Pagos: R$ {saidasPagas.toFixed(2)}</div>
          </div>
          <div className="table-card">
            {pInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {pInRange.map((p,i)=>(
              <div key={p.id} className="row" style={{justifyContent:"space-between", borderTop:i? '1px solid var(--border)':'none', paddingTop:i?8:0}}>
                <div style={{minWidth:80}}>{new Date(p.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{p.description}</div>
                <div className="muted" style={{minWidth:90}}>{p.category||"Geral"}</div>
                <div style={{minWidth:120}}><strong>R$ {Number(p.amount).toFixed(2)}</strong></div>
                <button className="btn" onClick={()=>markPayPaid(p.id)} disabled={p.status==="paid"}>
                  {p.status==="paid" ? "Pago" : "Pagar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="fluxo" && (
        <div className="card">
          <div style={{fontWeight:700, marginBottom:8}}>Fluxo de Caixa</div>
          <div className="row" style={{marginBottom:8}}>
            <div className="muted">Mês base: {monthKey}</div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <span>Saldo inicial do mês</span>
              <input
                className="input"
                type="number" step="0.01"
                defaultValue={opening}
                onBlur={(e)=>setOpening(monthKey, e.target.value)}
                style={{width:160}}
              />
            </div>
          </div>
          <div className="row">
            <div className="kpi"><div className="label">Entradas (previsto)</div><div className="value">R$ {entradas.toFixed(2)}</div></div>
            <div className="kpi"><div className="label">Saídas (previsto)</div><div className="value">R$ {saidas.toFixed(2)}</div></div>
            <div className="kpi"><div className="label">Saldo previsto</div><div className="value">R$ {saldoPrevisto.toFixed(2)}</div></div>
            <div className="kpi"><div className="label">Saldo real</div><div className="value">R$ {saldoReal.toFixed(2)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
