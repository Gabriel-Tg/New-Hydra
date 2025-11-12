import React, { useState } from "react";
import "./styles.css";
import Header from "./components/Header.jsx";
import MobileTabBar from "./components/MobileTabBar.jsx";
import Inicio from "./pages/Inicio.jsx";
import Agenda from "./pages/Agenda.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Clientes from "./pages/Clientes.jsx";
import Config from "./pages/Config.jsx";
import NewMenu from "./components/NewMenu.jsx";

export default function App() {
  const [tab, setTab] = useState("inicio");

  return (
    <div className="app">
      <Header />

      <main className="main">
        {tab === "inicio" && <Inicio />}
        {tab === "agenda" && <Agenda />}
        {tab === "financeiro" && <Financeiro />}
        {tab === "clientes" && <Clientes />}
        {tab === "config" && <Config />}
      </main>

      <MobileTabBar tab={tab} setTab={setTab} />
      <NewMenu />
    </div>
  );
}
