import React, { useState } from "react";
import Hoje from "./pages/Hoje.jsx";
import Agenda from "./pages/Agenda.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Clientes from "./pages/Clientes.jsx";
import Config from "./pages/Config.jsx";
import Header from "./components/Header.jsx";
import MobileTabBar from "./components/MobileTabBar.jsx";
import "./styles.css";

export default function App() {
  const [tab, setTab] = useState("hoje");

  return (
    <div className="app">
      {/* Topo compacto com identidade visual */}
      <Header />

      {/* Conteúdo principal (já com padding para não colidir com a tab bar fixa) */}
      <main className="main">
        {tab === "hoje" && <Hoje />}
        {tab === "agenda" && <Agenda />}
        {tab === "financeiro" && <Financeiro />}
        {tab === "clientes" && <Clientes />}
        {tab === "config" && <Config />}
      </main>

      {/* Navegação inferior mobile-first */}
      <MobileTabBar tab={tab} setTab={setTab} />

      {/* Ação principal (flutuante) */}
      <div style={{ position: "fixed", right: 16, bottom: 88, zIndex: 50 }}>
        <button className="btn primary">+ Novo</button>
      </div>
    </div>
  );
}
