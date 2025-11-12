import React from "react";

export default function Header({ screenTitle = "Início" }) {
  return (
    <header className="header">
      <div className="header-inner">
        <img
          src="/Logotipo NewHydra.jpeg"
          alt="New Hydra"
          className="brand-logo"
          onError={(e)=>{ e.currentTarget.src = "/Logotipo NewHydra.jpeg"; }}
        />
        <div>
          <div className="header-title">New Hydra</div>
          <div className="header-sub">{screenTitle}</div>
        </div>
      </div>
    </header>
  );
}
