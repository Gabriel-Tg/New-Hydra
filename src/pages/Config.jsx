import React from "react";
import { useStore } from "../lib/store.jsx";
import { db } from "../lib/db.js";

export default function Config() {
  const resetAll = useStore(s=>s.resetAll);

  const clearLocalData = async () => {
    if (!confirm("Isso vai limpar dados locais do app. Continuar?")) return;

    resetAll();
    sessionStorage.removeItem("pedidos_v1");
    sessionStorage.removeItem("orcamentos_v1");

    try {
      await db.delete();
    } catch (err) {
      console.warn("Falha ao limpar IndexedDB", err);
    }

    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (err) {
        console.warn("Falha ao limpar cache", err);
      }
    }

    if ("serviceWorker" in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch (err) {
        console.warn("Falha ao remover service workers", err);
      }
    }

    window.location.reload();
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Configurações</div>
      <div>• Horários de trabalho</div>
      <div>• Mensagens padrão (WhatsApp)</div>
      <div>• Formas de pagamento</div>
      <div>• Categorias</div>
      <div style={{ marginTop: 16 }}>
        <button className="btn ripple" onClick={clearLocalData}>
          Limpar dados locais
        </button>
      </div>
    </div>
  );
}
