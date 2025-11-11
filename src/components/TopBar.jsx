import React from "react";

export default function TopBar({ title, right }) {
  return (
    <div className="card" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700 }}>{title || "App do Prestador"}</div>
        <div>{right}</div>
      </div>
    </div>
  );
}
