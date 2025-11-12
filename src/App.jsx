import React, { useMemo, useState } from "react";
import "./styles.mobile.css";
import "./styles.desktop.css";
import Header from "./components/Header.jsx";
import MobileTabBar from "./components/MobileTabBar.jsx";
import Inicio from "./pages/Inicio.jsx";
import Agenda from "./pages/Agenda.jsx";
import Financeiro from "./pages/Financeiro.jsx";
import Clientes from "./pages/Clientes.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Orcamentos from "./pages/Orcamentos.jsx";
import NewMenu from "./components/NewMenu.jsx";
import Toast from "./components/Toast.jsx";

const TABS = [
  { key:"inicio", label:"Início", component: Inicio },
  { key:"agenda", label:"Agenda", component: Agenda },
  { key:"financeiro", label:"Financeiro", component: Financeiro },
  { key:"clientes", label:"Clientes", component: Clientes },
  { key:"pedidos", label:"Pedido de materiais", component: Pedidos },
  { key:"orcamentos", label:"Orçamentos", component: Orcamentos },
];

export default function App() {
  const [tab, setTab] = useState("inicio");
  const screenTitle = useMemo(
    () => TABS.find(t => t.key === tab)?.label || "Início",
    [tab]
  );
  const Active = useMemo(() => TABS.find(t => t.key === tab)?.component || Inicio, [tab]);

  return (
    <div className="app">
      <Header screenTitle={screenTitle} />
      <main className="main">
        <Active />
      </main>
      <MobileTabBar tab={tab} setTab={setTab} />
      <NewMenu />
      <Toast />
    </div>
  );
}
