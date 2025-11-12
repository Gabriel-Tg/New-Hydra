import React from "react";

const Icon = {
  inicio: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  agenda: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  financeiro: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="16" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 7l10 10" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  clientes: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  pedidos: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  orcamentos: (a)=>(
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 4h10l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 13h6M9 17h6M9 9h3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
};

const tabs = [
  { key:"inicio", icon:Icon.inicio },
  { key:"agenda", icon:Icon.agenda },
  { key:"financeiro", icon:Icon.financeiro },
  { key:"clientes", icon:Icon.clientes },
  { key:"pedidos", icon:Icon.pedidos },
  { key:"orcamentos", icon:Icon.orcamentos },
];

export default function MobileTabBar({ tab, setTab }){
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-btn ${tab===t.key?"active":""}`}
          onClick={()=>setTab(t.key)}
          aria-label={t.key}
          title={t.key}
        >
          {t.icon(tab===t.key)}
        </button>
      ))}
    </nav>
  );
}
