import React from "react";

export default function MobileTabBar({ tab, setTab }) {
  const tabs = [
    ["inicio","Início"],
    ["agenda","Agenda"],
    ["financeiro","Finanças"],
    ["clientes","Clientes"],
  ];
  return (
    <nav className="tabbar">
      {tabs.map(([k,label])=>(
        <button
          key={k}
          className={`tab-btn ${tab===k ? "active":""}`}
          onClick={()=>setTab(k)}
        >
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
