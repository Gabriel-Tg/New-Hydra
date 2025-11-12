import React from "react";

export default function Orcamentos(){
  return (
    <div className="stack fade-in">
      <div className="card">
        <div style={{fontWeight:800, fontSize:18}}>Orçamentos</div>
        <div className="muted" style={{fontSize:12}}>Crie orçamentos e acompanhe aprovação do cliente.</div>
      </div>

      <div className="card">
        <div style={{display:"grid", gap:8}}>
          <input className="input" placeholder="Cliente" />
          <input className="input" placeholder="Serviço" />
          <div style={{display:"flex", gap:8}}>
            <input className="input" type="number" step="0.01" placeholder="Valor (R$)" />
            <button className="btn primary ripple">Gerar orçamento</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>Meus orçamentos</div>
        <div className="table-card">
          <div className="muted">Nenhum orçamento criado ainda.</div>
        </div>
      </div>
    </div>
  );
}
