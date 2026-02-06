import React, { useMemo, useState, useEffect } from "react";
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
import Lancamentos from "./pages/Lancamentos.jsx";
import Login from "./pages/Login.jsx";
import Toast from "./components/Toast.jsx";
import { supabase } from "./lib/supabase.js";
import { useStore } from "./lib/store.jsx";

const TABS = [
  { key:"inicio", label:"Início", component: Inicio },
  { key:"agenda", label:"Agenda", component: Agenda },
  { key:"financeiro", label:"Financeiro", component: Financeiro },
  { key:"lancamentos", label:"Lançamentos", component: Lancamentos },
  { key:"clientes", label:"Clientes", component: Clientes },
  { key:"pedidos", label:"Pedido de materiais", component: Pedidos },
  { key:"orcamentos", label:"Orçamentos", component: Orcamentos },
];

const ROUTES = {
  inicio: "/",
  agenda: "/agenda",
  financeiro: "/financeiro",
  lancamentos: "/lancamentos",
  clientes: "/clientes",
  pedidos: "/pedidos",
  orcamentos: "/orcamentos",
};

const tabFromPath = (path) => {
  const entry = Object.entries(ROUTES).find(([, p]) => p === path);
  return entry ? entry[0] : "inicio";
};

export default function App() {
  const [tab, setTab] = useState(() => tabFromPath(window.location.pathname));
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const screenTitle = useMemo(
    () => TABS.find(t => t.key === tab)?.label || "Início",
    [tab]
  );
  const Active = useMemo(() => TABS.find(t => t.key === tab)?.component || Inicio, [tab]);

  useEffect(() => {
    const onPop = () => setTab(tabFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const path = ROUTES[tab] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }, [tab]);

  useEffect(() => {
    const loadAllSafe = async (sess) => {
      if (!sess?.user?.id) return;
      try {
        await useStore.getState().loadAll(sess.user.id);
      } catch (err) {
        useStore.getState().pushToast({ type: "error", title: "Erro ao carregar dados", desc: err.message });
      }
    };

    setAuthReady(true);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log("supabase.getSession ->", data.session);
        setSession(data.session || null);
        useStore.getState().setSession(data.session || null);
        loadAllSafe(data.session);
      } catch (err) {
        useStore.getState().pushToast({ type: "error", title: "Falha ao iniciar", desc: err.message });
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      console.log("onAuthStateChange ->", _event, nextSession);
      setSession(nextSession || null);
      useStore.getState().setSession(nextSession || null);
      await loadAllSafe(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="app">
        <Header screenTitle="Carregando" />
        <main className="main">
          <div className="card">Carregando...</div>
        </main>
        <Toast />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app">
        <Header screenTitle="Login" />
        <main className="main">
          <Login />
        </main>
        <Toast />
      </div>
    );
  }

  return (
    <div className="app">
      <Header screenTitle={screenTitle} />
      <main className="main">
        <Active />
      </main>
      <MobileTabBar tab={tab} setTab={setTab} />
      <Toast />
    </div>
  );
}
