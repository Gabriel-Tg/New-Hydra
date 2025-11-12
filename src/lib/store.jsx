import { create } from "zustand";

const LS_KEY = "nh_store_v1";

const uid = (p="id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};
const save = (state) => {
  const { clients, appts, receivables, payables } = state;
  localStorage.setItem(LS_KEY, JSON.stringify({ clients, appts, receivables, payables }));
};

const initial = (() => {
  const persisted = load();
  return {
    clients: persisted.clients || [
      { id:"c1", name:"Ana Souza", phone:"", address:"" },
      { id:"c2", name:"Bruno Lima", phone:"", address:"" },
    ],
    appts: persisted.appts || [],
    receivables: persisted.receivables || [],
    payables: persisted.payables || [],
  };
})();

export const useStore = create((set, get) => ({
  ...initial,

  /** CLIENTES */
  addClientIfMissing: (name) => {
    const s = get();
    if (!name?.trim()) return null;
    const found = s.clients.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (found) return found.id;
    const id = uid("c");
    const next = [...s.clients, { id, name: name.trim(), phone:"", address:"" }];
    set({ clients: next });
    save({ ...get(), clients: next });
    return id;
  },

  /** AGENDAMENTOS */
  addAppointment: (data) => {
    const s = get();
    const client_id = data.client_id || get().addClientIfMissing(data.client_name);
    const appt = {
      id: uid("a"),
      client_id,
      service: data.service || "",
      start_at: new Date(`${data.date}T${data.start}:00`).getTime(),
      end_at: new Date(`${data.date}T${data.end}:00`).getTime(),
      status: "confirmed",
      location: data.location || "",
      notes: data.notes || ""
    };
    const next = [...s.appts, appt];
    set({ appts: next });
    save({ ...get(), appts: next });
  },

  /** RECEBÍVEIS */
  addReceivable: (data) => {
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
    const next = [...s.receivables, rec];
    set({ receivables: next });
    save({ ...get(), receivables: next });
  },
  markRecPaid: (id) => {
    const next = get().receivables.map(r => r.id===id ? { ...r, status:"paid" } : r);
    set({ receivables: next });
    save({ ...get(), receivables: next });
  },

  /** PAGÁVEIS */
  addPayable: (data) => {
    const s = get();
    const pay = {
      id: uid("p"),
      description: data.description,
      due_date: new Date(`${data.due_date}T00:00:00`).getTime(),
      amount: Number(data.amount || 0),
      status: "open",
      category: data.category || "Geral",
    };
    const next = [...s.payables, pay];
    set({ payables: next });
    save({ ...get(), payables: next });
  },
  markPayPaid: (id) => {
    const next = get().payables.map(p => p.id===id ? { ...p, status:"paid" } : p);
    set({ payables: next });
    save({ ...get(), payables: next });
  },
}));
