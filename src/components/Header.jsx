import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* bolinha com gradiente e iniciais (CHRIS) */}
        <div className="brand-badge">CHRIS</div>
        <div>
          <div className="header-title">New Hydra</div>
          <div className="header-sub">Agenda • Financeiro • Clientes</div>
        </div>
      </div>
    </header>
  );
}
