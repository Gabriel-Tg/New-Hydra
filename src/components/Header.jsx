import React from "react";

export default function Header({ screenTitle = "Início" }) {
  return (
    <header className="header">
      <div className="header-inner">
        <img
          src="/Logo.png"
          alt="New Hydra"
          className="brand-logo"
          onError={(e)=>{ e.currentTarget.src = "/Logo.png"; }}
        />
        <div>
          <div className="header-title">New Hydra</div>
          <div className="header-sub">{screenTitle}</div>
        </div>
      </div>
    </header>
  );
}
