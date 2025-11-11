import React, { useState } from "react";
import TopBar from "./components/TopBar.jsx";
import Hoje from "./pages/Hoje.jsx";
import Agenda from "./pages/Agenda.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Clientes from "./pages/Clientes.jsx";
import Config from "./pages/Config.jsx";

export default function App() {
  const [tab, setTab] = useState("hoje");

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="logo">App do Prestador</div>
          <div className="tabs">
            {[
              ["hoje", "Hoje"],
              ["agenda", "Agenda"],
              ["financeiro", "Financeiro"],
              ["clientes", "Clientes"],
              ["config", "Config"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`tab ${tab === key ? "active" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16 }}>
        {tab === "hoje" && <Hoje />}
        {tab === "agenda" && <Agenda />}
        {tab === "financeiro" && <Financeiro />}
        {tab === "clientes" && <Clientes />}
        {tab === "config" && <Config />}
      </div>

      {/* Botão flutuante de exemplo */}
      <div style={{ position: "fixed", right: 20, bottom: 20 }}>
        <button className="btn primary">+ Novo</button>
      </div>
    </>
  );
}
