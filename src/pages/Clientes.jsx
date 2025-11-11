import React from "react";
import { useStore } from "../lib/store.jsx";

export default function Clientes() {
  const clients = useStore((s) => s.clients);
  return (
    <div className="row">
      {clients.map((c) => (
        <div key={c.id} className="card" style={{ width: "100%" }}>
          <div style={{ fontWeight: 700 }}>{c.name}</div>
          <div className="muted">{c.phone}</div>
          <div className="muted">{c.address}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn">Histórico</button>
            <button className="btn primary">Agendar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
