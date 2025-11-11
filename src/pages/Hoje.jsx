import React from "react";
import KpiCard from "../components/KpiCard.jsx";
import AppointmentCard from "../components/AppointmentCard.jsx";
import FinanceTable from "../components/FinanceTable.jsx";
import { useStore } from "../lib/store.jsx";
import { isSameDay } from "../lib/date.jsx";

export default function Hoje() {
  const appts = useStore((s) => s.appts);
  const receivables = useStore((s) => s.receivables);
  const payables = useStore((s) => s.payables);
  const markRecPaid = useStore((s) => s.markRecPaid);
  const markPayPaid = useStore((s) => s.markPayPaid);

  const today = new Date();
  const todayList = appts.filter((a) => isSameDay(a.start_at, today)).sort((a,b)=>a.start_at-b.start_at);
  const recToday = receivables.filter((r) => isSameDay(r.due_date, today));
  const payToday = payables.filter((p) => isSameDay(p.due_date, today));
  const totalIn = recToday.reduce((s, r) => s + r.amount, 0);
  const totalOut = payToday.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="row">
        <KpiCard label="Atendimentos hoje" value={todayList.length} />
        <KpiCard label="Receber hoje" value={`R$ ${totalIn.toFixed(2)}`} sub={`${recToday.length} títulos`} />
        <KpiCard label="Pagar hoje" value={`R$ ${totalOut.toFixed(2)}`} sub={`${payToday.length} contas`} />
        <KpiCard label="Saldo (prev.)" value={`R$ ${(totalIn - totalOut).toFixed(2)}`} />
      </div>

      <div style={{ height: 12 }} />
      {todayList.length === 0 && <div className="muted">Sem atendimentos hoje.</div>}
      {todayList.map((a) => <AppointmentCard key={a.id} appt={a} />)}

      <div style={{ height: 12 }} />
      <FinanceTable rows={recToday} type="receber" onMark={markRecPaid} />
      <div style={{ height: 12 }} />
      <FinanceTable rows={payToday} type="pagar" onMark={markPayPaid} />
    </div>
  );
}
