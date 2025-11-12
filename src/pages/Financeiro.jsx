import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Modal from "../components/Modal.jsx";
import { formatBRL, parseBRL } from "../lib/money.js";

/* helpers de período */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d){ const x=new Date(d); const dow=(x.getDay()+6)%7; x.setDate(x.getDate()-dow); x.setHours(0,0,0,0); return x; }
function endOfWeek(d){ const x=startOfWeek(d); x.setDate(x.getDate()+6); x.setHours(23,59,59,999); return x; }
function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1); x.setDate(0); x.setHours(23,59,59,999); return x; }
function lastMonthRange(){
  const today=new Date();
  const firstLast = new Date(today.getFullYear(), today.getMonth()-1, 1);
  return [startOfMonth(firstLast), endOfMonth(firstLast)];
}
function ymKey(d){ const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}`; }
const toISO = (d) => new Date(d).toISOString().slice(0,10);

export default function Financeiro(){
  const receivables = useStore(s=>s.receivables);
  const payables = useStore(s=>s.payables);
  const markRecPaid = useStore(s=>s.markRecPaid);
  const markPayPaid = useStore(s=>s.markPayPaid);
  const cashOpening = useStore(s=>s.cashOpening);
  const setOpening = useStore(s=>s.setCashOpening);

  // Filtro: presets + custom modal
  const [from, setFrom] = useState(()=> toISO(startOfMonth(new Date())));
  const [to, setTo] = useState(()=> toISO(new Date()));
  const [showPicker, setShowPicker] = useState(false);

  const applyPreset = (k) => {
    const now = new Date();
    if (k==="today"){ setFrom(toISO(startOfDay(now))); setTo(toISO(endOfDay(now))); return; }
    if (k==="week"){ setFrom(toISO(startOfWeek(now))); setTo(toISO(endOfWeek(now))); return; }
    if (k==="month"){ setFrom(toISO(startOfMonth(now))); setTo(toISO(endOfMonth(now))); return; }
    if (k==="lastMonth"){ const [a,b]=lastMonthRange(); setFrom(toISO(a)); setTo(toISO(b)); return; }
    if (k==="custom"){ setShowPicker(true); return; }
  };

  const [tab, setTab] = useState("rec"); // rec | pay | fluxo

  const rInRange = useMemo(()=> (receivables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [receivables, from, to]);

  const pInRange = useMemo(()=> (payables||[])
    .filter(r => r.due_date >= new Date(from).getTime() && r.due_date <= new Date(to).getTime())
    .sort((a,b)=>a.due_date-b.due_date), [payables, from, to]);

  const sum = (arr, filter=()=>true) => arr.filter(filter).reduce((s,x)=> s + Number(x.amount||0), 0);

  /* Fluxo de Caixa (com saldo inicial do mês do "from") */
  const monthKey = ymKey(from);
  const opening = cashOpening[monthKey] || 0;
  const entradasPrev = sum(rInRange);
  const saidasPrev = sum(pInRange);
  const saldoPrevisto = opening + entradasPrev - saidasPrev;
  const entradasPagas = sum(rInRange, x=>x.status==="paid");
  const saidasPagas = sum(pInRange, x=>x.status==="paid");
  const saldoReal = opening + entradasPagas - saidasPagas;

  /* UI de edição do saldo: modal elegante */
  const [openOpening, setOpenOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState(() => String(opening));

  return (
    <div className="stack">
      {/* Cabeçalho + filtro sofisticado */}
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <div>
            <div style={{fontWeight:800, fontSize:18}}>Financeiro</div>
            <div className="muted" style={{fontSize:12}}>Defina o período e visualize seus lançamentos</div>
          </div>
          <div className="row">
            <button className="pill" onClick={()=>applyPreset("today")}><span>Hoje</span></button>
            <button className="pill" onClick={()=>applyPreset("week")}><span>Semana</span></button>
            <button className="pill" onClick={()=>applyPreset("month")}><span>Mês</span></button>
            <button className="pill" onClick={()=>applyPreset("lastMonth")}><span>Mês passado</span></button>
            <button className="pill" onClick={()=>applyPreset("custom")}><span>Personalizado</span></button>
          </div>
        </div>

        <div className="divider"></div>

        <div className="row">
          <div className="pill"><span className="hint">De</span><strong>{from.split("-").reverse().join("/")}</strong></div>
          <div className="pill"><span className="hint">Até</span><strong>{to.split("-").reverse().join("/")}</strong></div>
          <button className="btn ghost" onClick={()=>setShowPicker(true)}>Alterar datas…</button>
        </div>
      </div>

      {/* Abas */}
      <div className="row">
        <button className={`btn ${tab==="rec"?"primary":""}`} onClick={()=>setTab("rec")}>A Receber</button>
        <button className={`btn ${tab==="pay"?"primary":""}`} onClick={()=>setTab("pay")}>A Pagar</button>
        <button className={`btn ${tab==="fluxo"?"primary":""}`} onClick={()=>setTab("fluxo")}>Fluxo de Caixa</button>
      </div>

      {/* Recebíveis */}
      {tab==="rec" && (
        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: {formatBRL(sum(rInRange))} • Pagos: {formatBRL(entradasPagas)}</div>
          </div>
          <div className="table-card">
            {rInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {rInRange.map((r,i)=>(
              <div key={r.id} className="table-row">
                <div style={{minWidth:90}}>{new Date(r.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{r.customer}</div>
                <div className="muted" style={{minWidth:90}}>{r.method}</div>
                <div style={{minWidth:130}}><strong>{formatBRL(r.amount)}</strong></div>
                <button className="btn" onClick={()=>markRecPaid(r.id)} disabled={r.status==="paid"}>
                  {r.status==="paid" ? "Pago" : "Marcar pago"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagáveis */}
      {tab==="pay" && (
        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Resumo</strong>
            <div className="muted">Total: {formatBRL(sum(pInRange))} • Pagos: {formatBRL(saidasPagas)}</div>
          </div>
          <div className="table-card">
            {pInRange.length===0 && <div className="muted">Sem lançamentos.</div>}
            {pInRange.map((p,i)=>(
              <div key={p.id} className="table-row">
                <div style={{minWidth:90}}>{new Date(p.due_date).toLocaleDateString("pt-BR")}</div>
                <div style={{flex:1}}>{p.description}</div>
                <div className="muted" style={{minWidth:90}}>{p.category||"Geral"}</div>
                <div style={{minWidth:130}}><strong>{formatBRL(p.amount)}</strong></div>
                <button className="btn" onClick={()=>markPayPaid(p.id)} disabled={p.status==="paid"}>
                  {p.status==="paid" ? "Pago" : "Pagar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fluxo de Caixa */}
      {tab==="fluxo" && (
        <div className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <strong>Fluxo de Caixa</strong>
            <button className="pill" onClick={()=>{
              setOpeningInput(String(opening));
              setOpenOpening(true);
            }}>
              <span className="hint">Saldo inicial {monthKey}</span>
              <strong>{formatBRL(opening)}</strong>
            </button>
          </div>

          <div className="row">
            <div className="kpi"><div className="label">Entradas (previsto)</div><div className="value">{formatBRL(entradasPrev)}</div></div>
            <div className="kpi"><div className="label">Saídas (previsto)</div><div className="value">{formatBRL(saidasPrev)}</div></div>
            <div className="kpi"><div className="label">Saldo previsto</div><div className="value">{formatBRL(saldoPrevisto)}</div></div>
            <div className="kpi"><div className="label">Saldo real</div><div className="value">{formatBRL(saldoReal)}</div></div>
          </div>
        </div>
      )}

      {/* Modal período personalizado */}
      <Modal open={showPicker} onClose={()=>setShowPicker(false)} title="Período personalizado">
        <div className="row">
          <div style="display:none"></div>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button className="btn" onClick={()=>setShowPicker(false)}>Fechar</button>
        </div>
      </Modal>

      {/* Modal para editar saldo inicial */}
      <Modal open={openOpening} onClose={()=>setOpenOpening(false)} title={`Saldo inicial — ${monthKey}`}>
        <div className="stack">
          <div className="muted">Informe o saldo de abertura do mês selecionado (apenas números ou no formato R$).</div>
          <input
            className="input"
            inputMode="decimal"
            value={openingInput}
            onChange={(e)=>setOpeningInput(e.target.value)}
            placeholder="Ex.: 1500,00"
          />
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div className="muted">Prévia: <strong>{formatBRL(parseBRL(openingInput))}</strong></div>
            <div style={{display:"flex", gap:8}}>
              <button className="btn" onClick={()=>setOpenOpening(false)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={()=>{
                  const val = parseBRL(openingInput);
                  useStore.getState().setCashOpening(monthKey, val);
                  setOpenOpening(false);
                }}
              >Salvar</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
