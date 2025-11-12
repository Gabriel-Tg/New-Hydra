import React from "react";

export default function Modal({ open, onClose, title, children }){
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel slide-up">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <div style={{fontWeight:800}}>{title}</div>
          <button className="btn ghost" onClick={onClose}>Fechar</button>
        </div>
        <div className="stack">{children}</div>
      </div>
    </>
  );
}
