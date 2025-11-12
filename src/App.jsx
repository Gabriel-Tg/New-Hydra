import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const idx = useMemo(()=> TABS.findIndex(t=>t.key===tab), [tab]);

  // título dinâmico no header
  const screenTitle = useMemo(()=> (TABS.find(t=>t.key===tab)?.label || "Início"), [tab]);

  // swipe - só em telas <= 900px
  const trackRef = useRef(null);
  const touch = useRef({ x0:0, x:0, dragging:false });

  const onTouchStart = (e)=>{
    if (window.innerWidth > 900) return;
    const x = e.touches[0].clientX;
    touch.current = { x0:x, x, dragging:true };
  };
  const onTouchMove = (e)=>{
    if (!touch.current.dragging) return;
    touch.current.x = e.touches[0].clientX;
    const dx = touch.current.x - touch.current.x0;
    if (trackRef.current){
      trackRef.current.style.transition = "none";
      const base = -idx * 100;
      trackRef.current.style.transform = `translateX(calc(${base}vw + ${dx}px))`;
    }
  };
  const onTouchEnd = ()=>{
    if (!touch.current.dragging) return;
    const dx = touch.current.x - touch.current.x0;
    const threshold = 60; // px
    let next = idx;
    if (dx < -threshold) next = Math.min(idx+1, TABS.length-1);
    if (dx > threshold)  next = Math.max(idx-1, 0);
    setTab(TABS[next].key);
    if (trackRef.current){
      trackRef.current.style.transition = "";
      trackRef.current.style.transform = `translateX(-${next*100}vw)`;
    }
    touch.current.dragging = false;
  };

  // sincroniza transform quando muda tab (ex.: clique na tabbar)
  useEffect(()=>{
    if (trackRef.current){
      trackRef.current.style.transition = "transform 320ms cubic-bezier(.22,.61,.36,1)";
      trackRef.current.style.transform = `translateX(-${idx*100}vw)`;
    }
  }, [idx]);

  // integra botões "A Receber/A Pagar/Fluxo" (eventinho simples)
  useEffect(()=>{
    const h = (e)=>{
      if (typeof e.detail !== "string") return;
      if (!e.detail.startsWith("financeiro:")) return;
      setTab("financeiro");
    };
    window.addEventListener("app:setTab", h);
    return ()=> window.removeEventListener("app:setTab", h);
  }, []);

  return (
    <div className="app">
      <Header screenTitle={screenTitle} />

      {/* Viewstack com swipe no mobile */}
      <main className="main" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div
          ref={trackRef}
          className="views-track"
          style={{ width: `calc(${TABS.length} * 100vw)` }}
        >
          {TABS.map(({ key, component:Comp })=>(
            <section key={key} className="view">
              {tab===key ? <Comp/> : <Comp/> /* mantém simples; pode lazy-load depois */}
            </section>
          ))}
        </div>
      </main>

      <MobileTabBar tab={tab} setTab={setTab} />
      <NewMenu />
      <Toast />
    </div>
  );
}
