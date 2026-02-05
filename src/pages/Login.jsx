import React, { useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useStore } from "../lib/store.jsx";

export default function Login() {
  const pushToast = useStore((s) => s.pushToast);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      pushToast({ title: "Login realizado" });
    } catch (err) {
      pushToast({ type: "error", title: "Erro de autenticacao", desc: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack" style={{ padding: 16 }}>
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>Entrar</div>
        <div className="muted" style={{ fontSize: 12 }}>
          Use seu email e senha para acessar os dados.
        </div>
      </div>

      <div className="card slide-up">
        <form className="stack" onSubmit={submit}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className={`btn primary ripple ${loading ? "saving" : ""}`}>
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
