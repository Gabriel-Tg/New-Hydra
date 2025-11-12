import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Substitui o texto CHRIS pelo logo */}
        <img
          src="/Logotipo NewHydra.jpeg"
          alt="New Hydra"
          className="brand-logo"
          onError={(e) => {
            e.currentTarget.src = "/Logotipo NewHydra.jpeg";
          }}
        />
        <div>
          <div className="header-title">New Hydra</div>
          <div className="header-sub">Agenda • Financeiro • Clientes</div>
        </div>
      </div>
    </header>
  );
}
