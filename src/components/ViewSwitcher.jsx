import React from "react";

export default function ViewSwitcher({ view, setView }) {
  const opts = [
    { key: "day", label: "Dia" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
  ];
  return (
    <div className="switch">
      {opts.map((o) => (
        <button
          key={o.key}
          className={view === o.key ? "active" : ""}
          onClick={() => setView(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
