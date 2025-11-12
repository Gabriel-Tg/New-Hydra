import React from "react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(15,23,42,.35)",
      display:"grid", placeItems:"center", zIndex:100
    }}
      onClick={onClose}
    >
      <div className="card" style={{ width:"min(520px,92vw)" }} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:800}}>{title}</div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div className="stack">{children}</div>
      </div>
    </div>
  );
}
