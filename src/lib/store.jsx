import { create } from "zustand";

const LS_KEY = "nh_store_v2";
const uid = (p="id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};
const persist = (next) => localStorage.setItem(LS_KEY, JSON.stringify(next));

const initial = (() => {
  const p = load();
  return {
    clients: p.clients || [],
    appts: p.appts || [],
    receivables: p.receivables || [],
    payables: p.payables || [],
    cashOpening: p.cashOpening || {}, // { '2025-11': 1000 }
  };
})();

export const useStore = create((set, get) => ({
  ...initial,

  // ---------- helpers ----------
  _save(partial) {
    const next = { ...get(), ...partial };
    persist({
      clients: next.clients,
      appts: next.appts,
      receivables: next.receivables,
      payables: next.payables,
      cashOpening: next.cashOpening,
    });
    set(partial);
  },

  // ---------- Clients ----------
  addClientIfMissing(name) {
    if (!name?.trim()) return null;
    const s = get();
    const found = s.clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (found) return found.id;
    const id = uid("c");
    this._save({ clients: [...s.clients, { id, name: name.trim(), phone:"", address:"" }] });
    return id;
  },

  // ---------- Appointments ----------
  addAppointment(data) {
    const s = get();
    const client_id = data.client_id || get().addClientIfMissing(data.client_name);
    const appt = {
      id: uid("a"),
      client_id,
      service: data.service || "",
      start_at: new Date(`${data.date}T${data.start}:00`).getTime(),
      end_at: new Date(`${data.date}T${data.end}:00`).getTime(),
      status: "pending", // padrão: pendente
      location: data.location || "",
      notes: data.notes || ""
    };
    this._save({ appts: [...s.appts, appt] });
  },
  confirmAppointment(id) {
    const appts = get().appts.map(a => a.id===id ? { ...a, status:"confirmed" } : a);
    get()._save({ appts });
  },
  rescheduleAppointment(id, { date, start, end }) {
    const start_at = new Date(`${date}T${start}:00`).getTime();
    const end_at = new Date(`${date}T${end}:00`).getTime();
    const appts = get().appts.map(a => a.id===id ? { ...a, start_at, end_at, status:"confirmed" } : a);
    get()._save({ appts });
  },
  completeAppointment(id) {
    // concluiu = removemos da agenda (poderia marcar 'done'; aqui removemos como você pediu)
    const appts = get().appts.filter(a => a.id!==id);
    get()._save({ appts });
  },

  // ---------- Receivables ----------
  addReceivable(data) {
    const s = get();
    const client_id = get().addClientIfMissing(data.customer);
    const rec = {
      id: uid("r"),
      customer: data.customer,
      client_id,
      due_date: new Date(`${data.due_date}T00:00:00`).getTime(),
      amount: Number(data.amount || 0),
      status: "open",
      method: data.method || "pix",
    };
    this._save({ receivables: [...s.receivables, rec] });
  },
  markRecPaid(id) {
    const receivables = get().receivables.map(r => r.id===id ? { ...r, status:"paid" } : r);
    get()._save({ receivables });
  },

  // ---------- Payables ----------
  addPayable(data) {
    const s = get();
    const pay = {
      id: uid("p"),
      description: data.description,
      due_date: new Date(`${data.due_date}T00:00:00`).getTime(),
      amount: Number(data.amount || 0),
      status: "open",
      category: data.category || "Geral",
    };
    this._save({ payables: [...s.payables, pay] });
  },
  markPayPaid(id) {
    const payables = get().payables.map(p => p.id===id ? { ...p, status:"paid" } : p);
    get()._save({ payables });
  },

  // ---------- Cash flow ----------
  setCashOpening(ym, value) {
    const cashOpening = { ...get().cashOpening, [ym]: Number(value||0) };
    get()._save({ cashOpening });
  }
}));
