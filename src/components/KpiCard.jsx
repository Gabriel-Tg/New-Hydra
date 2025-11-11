import React from "react";

export default function KpiCard({ label, value, sub }) {
  return (
    <div className="kpi" style={{ minWidth: 180 }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}
