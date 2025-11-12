import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Modal from "../components/Modal.jsx";
import { fmtDate, fmtTime } from "../lib/date.jsx";

export default function Clientes(){
  const clients = useStore(s=>s.clients);
  const appts = useStore(s=>s.appts);
  const recs = useStore(s=>s.receivables);
  const pays = useStore(s=>s.payables);

  const [q, setQ] = useState("");
  const [openHist, setOpenHist] = useState(null);

  const list = useMemo(()=>{
    const v = q.trim().toLowerCase();
    if (!v) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(v));
  }, [q, clients]);

  const historyFor = (cid) => {
    const A = appts.filter(a=>a.client_id===cid).map(a=>({ type:"appt", at:a.start_at, title:`Agendamento: ${a.service}`, sub:`${fmtDate(a.start_at)} ${fmtTime(a.start_at)}–${fmtTime(a.end_at)} ${a.location||""}` }));
    const R = recs.filter(r=>r.client_id===cid).map(r=>({ type:"rec", at:new Date(r.due_date).getTime(), title:`Recebível: R$ ${Number(r.amount).toFixed(2)} (${r.status})`, sub:`Venc.: ${new Date(r.due_date).toLocaleDateString("pt-BR")} • ${r.method}` }));
    const P = pays.map(p=>({ type:"pay", at:new Date(p.due_date).getTime(), title:`Pagamento: R$ ${Number(p.amount).toFixed(2)} (${p.status})`, sub:`${p.description} • Venc.: ${new Date(p.due_date).toLocaleDateString("pt-BR")}` }));
    return [...A, ...R, ...P].sort((a,b)=>b.at-a.at);
  };

  const selected = clients.find(c=>c.id===openHist);

  return (
    <div className="stack fade-in">
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{fontWeight:800, fontSize:18}}>Clientes</div>
            <div className="muted" style={{fontSize:12}}>Buscar e ver histórico</div>
          </div>
          <input className="input" placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)} style={{width:220}}/>
        </div>
      </div>

      <div className="card slide-up">
        <div className="table-card">
          {list.length===0 && <div className="muted">Nenhum cliente encontrado.</div>}
          {list.map((c,i)=>(
            <div key={c.id} className="table-row fade-in">
              <div style={{flex:1}}><strong>{c.name}</strong></div>
              <div className="muted">{c.phone||""}</div>
              <div className="muted">{c.address||""}</div>
              <button className="btn ripple" onClick={()=>setOpenHist(c.id)}>Histórico</button>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!openHist} onClose={()=>setOpenHist(null)} title={selected ? `Histórico — ${selected.name}` : "Histórico"}>
        <div className="stack">
          {selected && historyFor(selected.id).length===0 && <div className="muted">Sem movimentações.</div>}
          {selected && historyFor(selected.id).map((h,idx)=>(
            <div key={idx} className="fade-in" style={{borderTop: idx? '1px solid var(--border)':'none', paddingTop: idx?8:0}}>
              <div><strong>{h.title}</strong></div>
              <div className="muted" style={{fontSize:12}}>{new Date(h.at).toLocaleString("pt-BR")} • {h.sub}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
