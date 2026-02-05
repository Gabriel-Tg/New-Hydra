import React from "react";
import { supabase } from "../lib/supabase.js";

export default function Config() {
  const signOut = async () => {
    if (!confirm("Deseja sair da sua conta?")) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Configurações</div>
      <div>• Horários de trabalho</div>
      <div>• Mensagens padrão (WhatsApp)</div>
      <div>• Formas de pagamento</div>
      <div>• Categorias</div>
      <div style={{ marginTop: 16 }}>
        <button className="btn ripple" onClick={signOut}>Sair</button>
      </div>
    </div>
  );
}
