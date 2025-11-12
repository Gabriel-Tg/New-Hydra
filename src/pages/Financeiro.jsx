import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Modal from "../components/Modal.jsx";
import { formatBRL, parseBRL } from "../lib/money.js";

/* helpers de período */
const toISO = (d) => new Date(d).toISOString().slice(0,10);
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d){ const x=new Date(d); const dow=(x.getDay()+6)%7; x.setDate(x.getDate()-dow); x.setHours(0,0,0,0); return x; }
function endOfWeek(d){ const x=startOfWeek(d); x.setDate(x.getDate()+6); x.setHours(23,59,59,999); return x; }
function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1); x.setDate(0); x.setHours(23,59,59,999); return x; }
function lastMonthRange(){ const t=new Date(); const f=new Date(t.getFullYear(), t.getMonth()-1, 1); return [startOfMonth(f), endOfMonth(f)]; }
function ymKey(dateISO){ const [Y,M] = String(dateISO).split("-"); return `${Y}-${M}`; }

export default function Financeiro(){
  const receivables = useStore(s=>s.receivables);
  const payables = useStore(s=>s.payables);
  const markRecPaid = useStore(s=>s.markRecPaid);
  const markPayPaid = useStore(s=>s.markPayPaid);
  const cashOpening = useStore(s=>s.cashOpening);
  const setOpening = useStore(s=>s.setCashOpening);

  const [from, setFrom] = useState(()=> toISO(startOfMonth(new Date())));
  const [to, setTo] = useState(()=> toISO(new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [tab, setTab] = useState("rec"); // rec | pay | fluxo

  const applyPreset = (k) => {
    const now = new Date();
    if (k==="today"){ setFrom(toISO(startOfDay(now))); setTo(toISO(endOfDay(now))); }
    if (k==="week"){ setFrom(toISO(startOfWeek(now))); setTo(toISO(endOfWeek(now))); }
    if (k==="month"){ setFrom(toISO(startOfMonth(now))); setTo(toISO(endOfMonth(now))); }
    if (k==="lastMonth"){ const [a,b]=lastMonthRange(); setFrom(toISO(a)); setTo(toISO(b)); }
    setShowPresets(false);
  };

  const rInRange = useMemo(()=> (receivables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [receivables, from, to]);

  const pInRange = useMemo(()=> (payables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [payables, from, to]);

  const sum = (arr, filter=()=>true) => arr.filter(filter).reduce((s,x)=> s + Number(x.amount||0), 0);

  const monthKey = ymKey(from);
  const opening = cashOpening[monthKey] || 0;
  const entradasPrev = sum(rInRange);
  const saidasPrev = sum(pInRange);
  const saldoPrevisto = opening + entradasPrev - saidasPrev;
  const entradasPagas = sum(rInRange, x=>x.status==="paid");
  const saidasPagas = sum(pInRange, x=>x.status==="paid");
  const saldoReal = opening + entradasPagas - saidasPagas;

  const [editingOpening, setEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState(() => String(opening));

  return (
    <div className="stack fade-in">
      {/* TOOLBAR */}
      <div className="card">
        <div className="toolbar">
          <div className="toolbar-start">
            <div style={{fontWeight:800, fontSize:18}}>Financeiro</div>
            <div className="muted" style={{fontSize:12}}>Filtre o período, edite o saldo inicial e gerencie lançamentos</div>
          </div>

          <div className="pill-group">
            <div className="popover">
              <button className="pill ripple" onClick={()=>setShowPresets(v=>!v)}>
                <span className="hint">Período</span><strong>Pré-definidos</strong>
              </button>
              {showPresets && (
                <div className="popover-panel">
                  <div className="stack">
                    <button className="btn" onClick={()=>applyPreset("today")}>Hoje</button>
                    <button className="btn" onClick={()=>applyPreset("week")}>Esta semana</button>
                    <button className="btn" onClick={()=>applyPreset("month")}>Este mês</button>
                    <button className="btn" onClick={()=>applyPreset("lastMonth")}>Mês passado</button>
                    <button className="btn" onClick={()=>{ setShowPresets(false); setShowPicker(true); }}>Personalizado…</button>
                  </div>
                </div>
              )}
            </div>

            <div className="pill">
              <span className="hint">De</span><strong>{from.split("-").reverse().join("/")}</strong>
            </div>
            <div className="pill">
              <span className="hint">Até</span><strong>{to.split("-").reverse().join("/")}</strong>
            </div>
            <button className="btn ghost ripple" onClick={()=>setShowPicker(true)}>Alterar datas</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="row">
        <button className={`btn ripple ${tab==="rec"?"primary":""}`} onClick={()=>setTab("rec")}>A Receber</button>
        <button className={`btn ripple ${tab==="pay"?"primary":""}`} onClick={()=>setTab("pay")}>A Pagar</button>
        <button className={`btn ripple ${tab==="fluxo"?"primary":""}`} onClick={()=>setTab("fluxo")}>Fluxo de Caixa</button>
      </div>

      {/* RECEBÍVEIS */}
      {tab==="rec" && (
        <div className="card slide-up">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: {formatBRL(sum(rInRange))} • Pagos: {formatBRL(entradasPagas)}</div>
          </div>
          <div className="table-card">
            {rInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {rInRange.map((r)=>(
              <div key={r.id} className="table-row fade-in">
                <div style={{minWidth:90}}>{new Date(r.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{r.customer}</div>
                <div className="muted" style={{minWidth:90}}>{r.method}</div>
                <div style={{minWidth:130}}><strong>{formatBRL(r.amount)}</strong></div>
                <button className="btn ripple" onClick={()=>markRecPaid(r.id)} disabled={r.status==="paid"}>
                  {r.status==="paid" ? "Pago" : "Marcar pago"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAGÁVEIS */}
      {tab==="pay" && (
        <div className="card slide-up">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: {formatBRL(sum(pInRange))} • Pagos: {formatBRL(saidasPagas)}</div>
          </div>
          <div className="table-card">
            {pInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {pInRange.map((p)=>(
              <div key={p.id} className="table-row fade-in">
                <div style={{minWidth:90}}>{new Date(p.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{p.description}</div>
                <div className="muted" style={{minWidth:90}}>{p.category||"Geral"}</div>
                <div style={{minWidth:130}}><strong>{formatBRL(p.amount)}</strong></div>
                <button className="btn ripple" onClick={()=>markPayPaid(p.id)} disabled={p.status==="paid"}>
                  {p.status==="paid" ? "Pago" : "Pagar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLUXO DE CAIXA */}
      {tab==="fluxo" && (
        <div className="card slide-up">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Fluxo de Caixa</strong>
            {!editingOpening ? (
              <button className="pill ripple" onClick={()=>{ setOpeningInput(String(opening)); setEditingOpening(true); }}>
                <span className="hint">Saldo inicial {monthKey}</span>
                <strong>{formatBRL(opening)}</strong>
              </button>
            ) : (
              <div className="pill fade-in" style={{gap:6}}>
                <span className="hint">Saldo inicial</span>
                <input
                  className="input"
                  style={{width:140, padding:"6px 10px"}}
                  inputMode="decimal"
                  value={openingInput}
                  onChange={(e)=>setOpeningInput(e.target.value)}
                />
                <button className="btn ripple" onClick={()=>setEditingOpening(false)}>Cancelar</button>
                <button className="btn primary ripple" onClick={()=>{
                  const val = parseBRL(openingInput);
                  setOpening(monthKey, val);
                  setEditingOpening(false);
                }}>Salvar</button>
              </div>
            )}
          </div>

          <div className="row">
            <div className="kpi fade-in"><div className="label">Entradas (previsto)</div><div className="value">{formatBRL(entradasPrev)}</div></div>
            <div className="kpi fade-in"><div className="label">Saídas (previsto)</div><div className="value">{formatBRL(saidasPrev)}</div></div>
            <div className="kpi fade-in"><div className="label">Saldo previsto</div><div className="value">{formatBRL(saldoPrevisto)}</div></div>
            <div className="kpi fade-in"><div className="label">Saldo real</div><div className="value">{formatBRL(saldoReal)}</div></div>
          </div>
        </div>
      )}

      {/* Modal - período personalizado */}
      <Modal open={showPicker} onClose={()=>setShowPicker(false)} title="Período personalizado">
        <div className="row">
          <div className="stack" style={{flex:1}}>
            <label className="muted" style={{fontSize:12}}>De</label>
            <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div className="stack" style={{flex:1}}>
            <label className="muted" style={{fontSize:12}}>Até</label>
            <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button className="btn ripple" onClick={()=>setShowPicker(false)}>Fechar</button>
        </div>
      </Modal>
    </div>
  );
}
