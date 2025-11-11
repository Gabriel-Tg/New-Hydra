import React, { useState } from "react";
import ViewSwitcher from "../components/ViewSwitcher.jsx";
import AppointmentCard from "../components/AppointmentCard.jsx";
import { useStore } from "../lib/store.jsx";
import { addDays, endOfWeek, fmtDate, isSameDay, isSameMonth, rangeDays, startOfWeek } from "../lib/date.jsx";

export default function Agenda() {
  const appts = useStore((s) => s.appts);
  const [view, setView] = useState("week"); // "day" | "week" | "month"
  const [date, setDate] = useState(new Date());

  const next = () => setDate(addDays(date, view === "day" ? 1 : view === "week" ? 7 : 30));
  const prev = () => setDate(addDays(date, view === "day" ? -1 : view === "week" ? -7 : -30));
  const reset = () => setDate(new Date());

  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  const weekDays = rangeDays(weekStart, weekEnd);

  const dayList = appts.filter((a) => isSameDay(a.start_at, date)).sort((a,b)=>a.start_at-b.start_at);
  const weekList = appts.filter((a) => a.start_at >= weekStart && a.start_at <= weekEnd).sort((a,b)=>a.start_at-b.start_at);
  const monthFirst = new Date(date.getFullYear(), date.getMonth(), 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={prev}>◀</button>
          <button className="btn" onClick={reset}>Hoje</button>
          <button className="btn" onClick={next}>▶</button>
          <div className="muted" style={{ marginLeft: 8 }}>{fmtDate(date)}</div>
        </div>
        <ViewSwitcher view={view} setView={setView} />
      </div>

      {view === "day" && (
        <div>
          {dayList.length === 0 && <div className="muted">Sem atendimentos neste dia.</div>}
          {dayList.map((a) => <AppointmentCard key={a.id} appt={a} />)}
        </div>
      )}

      {view === "week" && (
        <div className="row" style={{ flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700 }}>{fmtDate(weekStart)} – {fmtDate(weekEnd)}</div>
          {weekDays.map((d) => {
            const list = weekList.filter((a) => isSameDay(a.start_at, d));
            return (
              <div key={d.toISOString()} className="card">
                <div style={{ fontWeight: 600 }}>{fmtDate(d)}</div>
                <div style={{ marginTop: 8 }}>
                  {list.length === 0
                    ? <div className="muted">Sem atendimentos</div>
                    : list.map((a) => <AppointmentCard key={a.id} appt={a} compact />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {monthFirst.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
          </div>
          <div className="muted">Visão mensal resumida (pode ser expandida depois).</div>
        </div>
      )}
    </div>
  );
}
