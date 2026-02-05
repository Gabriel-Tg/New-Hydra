import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { formatCents } from "../lib/money.js";
import { fmtDate } from "../lib/date.jsx";
import ClientAutocomplete from "../components/ClientAutocomplete.jsx";

const toISO = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

export default function Lancamentos() {
  const addReceivable = useStore((s) => s.addReceivable);
  const addPayable = useStore((s) => s.addPayable);
  const receivables = useStore((s) => s.receivables);
  const payables = useStore((s) => s.payables);

  const [type, setType] = useState("rec");
  const [date, setDate] = useState(() => toISO(new Date()));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const entries = useMemo(() => {
    const recs = (receivables || []).map((r) => ({
      id: r.id,
      date: r.due_date,
      description: r.description || "Recebimento",
      amount_cents: r.amount_cents,
      type: "A receber",
      customer: r.customer,
    }));
    const pays = (payables || []).map((p) => ({
      id: p.id,
      date: p.due_date,
      description: p.description,
      amount_cents: p.amount_cents,
      type: "A pagar",
      customer: "-",
    }));
    return [...recs, ...pays].sort((a, b) => b.date - a.date);
  }, [receivables, payables]);

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!description.trim()) {
      const msg = "Descricao obrigatoria";
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: msg });
      return;
    }
    if (type === "rec" && !customer.trim()) {
      const msg = "Cliente obrigatorio";
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: msg });
      return;
    }
    setSaving(true);
    try {
      if (type === "rec") {
        await addReceivable({
          customer,
          due_date: date,
          amount,
          method: "pix",
          description,
        });
      } else {
        await addPayable({
          description,
          due_date: date,
          amount,
          category: "Geral",
        });
      }
      setTimeout(() => {
        setSaving(false);
        setDescription("");
        setAmount("");
        setCustomer("");
      }, 200);
    } catch (err) {
      setSaving(false);
      const msg = err?.message || err?.details || "Erro ao salvar";
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: "Erro ao salvar", desc: msg });
    }
  };

  return (
    <div className="stack fade-in">
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>Lancamentos</div>
        <div className="muted" style={{ fontSize: 12 }}>
          Adicione novos lancamentos financeiros e veja o historico.
        </div>
      </div>

      <div className="card slide-up">
        <form className="stack" onSubmit={submit}>
          <div className="row">
            <div className="stack" style={{ flex: 1 }}>
              <label className="muted" style={{ fontSize: 12 }}>Data</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="stack" style={{ flex: 1 }}>
              <label className="muted" style={{ fontSize: 12 }}>Tipo</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="rec">A receber</option>
                <option value="pay">A pagar</option>
              </select>
            </div>
          </div>

          <input
            className="input"
            placeholder="Descricao"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="row">
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {type === "rec" ? (
              <ClientAutocomplete value={customer} onChange={setCustomer} placeholder="Cliente" />
            ) : (
              <input className="input" placeholder="Cliente" value="-" disabled />
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="submit" className={`btn primary ripple ${saving ? "saving" : ""}`}>
              Salvar
            </button>
          </div>
          {errorMsg && (
            <div className="muted" style={{ color: "#b91c1c", fontSize: 12 }}>
              {errorMsg}
            </div>
          )}
        </form>
      </div>

      <div className="card slide-up" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th className="right">Valor</th>
              <th>Tipo</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan="5" className="muted" style={{ padding: 16 }}>
                  Nenhum lancamento cadastrado.
                </td>
              </tr>
            )}
            {entries.map((item) => (
              <tr key={item.id}>
                <td>{fmtDate(item.date)}</td>
                <td>{item.description}</td>
                <td style={{ textAlign: "right" }}>{formatCents(item.amount_cents)}</td>
                <td>{item.type}</td>
                <td>{item.customer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
