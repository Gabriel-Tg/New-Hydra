import React, { useState } from "react";
import KpiCard from "../components/KpiCard.jsx";
import FinanceTable from "../components/FinanceTable.jsx";
import { useStore } from "../lib/store.jsx";

export default function Financeiro() {
  const receivables = useStore((s) => s.receivables);
  const payables = useStore((s) => s.payables);
  const markRecPaid = useStore((s) => s.markRecPaid);
  const markPayPaid = useStore((s) => s.markPayPaid);

  const recOpen = receivables.filter((r) => r.status !== "paid");
  const payOpen = payables.filter((p) => p.status !== "paid");
  const totalRec = recOpen.reduce((s, r) => s + r.amount, 0);
  const totalPay = payOpen.reduce((s, p) => s + p.amount, 0);
  const saldoPrev = totalRec - totalPay;

  const [tab, setTab] = useState("receber");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${tab === "receber" ? "primary" : ""}`} onClick={() => setTab("receber")}>A Receber</button>
        <button className={`btn ${tab === "pagar" ? "primary" : ""}`} onClick={() => setTab("pagar")}>A Pagar</button>
      </div>

      <div className="row">
        <KpiCard label="Aberto a receber" value={`R$ ${totalRec.toFixed(2)}`} />
        <KpiCard label="Aberto a pagar" value={`R$ ${totalPay.toFixed(2)}`} />
        <KpiCard label="Saldo previsto" value={`R$ ${saldoPrev.toFixed(2)}`} />
      </div>

      <div style={{ height: 12 }} />
      {tab === "receber" ? (
        <FinanceTable rows={recOpen} type="receber" onMark={markRecPaid} />
      ) : (
        <FinanceTable rows={payOpen} type="pagar" onMark={markPayPaid} />
      )}
    </div>
  );
}
