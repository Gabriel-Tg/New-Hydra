import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { formatCents } from "../lib/money.js";
import { fmtDate, toDateOnlyTs } from "../lib/date.jsx";
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

  const [type, setType] = useState("rec-open");
  const [date, setDate] = useState(() => toISO(new Date()));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("pix");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isReceivable = type.startsWith("rec");
  const isPaid = type.endsWith("paid");

  const entries = useMemo(() => {
    const recs = (receivables || []).map((r) => ({
      id: r.id,
      date: r.due_date,
      description: r.description || "Recebimento",
      amount_cents: r.amount_cents,
      type: r.status === "paid" ? "Recebido" : "A receber",
      customer: r.customer,
      method: r.method,
      filterKey: `rec-${r.status}`,
    }));
    const pays = (payables || []).map((p) => ({
      id: p.id,
      date: p.due_date,
      description: p.description,
      amount_cents: p.amount_cents,
      type: p.status === "paid" ? "Pago" : "A pagar",
      customer: "-",
      method: p.method,
      filterKey: `pay-${p.status}`,
    }));
    return [...recs, ...pays].sort((a, b) => toDateOnlyTs(b.date) - toDateOnlyTs(a.date));
  }, [receivables, payables]);

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((item) => item.filterKey === filter);
  }, [entries, filter]);

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!description.trim()) {
      const msg = "Descricao obrigatoria";
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: msg });
      return;
    }
    if (isReceivable && !customer.trim()) {
      const msg = "Cliente obrigatorio";
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: msg });
      return;
    }
    setSaving(true);
    try {
      const status = isPaid ? "paid" : "open";
      const paid_at = isPaid ? toDateOnlyTs(date) : undefined;
      console.log("submit lancamento ->", { type, date, description, amount, customer, status, method });
      if (isReceivable) {
        await addReceivable({
          customer,
          due_date: date,
          amount,
          method,
          description,
          status,
          paid_at,
        });
      } else {
        await addPayable({
          description,
          due_date: date,
          amount,
          category: "Geral",
          method,
          status,
          paid_at,
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
      console.error("erro ao salvar lancamento:", err);
      setErrorMsg(msg);
      useStore.getState().pushToast({ type: "error", title: "Erro ao salvar", desc: msg });
    }
  };

  return (
    <div className="stack fade-in page-bottom-safe">
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
                <option value="rec-open">A receber</option>
                <option value="rec-paid">Recebido</option>
                <option value="pay-open">A pagar</option>
                <option value="pay-paid">Pago</option>
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
            {isReceivable ? (
              <ClientAutocomplete value={customer} onChange={setCustomer} placeholder="Cliente" />
            ) : (
              <input className="input" placeholder="Cliente" value="-" disabled />
            )}
          </div>

          <div className="stack">
            <label className="muted" style={{ fontSize: 12 }}>Forma de pagamento</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="pix">Pix</option>
              <option value="card">Cartao</option>
              <option value="cash">Dinheiro</option>
              <option value="boleto">Boleto</option>
            </select>
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

      <div className="card slide-up">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div className="stack" style={{ gap: 4 }}>
            <div style={{ fontWeight: 700 }}>Filtro</div>
            <div className="muted" style={{ fontSize: 12 }}>Selecione quais lancamentos exibir.</div>
          </div>
          <div className="stack" style={{ minWidth: 220, gap: 6 }}>
            <label className="muted" style={{ fontSize: 12 }}>Mostrar</label>
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="rec-open">A receber</option>
              <option value="rec-paid">Recebidos</option>
              <option value="pay-open">A pagar</option>
              <option value="pay-paid">Pagos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card slide-up" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th className="right">Valor</th>
              <th>Tipo</th>
              <th>Forma</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan="6" className="muted" style={{ padding: 16 }}>
                  Nenhum lancamento cadastrado.
                </td>
              </tr>
            )}
            {filteredEntries.map((item) => (
              <tr key={item.id}>
                <td>{fmtDate(item.date)}</td>
                <td>{item.description}</td>
                <td style={{ textAlign: "right" }}>{formatCents(item.amount_cents)}</td>
                <td>{item.type}</td>
                <td>{item.method || "-"}</td>
                <td>{item.customer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
