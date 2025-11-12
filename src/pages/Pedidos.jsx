import React from "react";

export default function Pedidos(){
  return (
    <div className="stack fade-in">
      <div className="card">
        <div style={{fontWeight:800, fontSize:18}}>Pedido de materiais</div>
        <div className="muted" style={{fontSize:12}}>Registre e acompanhe pedidos aos fornecedores.</div>
      </div>

      <div className="card">
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <input className="input" placeholder="Fornecedor" />
          <input className="input" placeholder="Item / Descrição" />
          <input className="input" type="number" step="1" placeholder="Qtd" style={{maxWidth:120}} />
          <button className="btn primary ripple">Adicionar</button>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700, marginBottom:8}}>Pedidos recentes</div>
        <div className="table-card">
          <div className="muted">Sem pedidos no momento.</div>
        </div>
      </div>
    </div>
  );
}
