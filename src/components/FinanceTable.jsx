import React from "react";
import { fmtDate } from "../lib/date.jsx";

export default function FinanceTable({ rows, type, onMark }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Descrição/Cliente</th>
            <th>Vencimento</th>
            <th className="right">Valor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.customer || r.description}</td>
              <td>{fmtDate(r.due_date)}</td>
              <td style={{ textAlign: "right" }}>R$ {r.amount.toFixed(2)}</td>
              <td><span className={`badge ${r.status}`}>{r.status}</span></td>
              <td style={{ textAlign: "right" }}>
                {r.status !== "paid" && (
                  <button className="btn primary" onClick={() => onMark && onMark(r.id)}>
                    {type === "receber" ? "Marcar pago" : "Pagar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
