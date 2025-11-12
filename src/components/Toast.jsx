import React from "react";
import { useStore } from "../lib/store.jsx";

export default function Toast(){
  const toasts = useStore(s => s.uiToasts);
  if (!toasts?.length) return null;

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type} slide-up`}>
          <div style={{ fontWeight: 700 }}>{t.title}</div>
          {t.desc ? (
            <div style={{ opacity: 0.9, fontSize: 12 }}>{t.desc}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
