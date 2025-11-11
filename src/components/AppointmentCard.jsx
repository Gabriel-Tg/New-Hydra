import React from "react";
import { fmtDate, fmtTime } from "../lib/date.jsx";
import { useStore } from "../lib/store.jsx";

export default function AppointmentCard({ appt, compact=false }) {
  const clients = useStore((s) => s.clients);
  const services = useStore((s) => s.services);
  const markApptDone = useStore((s) => s.markApptDone);

  const client = clients.find((c) => c.id === appt.client_id);
  const service = services.find((s) => s.id === appt.service_id);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge ${appt.status}`}>{appt.status}</span>
          <div style={{ fontWeight: 700 }}>{client?.name}</div>
        </div>
        <div className="muted">
          {fmtDate(appt.start_at)} • {fmtTime(appt.start_at)}–{fmtTime(appt.end_at)}
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        {service?.name} • {service?.duration}min • R$ {service?.price.toFixed(2)}
      </div>
      {appt.location && <div className="muted" style={{ fontSize: 12 }}>{appt.location}</div>}
      {appt.notes && <div className="muted" style={{ fontSize: 12 }}>Notas: {appt.notes}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn">Confirmar</button>
        <button className="btn">Reagendar</button>
        <button className="btn primary" onClick={() => markApptDone(appt.id)}>Concluir</button>
      </div>
    </div>
  );
}
